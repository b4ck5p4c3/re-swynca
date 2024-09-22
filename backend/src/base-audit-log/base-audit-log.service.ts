import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {AuditLogService} from "../audit-log/audit-log.service";
import {Interval} from "@nestjs/schedule";
import {AuditLog} from "../common/database/entities/audit-log.entity";
import {createBrotliCompress} from "zlib";
import {CompactEncrypt, importSPKI, KeyLike} from "jose";
import {readFileSync} from "fs";
import {
    AbstractSigner, Contract,
    copyRequest, getBytes, hexlify,
    JsonRpcProvider,
    Provider,
    Signer,
    Transaction,
    TransactionLike,
    TransactionRequest, TypedDataDomain, TypedDataField
} from "ethers";
import {BaseTransactionSignerService} from "../base-transaction-signer/base-transaction-signer.service";
import * as process from "node:process";

const DATABASE_FETCH_BATCH_SIZE = 10;

type ExternalSignerFunction = (data: Buffer) => Promise<Buffer>;

class ExternalSigner extends AbstractSigner {

    constructor(private readonly signerFunction: ExternalSignerFunction,
                private readonly signerAddress: string,
                provider?: null | Provider) {
        super(provider);
    }

    async getAddress(): Promise<string> {
        return this.signerAddress;
    }

    connect(provider: null | Provider): Signer {
        return new ExternalSigner(this.signerFunction, this.signerAddress, provider);
    }

    async signTransaction(tx: TransactionRequest): Promise<string> {
        tx = copyRequest(tx);
        if (tx.from && tx.from !== this.signerAddress) {
            throw new Error("Invalid .from in transaction");
        }
        const btx = Transaction.from(<TransactionLike>tx);
        if (btx.inferType() !== 1) {
            throw new Error("Only EIP-2930 transactions are supported");
        }

        const unsignedSerializedBytes = getBytes(btx.unsignedSerialized);

        return hexlify(await this.signerFunction(Buffer.from(unsignedSerializedBytes)));
    }

    signMessage(message: string | Uint8Array): Promise<string> {
        throw new Error("Method not implemented.");
    }

    signTypedData(domain: TypedDataDomain,
                  types: Record<string, Array<TypedDataField>>,
                  value: Record<string, any>): Promise<string> {
        throw new Error("Method not implemented.");
    }
}

@Injectable()
export class BaseAuditLogService implements OnModuleInit {
    private readonly logger = new Logger(BaseAuditLogService.name);
    private isCurrentlyPushing: boolean = false;
    private auditLogEncryptionPublicKey: KeyLike;
    private baseSignerAddress: string;
    private baseContractAddress: string;
    private readonly baseJsonRpcProviderUrl: string;

    constructor(private configService: ConfigService, private auditLogService: AuditLogService,
                private baseTransactionSignerService: BaseTransactionSignerService) {
        this.baseSignerAddress = configService.getOrThrow("BASE_SIGNER_ADDRESS");
        this.baseContractAddress = configService.getOrThrow("BASE_CONTRACT_ADDRESS");
        this.baseJsonRpcProviderUrl = configService.getOrThrow("BASE_JSON_RPC_PROVIDER_URL");
    }

    async onModuleInit(): Promise<void> {
        this.auditLogEncryptionPublicKey = await importSPKI(readFileSync(
            this.configService.getOrThrow("AUDIT_LOG_ENCRYPTION_PUBLIC_KEY_PATH"))
            .toString("utf-8"), "X25519");
        this.pushAuditLogs().catch(e => {
            this.logger.error(e);
        });
    }

    async compress(data: Buffer): Promise<Buffer> {
        const compressorStream = createBrotliCompress();
        compressorStream.write(data);
        compressorStream.end();
        const chunks: Buffer[] = [];
        for await (const chunk of compressorStream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }

    static toVarIntBytes(value: number): Buffer {
        const result: number[] = [];
        while (value > 0x7F) {
            result.push((value & 0xFF) | 0x80);
            value >>>= 7;
        }
        result.push(value | 0);
        return Buffer.from(result);
    }

    static packJwe(jwe: string): Buffer {
        const parts = jwe.split(".");
        const buffers = [];
        buffers.push(BaseAuditLogService.toVarIntBytes(parts.length));
        for (const part of parts) {
            const data = Buffer.from(part, "base64url");
            buffers.push(BaseAuditLogService.toVarIntBytes(data.length));
            buffers.push(data);
        }
        return Buffer.concat(buffers);
    }

    async packAndEncryptAuditLog(auditLog: AuditLog): Promise<Buffer> {
        const data = {
            id: auditLog.id,
            createdAt: auditLog.createdAt.toISOString(),
            actor: auditLog.actor.id,
            action: auditLog.action,
            data: auditLog.metadata
        };
        const rawData = Buffer.from(JSON.stringify(data), "utf-8");

        const compressedData = await this.compress(rawData);

        const jwe = await new CompactEncrypt(compressedData)
            .setProtectedHeader({
                alg: "ECDH-ES",
                enc: "A128GCM"
            })
            .encrypt(this.auditLogEncryptionPublicKey);

        return BaseAuditLogService.packJwe(jwe);
    }

    async pushAuditLog(data: Buffer): Promise<string> {
        const provider = new JsonRpcProvider(this.baseJsonRpcProviderUrl);
        const signer = new ExternalSigner(
            data => this.baseTransactionSignerService.signTransaction(data), this.baseSignerAddress);
        const connectedSigner = signer.connect(provider);
        const contract = new Contract(this.baseContractAddress, [{
            inputs: [
                {
                    internalType: "bytes",
                    name: "",
                    type: "bytes"
                }
            ],
            name: "audit",
            outputs: [],
            stateMutability: "payable",
            type: "function"
        }], connectedSigner);

        const estimatedGasLimit = await contract.audit.estimateGas(data);
        const unsignedTransaction = await contract.audit.populateTransaction(data);

        unsignedTransaction.chainId = (await provider.getNetwork()).chainId;
        unsignedTransaction.nonce = await provider.getTransactionCount(this.baseSignerAddress);
        const gasPrice = (await provider.getFeeData()).gasPrice;
        if (!gasPrice) {
            throw new Error("Gas price fetching failed");
        }
        unsignedTransaction.gasPrice = gasPrice;
        unsignedTransaction.gasLimit = estimatedGasLimit;
        const signedTransaction = await connectedSigner.signTransaction(unsignedTransaction);

        this.logger.log(`Sending transaction, nonce: ${unsignedTransaction.nonce}`);
        const transactionHash = await provider.send("eth_sendRawTransaction", [
            signedTransaction
        ]);

        this.logger.log(`Sent transaction ${transactionHash}, waiting for confirm`);
        await provider.waitForTransaction(transactionHash);
        return transactionHash;
    }

    @Interval(60 * 1000 * 1000)
    async pushAuditLogs(): Promise<void> {
        if (this.isCurrentlyPushing) {
            return;
        }
        this.isCurrentlyPushing = true;
        try {
            this.logger.log("Pushing Audit logs to NEAR");
            let offset = 0;
            while (await this.auditLogService.existsWithoutNearTransaction()) {
                const auditLogs = await this.auditLogService
                    .findAllWithoutNearTransaction(offset, DATABASE_FETCH_BATCH_SIZE);
                offset += DATABASE_FETCH_BATCH_SIZE;

                for (const auditLog of auditLogs) {
                    const encryptedAuditLog = await this.packAndEncryptAuditLog(auditLog);
                    try {
                        const transactionHash = await this.pushAuditLog(encryptedAuditLog);
                        this.logger.log(`Pushed audit log ${auditLog.id}: ${transactionHash}`);
                        auditLog.nearTransactionHash = transactionHash;
                        await this.auditLogService.update(auditLog);
                    } catch (e) {
                        throw e;
                    }
                }
            }
        } finally {
            this.isCurrentlyPushing = false;
        }
    }
}
import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {SerialPortWrapper} from "../common/serial-port-wrapper";

@Injectable()
export class BaseTransactionSignerService {
    private readonly baseSignerSerialPort: string;

    constructor(private configService: ConfigService) {
        this.baseSignerSerialPort = configService.getOrThrow("BASE_SIGNER_SERIAL_PORT");
    }

    static getChecksum(data: Buffer): number {
        let crc = 0xFFFFFFFF;
        for (const byte of data) {
            crc = (crc ^ byte) >>> 0;
            for (let i = 0; i < 8; i++) {
                crc = ((crc >>> 1) ^ (0xEDB88320 &
                    ((crc & 1) ? 0xFFFFFFFF : 0x00000000))) >>> 0;
            }
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    async signTransaction(transaction: Buffer): Promise<Buffer> {
        if (transaction.length > 65535) {
            throw new Error("Transaction length is too big");
        }

        const port = new SerialPortWrapper({
            path: this.baseSignerSerialPort,
            baudRate: 115200
        });

        try {
            await port.open();

            await port.write(Buffer.from([...Array(16)].map(_ => 0)));

            await port.write(Buffer.from([0x5A, 0xA5]));
            await port.write(Buffer.from([transaction.length & 0xFF, transaction.length >> 8]));
            await port.write(transaction);
            const checksum = BaseTransactionSignerService.getChecksum(transaction);
            await port.write(Buffer.from([checksum & 0xFF, (checksum >> 8) & 0xFF,
                (checksum >> 16) & 0xFF, (checksum >> 24) & 0xFF]));

            const preamble = await port.read(2);
            if (preamble[0] != 0x5A || preamble[1] != 0xA5) {
                throw new Error(`Wrong preamble: ${preamble.toString("hex")}`);
            }
            const errorCode = (await port.read(1))[0];
            if (errorCode != 0) {
                throw new Error(`Signer error: ${errorCode.toString(16)}`);
            }
            const lengthBytes = await port.read(2);
            const length = lengthBytes[0] | (lengthBytes[1] << 8);
            const response = await port.read(length);
            const checksumBytes = await port.read(4);
            const responseChecksum = (checksumBytes[0] | (checksumBytes[1] << 8) |
                (checksumBytes[2] << 16) | (checksumBytes[3] << 24)) >>> 0;
            const realResponseChecksum = BaseTransactionSignerService.getChecksum(response);

            if (responseChecksum != realResponseChecksum) {
                throw new Error(`Wrong checksum: ${responseChecksum} != ${realResponseChecksum}`);
            }

            return response;
        } finally {
            try {
                await port.close();
            } catch (ignore) {
                // ignore
            }
        }
    }
}
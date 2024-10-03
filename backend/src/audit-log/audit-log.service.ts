import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {AuditLog} from "../common/database/entities/audit-log.entity";
import {FindOptionsOrder, IsNull, Repository} from "typeorm";
import {Member} from "../common/database/entities/member.entity";
import {ACSKeyType} from "../common/database/entities/acs-key.entity";
import {MONEY_DECIMAL_PLACES} from "../common/money";
import {TransactionType} from "../common/database/entities/common";
import {
    SpaceTransactionDeposit,
    SpaceTransactionWithdrawal
} from "../common/database/entities/space-transaction.entity";
import {
    MemberTransaction,
    MemberTransactionDeposit,
    MemberTransactionWithdrawal
} from "../common/database/entities/member-transaction.entity";

type AuditLogEntry = {
    "logto-authorize": undefined,
    "create-acs-key": {
        id: string,
        type: ACSKeyType,
        key: string,
        name: string,
        memberId: string
    },
    "delete-acs-key": {
        id: string
    },
    "create-membership": {
        id: string,
        title: string,
        amount: string,
        active: boolean
    },
    "update-membership": {
        id: string,
        title: string,
        amount: string,
        active: boolean
    },
    "create-space-transaction": {
        id: string,
        type: TransactionType,
        amount: string,
        comment?: string | null,
        date: string,
        source?: SpaceTransactionDeposit | null,
        target?: SpaceTransactionWithdrawal | null,
        relatedMemberTransaction?: string | null
    },
    "create-member-transaction": {
        id: string,
        type: TransactionType,
        amount: string,
        comment?: string | null,
        date: string,
        source?: MemberTransactionDeposit | null,
        target?: MemberTransactionWithdrawal | null,
        subjectId: string
    },
    "freeze-member": {
        id: string
    },
    "unfreeze-member": {
        id: string
    },
    "create-member": {
        id: string,
        name: string,
        email: string,
        logtoId: string
    },
    "update-member": {
        id: string,
        name: string,
        email: string
    },
    "subscribe-member": {
        memberId: string,
        membershipId: string,
        membershipSubscriptionId: string
    },
    "unsubscribe-member": {
        membershipSubscriptionId: string
    },
    "update-member-telegram-metadata": {
        memberId: string,
        telegramId: string
    },
    "delete-member-telegram-metadata": {
        memberId: string
    },
    "update-member-github-metadata": {
        memberId: string,
        githubId: string
    },
    "delete-member-github-metadata": {
        memberId: string
    }
}

@Injectable()
export class AuditLogService {
    constructor(@InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>) {
    }

    async create<TAction extends keyof AuditLogEntry>(action: TAction, actor: Member,
                                                      metadata: AuditLogEntry[TAction]): Promise<void> {
        const auditLogEntry = this.auditLogRepository.create({
            action,
            actor,
            metadata,
            createdAt: new Date()
        });
        await this.auditLogRepository.save(auditLogEntry);
    }

    async countAll(): Promise<number> {
        return await this.auditLogRepository.count();
    }

    async findAll(offset: number, count: number): Promise<AuditLog[]> {
        return await this.auditLogRepository.find({
            skip: offset,
            take: count,
            relations: {
                actor: true
            },
            order: {
                createdAt: "desc"
            }
        });
    }

    async existsWithoutNearTransaction(): Promise<boolean> {
        return await this.auditLogRepository.exists({
            where: {
                nearTransactionHash: IsNull()
            }
        });
    }

    async findAllWithoutNearTransaction(offset: number, count: number): Promise<AuditLog[]> {
        return await this.auditLogRepository.find({
            where: {
                nearTransactionHash: IsNull()
            },
            order: {
                createdAt: "asc"
            },
            relations: {
                actor: true
            },
            skip: offset,
            take: count
        });
    }

    async update(auditLog: AuditLog): Promise<AuditLog> {
        return await this.auditLogRepository.save(auditLog);
    }
}
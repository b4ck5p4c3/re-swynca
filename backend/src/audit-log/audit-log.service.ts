import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, FindOptionsOrder, IsNull, Repository } from 'typeorm'

import { ACSKeyType } from '../common/database/entities/acs-key.entity'
import { AuditLog } from '../common/database/entities/audit-log.entity'
import { TransactionType } from '../common/database/entities/common'
import {
  MemberTransaction,
  MemberTransactionDeposit,
  MemberTransactionWithdrawal
} from '../common/database/entities/member-transaction.entity'
import { Member } from '../common/database/entities/member.entity'
import {
  SpaceTransactionDeposit,
  SpaceTransactionWithdrawal
} from '../common/database/entities/space-transaction.entity'
import { MONEY_DECIMAL_PLACES } from '../common/money'

type AuditLogEntry = {
  'create-acs-key': {
    id: string,
    key: string,
    memberId: string
    name: string,
    type: ACSKeyType,
  },
  'create-api-key': {
    id: string,
    key: string
  },
  'create-mac': {
    description: string,
    id: string,
    mac: string,
    memberId: string
  }
  'create-member': {
    email: string,
    id: string,
    logtoId: string
    name: string,
    username: string,
  },
  'create-member-transaction': {
    amount: string,
    comment?: null | string,
    date: string,
    id: string,
    source?: MemberTransactionDeposit | null,
    subjectId: string
    target?: MemberTransactionWithdrawal | null,
    type: TransactionType,
  },
  'create-membership': {
    active: boolean
    amount: string,
    id: string,
    title: string,
  },
  'create-space-transaction': {
    amount: string,
    comment?: null | string,
    date: string,
    id: string,
    relatedMemberTransaction?: null | string
    source?: null | SpaceTransactionDeposit,
    target?: null | SpaceTransactionWithdrawal,
    type: TransactionType,
  },
  'delete-acs-key': {
    id: string
  },
  'delete-api-key': {
    id: string
  },
  'delete-mac': {
    id: string
  },
  'delete-member-github-metadata': {
    memberId: string
  },
  'delete-member-telegram-metadata': {
    memberId: string
  },
  'freeze-member': {
    id: string
  },
  'logto-authorize': undefined,
  'subscribe-member': {
    memberId: string,
    membershipId: string,
    membershipSubscriptionId: string
  },
  'subscriptions-withdrawal': undefined,
  'unfreeze-member': {
    id: string
  },
  'unsubscribe-member': {
    membershipSubscriptionId: string
  },
  'update-member': {
    email: string
    id: string,
    name: string,
    username: string,
  },
  'update-member-github-metadata': {
    githubId: string
    memberId: string,
  },
  'update-member-telegram-metadata': {
    memberId: string,
    telegramId: string
  },
  'update-membership': {
    active: boolean
    amount: string,
    id: string,
    title: string,
  },
}

@Injectable()
export class AuditLogService {
  constructor (@InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>) {}

  async countAll (): Promise<number> {
    return await this.auditLogRepository.count()
  }

  async create<TAction extends keyof AuditLogEntry>(action: TAction, actor: Member,
    metadata: AuditLogEntry[TAction]): Promise<void> {
    const auditLogEntry = this.auditLogRepository.create({
      action,
      actor,
      createdAt: new Date(),
      metadata
    })
    await this.auditLogRepository.save(auditLogEntry)
  }

  async existsWithoutNearTransaction (): Promise<boolean> {
    return await this.auditLogRepository.exists({
      where: {
        nearTransactionHash: IsNull()
      }
    })
  }

  async findAll (offset: number, count: number): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      order: {
        createdAt: 'desc'
      },
      relations: {
        actor: true
      },
      skip: offset,
      take: count
    })
  }

  async findAllWithoutNearTransaction (offset: number, count: number): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      order: {
        createdAt: 'asc'
      },
      relations: {
        actor: true
      },
      skip: offset,
      take: count,
      where: {
        nearTransactionHash: IsNull()
      }
    })
  }

  for (manager: EntityManager): AuditLogService {
    return new AuditLogService(manager.getRepository(AuditLog))
  }

  async update (auditLog: AuditLog): Promise<AuditLog> {
    return await this.auditLogRepository.save(auditLog)
  }
}

import Decimal from 'decimal.js'
import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'

import { MONEY_DECIMAL_PLACES, MONEY_PRECISION } from '../../money'
import { DecimalTransformer } from '../transformers/decimal.transformer'
import { ACSKey } from './acs-key.entity'
import { ApiKey } from './api-key.entity'
import { AuditLog } from './audit-log.entity'
import { GitHubMetadata } from './github-metadata.entity'
import { LogtoBinding } from './logto-binding.entity'
import { MAC } from './mac.entity'
import { MemberTransaction } from './member-transaction.entity'
import { MembershipSubscription } from './membership-subscription.entity'
import { SpaceTransaction } from './space-transaction.entity'
import { TelegramMetadata } from './telegram-metadata.entity'

export enum MemberStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen'
}

@Entity()
export class Member {
  @OneToMany(() => ACSKey, acsKey => acsKey.member)
  acsKeys: ACSKey[]

  @OneToMany(() => MemberTransaction, memberTransaction => memberTransaction.actor)
  actedMemberTransactions: MemberTransaction[]

  @OneToMany(() => SpaceTransaction, spaceTransaction => spaceTransaction.actor)
  actedSpaceTransactions: SpaceTransaction[]

  @OneToMany(() => ApiKey, apiKey => apiKey.member)
  apiKeys: ApiKey[]

  @OneToMany(() => AuditLog, auditLog => auditLog.actor)
  auditLogs: AuditLog[]

  @Column('decimal', { default: '0.0', precision: MONEY_PRECISION, scale: MONEY_DECIMAL_PLACES, transformer: new DecimalTransformer() })
  balance: Decimal

  @Column('text', { unique: true })
  email: string

  @Column('text')
  entranceSound: string

  @OneToOne(() => LogtoBinding, externalAuthenticationLogto =>
    externalAuthenticationLogto.member, { nullable: true })
  externalAuthenticationLogto?: LogtoBinding

  @OneToOne(() => GitHubMetadata, githubMetadata => githubMetadata.member, { nullable: true })
  githubMetadata?: GitHubMetadata

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('timestamp without time zone')
  joinedAt: Date

  @OneToMany(() => MAC, mac => mac.member)
  macs: MAC[]

  @Column('text')
  name: string

  @Column({ default: MemberStatus.ACTIVE, enum: MemberStatus, type: 'enum' })
  status: MemberStatus

  @OneToMany(() => MemberTransaction, memberTransaction => memberTransaction.subject)
  subjectedMemberTransactions: MemberTransaction[]

  @OneToMany(() => MembershipSubscription, membershipSubscription => membershipSubscription.member)
  subscriptions: MembershipSubscription[]

  @OneToOne(() => TelegramMetadata, telegramMetadata => telegramMetadata.member, { nullable: true })
  telegramMetadata?: TelegramMetadata

  @Column('text', { unique: true })
  username: string
}

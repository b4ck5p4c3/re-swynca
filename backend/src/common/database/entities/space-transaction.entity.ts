import Decimal from 'decimal.js'
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm'

import { MONEY_DECIMAL_PLACES, MONEY_PRECISION } from '../../money'
import { DecimalTransformer } from '../transformers/decimal.transformer'
import { TransactionType } from './common'
import { MemberTransaction } from './member-transaction.entity'
import { Member } from './member.entity'

export enum SpaceTransactionDeposit {
  DONATE = 'donate',
  MAGIC = 'magic',
  TOPUP = 'topup'
}

export enum SpaceTransactionWithdrawal {
  BASIC = 'basic',
  MAGIC = 'magic',
  PURCHASES = 'purchases'
}

@Entity()
export class SpaceTransaction {
  @ManyToOne(() => Member, member => member.actedSpaceTransactions)
  actor: Member

  @Column('decimal', { default: '0.0', precision: MONEY_PRECISION, scale: MONEY_DECIMAL_PLACES, transformer: new DecimalTransformer() })
  amount: Decimal

  @Column('text', { nullable: true })
  comment?: string

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date

  @Column('timestamp without time zone')
  date: Date

  @PrimaryGeneratedColumn('uuid')
  id: string

  @JoinColumn()
  @OneToOne(() => MemberTransaction, memberTransaction =>
    memberTransaction.relatedSpaceTransaction)
  relatedMemberTransaction?: MemberTransaction

  @Column({
    enum: SpaceTransactionDeposit,
    nullable: true,
    type: 'enum',
  })
  source?: SpaceTransactionDeposit

  @Column({
    enum: SpaceTransactionWithdrawal,
    nullable: true,
    type: 'enum',
  })
  target?: SpaceTransactionWithdrawal

  @Column({
    enum: TransactionType,
    type: 'enum'
  })
  type: TransactionType
}

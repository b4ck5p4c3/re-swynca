import Decimal from 'decimal.js'
import { Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm'

import { MONEY_DECIMAL_PLACES, MONEY_PRECISION } from '../../money'
import { DecimalTransformer } from '../transformers/decimal.transformer'
import { TransactionType } from './common'
import { Member } from './member.entity'
import { SpaceTransaction } from './space-transaction.entity'

export enum MemberTransactionDeposit {
  DONATE = 'donate',
  MAGIC = 'magic',
  TOPUP = 'topup'
}

export enum MemberTransactionWithdrawal {
  MAGIC = 'magic',
  MEMBERSHIP = 'membership'
}

@Entity()
export class MemberTransaction {
  @ManyToOne(() => Member, member => member.actedMemberTransactions)
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

  @OneToOne(() => SpaceTransaction, spaceTransaction => spaceTransaction.relatedMemberTransaction)
  relatedSpaceTransaction?: SpaceTransaction

  @Column({
    enum: MemberTransactionDeposit,
    nullable: true,
    type: 'enum',
  })
  source?: MemberTransactionDeposit

  @ManyToOne(() => Member, member => member.subjectedMemberTransactions)
  subject: Member

  @Column({
    enum: MemberTransactionWithdrawal,
    nullable: true,
    type: 'enum',
  })
  target?: MemberTransactionWithdrawal

  @Column({
    enum: TransactionType,
    type: 'enum'
  })
  type: TransactionType
}

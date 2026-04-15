import Decimal from 'decimal.js'
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { MONEY_DECIMAL_PLACES, MONEY_PRECISION } from '../../money'
import { DecimalTransformer } from '../transformers/decimal.transformer'
import { MembershipSubscription } from './membership-subscription.entity'

@Entity()
export class Membership {
  @Column('boolean')
  active: boolean

  @Column('decimal', { default: '0.0', precision: MONEY_PRECISION, scale: MONEY_DECIMAL_PLACES, transformer: new DecimalTransformer() })
  amount: Decimal

  @PrimaryGeneratedColumn('uuid')
  id: string

  @OneToMany(() => MembershipSubscription, membershipSubscription => membershipSubscription.membership)
  subscriptions: MembershipSubscription[]

  @Column('text')
  title: string
}

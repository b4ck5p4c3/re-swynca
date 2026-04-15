import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { Member } from './member.entity'
import { Membership } from './membership.entity'

@Entity()
export class MembershipSubscription {
  @Column('timestamp without time zone', { nullable: true })
  declinedAt: Date

  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Member, member => member.subscriptions)
  member: Member

  @ManyToOne(() => Membership, membership => membership.subscriptions)
  membership: Membership

  @Column('timestamp without time zone')
  subscribedAt: Date
}

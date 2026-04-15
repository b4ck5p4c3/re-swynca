import { Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm'

import { Member } from './member.entity'

@Entity()
export class LogtoBinding {
  @PrimaryColumn('text')
  logtoId: string

  @JoinColumn()
  @OneToOne(() => Member, member => member.externalAuthenticationLogto)
  member: Member
}

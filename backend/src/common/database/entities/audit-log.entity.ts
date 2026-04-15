import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { Member } from './member.entity'

@Entity()
export class AuditLog {
  @Column('text')
  action: string

  @ManyToOne(() => Member, member => member.auditLogs)
  actor: Member

  @Column('timestamp without time zone')
  createdAt: Date

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('jsonb', { nullable: true })
  metadata?: object

  @Column('text', { nullable: true })
  nearTransactionHash: string
}

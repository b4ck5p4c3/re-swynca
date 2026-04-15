import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { Member } from './member.entity'

@Entity()
export class MAC {
  @Column('text')
  description: string

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text')
  mac: string

  @ManyToOne(() => Member, member => member.macs)
  member: Member
}

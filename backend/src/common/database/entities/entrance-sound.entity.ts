import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { Member } from './member.entity'

@Entity()
export class EntranceSound {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { unique: true })
  key: string

  @OneToMany(() => Member, member => member.entranceSound)
  members: Member[]

  @Column('text', { nullable: false })
  name: string
}

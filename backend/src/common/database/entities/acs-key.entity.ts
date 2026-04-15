import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { Member } from './member.entity'

export enum ACSKeyType {
  PAN = 'pan',
  UID = 'uid'
}

@Entity()
export class ACSKey {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { unique: true })
  key: string

  @ManyToOne(() => Member, member => member.acsKeys)
  member: Member

  @Column('text')
  name: string

  @Column({
    enum: ACSKeyType,
    type: 'enum'
  })
  type: ACSKeyType
}

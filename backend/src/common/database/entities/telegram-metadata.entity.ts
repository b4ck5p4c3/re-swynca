import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm'

import { Member } from './member.entity'

@Entity()
export class TelegramMetadata {
  @JoinColumn()
  @OneToOne(() => Member, member => member.telegramMetadata)
  member: Member

  @PrimaryColumn('text')
  telegramId: string

  @Column('text', { nullable: true })
  telegramName?: string
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class EntranceSound {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { unique: true })
  key: string

  @Column('text', { nullable: false })
  name: string
}

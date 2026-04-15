import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm'

import { Member } from './member.entity'

@Entity()
export class GitHubMetadata {
  @PrimaryColumn('text')
  githubId: string

  @Column('text')
  githubUsername: string

  @JoinColumn()
  @OneToOne(() => Member, member => member.githubMetadata)
  member: Member
}

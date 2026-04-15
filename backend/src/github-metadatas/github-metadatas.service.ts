import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { DeepPartial } from 'typeorm/common/DeepPartial'

import { AuditLogService } from '../audit-log/audit-log.service'
import { GitHubMetadata } from '../common/database/entities/github-metadata.entity'

@Injectable()
export class GitHubMetadatasService {
  constructor (@InjectRepository(GitHubMetadata) private githubMetadataRepository: Repository<GitHubMetadata>) {}

  async create (githubMetadataData: DeepPartial<GitHubMetadata>): Promise<GitHubMetadata> {
    const githubMetadata = this.githubMetadataRepository.create(githubMetadataData)
    await this.githubMetadataRepository.save(githubMetadata)
    return githubMetadata
  }

  async existsByGithubId (githubId: string) {
    return await this.githubMetadataRepository.existsBy({
      githubId
    })
  }

  for (manager: EntityManager): GitHubMetadatasService {
    return new GitHubMetadatasService(manager.getRepository(GitHubMetadata))
  }

  async remove (githubId: string) {
    await this.githubMetadataRepository.delete(githubId)
  }

  async update (githubMetadata: GitHubMetadata): Promise<GitHubMetadata> {
    await this.githubMetadataRepository.save(githubMetadata)
    return githubMetadata
  }
}

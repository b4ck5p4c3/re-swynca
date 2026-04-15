import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, EntityManager, Repository } from 'typeorm'

import { ApiKey } from '../common/database/entities/api-key.entity'
import { Member } from '../common/database/entities/member.entity'
import { SessionStorageService } from '../session-storage/session-storage.service'

@Injectable()
export class ApiKeysService implements OnModuleInit {
  constructor (@InjectRepository(ApiKey) private apiKeyRepository: Repository<ApiKey>,
    private sessionStorageService: SessionStorageService) {}

  async create (data: DeepPartial<Exclude<ApiKey, 'id'>>): Promise<ApiKey> {
    const apiKey = this.apiKeyRepository.create(data)
    await this.apiKeyRepository.save(apiKey)
    return apiKey
  }

  async find (): Promise<ApiKey[]> {
    return await this.apiKeyRepository.find({
      relations: {
        member: true
      }
    })
  }

  async findById (id: string): Promise<ApiKey | null> {
    return await this.apiKeyRepository.findOne({
      relations: {
        member: true
      },
      where: {
        id
      }
    })
  }

  async findByMemberId (memberId: string): Promise<ApiKey[]> {
    return await this.apiKeyRepository.find({
      where: {
        member: {
          id: memberId
        }
      }
    })
  }

  for (manager: EntityManager): ApiKeysService {
    return new ApiKeysService(manager.getRepository(ApiKey), this.sessionStorageService)
  }

  async initializeApiKeysInStorage (): Promise<void> {
    const keys = await this.find()
    for (const key of keys) {
      if (key.member.status === 'active') {
        await this.sessionStorageService.add(key.key, key.member.id)
      }
    }
  }

  async onModuleInit (): Promise<void> {
    await this.initializeApiKeysInStorage()
  }

  async remove (id: string): Promise<void> {
    await this.apiKeyRepository.delete(id)
  }

  async transaction<T>(transactionFunction: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.apiKeyRepository.manager.transaction(transactionFunction)
  }
}

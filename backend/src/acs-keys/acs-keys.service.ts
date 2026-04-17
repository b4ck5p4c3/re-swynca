import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ACSKey } from 'src/common/database/entities/acs-key.entity'
import { DeepPartial, EntityManager, Repository } from 'typeorm'

import { MemberStatus } from '../common/database/entities/member.entity'

@Injectable()
export class ACSKeysService {
  constructor (@InjectRepository(ACSKey) private acsKeyRepository: Repository<ACSKey>) {}

  async create (acsKey: Omit<DeepPartial<ACSKey>, 'id'>): Promise<ACSKey> {
    const createdACSKey = this.acsKeyRepository.create(acsKey)
    await this.acsKeyRepository.save(createdACSKey)
    return createdACSKey
  }

  async existsByKey (key: string): Promise<boolean> {
    return this.acsKeyRepository.existsBy({
      key
    })
  }

  async findAllByMemberId (id: string): Promise<ACSKey[]> {
    return await this.acsKeyRepository.find({
      relations: {
        member: true
      },
      where: {
        member: {
          id
        }
      }
    })
  }

  async findForActiveMembers (): Promise<ACSKey[]> {
    return await this.acsKeyRepository.find({
      relations: {
        member: {
          entranceSound: true
        }
      },
      where: {
        member: {
          status: MemberStatus.ACTIVE
        }
      }
    })
  }

  for (manager: EntityManager): ACSKeysService {
    return new ACSKeysService(manager.getRepository(ACSKey))
  }

  async remove (id: string): Promise<void> {
    await this.acsKeyRepository.delete(id)
  }

  async transaction<T>(transactionFunction: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.acsKeyRepository.manager.transaction(transactionFunction)
  }
}

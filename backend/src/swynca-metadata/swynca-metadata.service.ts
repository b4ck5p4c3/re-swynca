import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, EntityManager, Repository } from 'typeorm'

import { SwyncaMetadata } from '../common/database/entities/swynca-metadata.entity'

export const LAST_SUBSCRIPTIONS_WITHDRAWAL_METADATA_KEY = 'last-subscriptions-withdrawal'

@Injectable()
export class SwyncaMetadataService {
  constructor (@InjectRepository(SwyncaMetadata) private swyncaMetadataRepository: Repository<SwyncaMetadata>) {}

  async create (data: DeepPartial<SwyncaMetadata>): Promise<SwyncaMetadata> {
    const swyncaMetadata = this.swyncaMetadataRepository.create(data)
    await this.swyncaMetadataRepository.save(swyncaMetadata)
    return swyncaMetadata
  }

  async findByKey (key: string): Promise<null | SwyncaMetadata> {
    return await this.swyncaMetadataRepository.findOne({
      where: {
        key
      }
    })
  }

  async findByKeyLocked (key: string): Promise<null | SwyncaMetadata> {
    return await this.swyncaMetadataRepository.findOne({
      lock: {
        mode: 'for_no_key_update'
      },
      where: {
        key
      }
    })
  }

  for (manager: EntityManager): SwyncaMetadataService {
    return new SwyncaMetadataService(manager.getRepository(SwyncaMetadata))
  }

  async transaction<T>(transactionFunction: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.swyncaMetadataRepository.manager.transaction(transactionFunction)
  }

  async update (swyncaMetadata: SwyncaMetadata): Promise<SwyncaMetadata> {
    await this.swyncaMetadataRepository.save(swyncaMetadata)
    return swyncaMetadata
  }
}

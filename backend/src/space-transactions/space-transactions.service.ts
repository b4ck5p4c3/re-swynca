import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { SpaceTransaction } from 'src/common/database/entities/space-transaction.entity'
import { EntityManager, FindOptionsOrder, Repository } from 'typeorm'
import { FindOptionsOrderValue } from 'typeorm/find-options/FindOptionsOrder'

@Injectable()
export class SpaceTransactionsService {
  constructor (@InjectRepository(SpaceTransaction) private spaceTransactionRepository: Repository<SpaceTransaction>) {}

  async countAll (): Promise<number> {
    return await this.spaceTransactionRepository.count()
  }

  async countAllByActorId (actorId: string): Promise<number> {
    return await this.spaceTransactionRepository.count({
      where: {
        actor: {
          id: actorId
        }
      }
    })
  }

  async create (spaceTransaction: Omit<SpaceTransaction, 'id'>): Promise<SpaceTransaction> {
    const createdSpaceTransaction = this.spaceTransactionRepository.create(spaceTransaction)
    await this.spaceTransactionRepository.save(createdSpaceTransaction)
    return createdSpaceTransaction
  }

  async findAll (offset: number, count: number,
    orderBy: FindOptionsOrder<SpaceTransaction>): Promise<SpaceTransaction[]> {
    return await this.spaceTransactionRepository.find({
      order: orderBy,
      relations: {
        actor: true,
        relatedMemberTransaction: {
          subject: true
        }
      },
      skip: offset,
      take: count
    })
  }

  async findAllByActorId (id: string, offset: number, count: number,
    orderBy: FindOptionsOrder<SpaceTransaction>): Promise<null | SpaceTransaction[]> {
    return await this.spaceTransactionRepository.find({
      order: orderBy,
      relations: {
        actor: true,
        relatedMemberTransaction: {
          subject: true
        }
      },
      skip: offset,
      take: count,
      where: {
        id
      }
    })
  }

  for (manager: EntityManager): SpaceTransactionsService {
    return new SpaceTransactionsService(manager.getRepository(SpaceTransaction))
  }

  async transaction<T>(transactionFunction: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.spaceTransactionRepository.manager.transaction(transactionFunction)
  }
}

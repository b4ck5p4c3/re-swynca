import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { of } from 'rxjs'
import { MemberTransaction } from 'src/common/database/entities/member-transaction.entity'
import { EntityManager, FindOptionsOrder, Repository } from 'typeorm'

import { SpaceTransaction } from '../common/database/entities/space-transaction.entity'

@Injectable()
export class MemberTransactionsService {
  constructor (@InjectRepository(MemberTransaction) private memberTransactionRepository: Repository<MemberTransaction>) {}

  async countAll (): Promise<number> {
    return await this.memberTransactionRepository.count()
  }

  async countAllByActorId (id: string): Promise<number> {
    return await this.memberTransactionRepository.count({
      where: {
        actor: {
          id
        }
      }
    })
  }

  async countAllBySubjectId (id: string): Promise<number> {
    return await this.memberTransactionRepository.count({
      where: {
        subject: {
          id
        }
      }
    })
  }

  async create (memberTransaction: Omit<MemberTransaction, 'id'>): Promise<MemberTransaction> {
    const createdMemberTransaction = this.memberTransactionRepository.create(memberTransaction)
    await this.memberTransactionRepository.save(createdMemberTransaction)
    return createdMemberTransaction
  }

  async findAll (offset: number, count: number,
    orderBy: FindOptionsOrder<MemberTransaction>): Promise<MemberTransaction[]> {
    return await this.memberTransactionRepository.find({
      order: orderBy,
      relations: {
        actor: true,
        subject: true
      },
      skip: offset,
      take: count
    })
  }

  async findAllByActorId (id: string, offset: number, count: number,
    orderBy: FindOptionsOrder<MemberTransaction>): Promise<MemberTransaction[]> {
    return await this.memberTransactionRepository.find({
      order: orderBy,
      relations: {
        actor: true,
        subject: true
      },
      skip: offset,
      take: count,
      where: {
        actor: {
          id
        }
      }
    })
  }

  async findAllBySubjectId (id: string, offset: number, count: number,
    orderBy: FindOptionsOrder<MemberTransaction>): Promise<MemberTransaction[]> {
    return await this.memberTransactionRepository.find({
      order: orderBy,
      relations: {
        actor: true,
        subject: true
      },
      skip: offset,
      take: count,
      where: {
        subject: {
          id
        }
      }
    })
  }

  for (manager: EntityManager): MemberTransactionsService {
    return new MemberTransactionsService(manager.getRepository(MemberTransaction))
  }

  async transaction<T>(transactionFunction: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.memberTransactionRepository.manager.transaction(transactionFunction)
  }
}

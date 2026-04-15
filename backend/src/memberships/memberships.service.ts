import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import Decimal from 'decimal.js'
import { EntityManager, Repository } from 'typeorm'
import { DeepPartial } from 'typeorm/common/DeepPartial'

import { Membership } from '../common/database/entities/membership.entity'

@Injectable()
export class MembershipsService {
  constructor (@InjectRepository(Membership) private membershipRepository: Repository<Membership>) {}

  async create (membershipData: Omit<DeepPartial<Membership>, 'id'>): Promise<Membership> {
    const membership = this.membershipRepository.create(membershipData)
    await this.membershipRepository.save(membership)
    return membership
  }

  async findAll (): Promise<Membership[]> {
    return await this.membershipRepository.find()
  }

  async findById (id: string): Promise<Membership | null> {
    return await this.membershipRepository.findOne({
      where: {
        id
      }
    })
  }

  for (manager: EntityManager): MembershipsService {
    return new MembershipsService(manager.getRepository(Membership))
  }

  async transaction<T>(transactionFunction: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.membershipRepository.manager.transaction(transactionFunction)
  }

  async update (membership: Membership): Promise<void> {
    await this.membershipRepository.save(membership)
  }
}

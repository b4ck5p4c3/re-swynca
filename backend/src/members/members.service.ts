import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import Decimal from 'decimal.js'
import { DeepPartial, EntityManager, Not, Repository } from 'typeorm'

import { Member, MemberStatus } from '../common/database/entities/member.entity'
import { MONEY_DECIMAL_PLACES } from '../common/money'

export const SPACE_MEMBER_ID = '00000000-0000-0000-0000-000000000000'

@Injectable()
export class MembersService {
  constructor (@InjectRepository(Member) private membersRepository: Repository<Member>) {}

  async atomicallyDecrementNonZeroableBalance (member: Member, change: Decimal): Promise<void> {
    const decrementResult = await this.membersRepository.createQueryBuilder()
      .update(Member)
      .set({
        balance: () => 'balance - :change'
      })
      .where({
        id: member.id
      })
      .andWhere('balance >= :change')
      .setParameter('change', change.toFixed(MONEY_DECIMAL_PLACES))
      .execute()
    if (decrementResult.affected !== 1) {
      throw new Error('Failed to atomically decrement non-zeroed balance')
    }
  }

  async atomicallyIncrementBalance (member: Member, change: Decimal): Promise<void> {
    const incrementResult = await this.membersRepository.createQueryBuilder()
      .update(Member)
      .set({
        balance: () => 'balance + :change'
      })
      .where({
        id: member.id
      })
      .setParameter('change', change.toFixed(MONEY_DECIMAL_PLACES))
      .execute()
    if (incrementResult.affected !== 1) {
      throw new Error('Failed to atomically increment balance')
    }
  }

  async countActive (): Promise<number> {
    return await this.membersRepository.countBy({
      id: Not(SPACE_MEMBER_ID),
      status: MemberStatus.ACTIVE
    })
  }

  async create (memberData: DeepPartial<Member>): Promise<Member> {
    const member = this.membersRepository.create(memberData)
    await this.membersRepository.save(member)
    return member
  }

  async existsByEmail (email: string): Promise<boolean> {
    return await this.membersRepository.existsBy({
      email,
      id: Not(SPACE_MEMBER_ID)
    })
  }

  async existsByIdUnfiltered (id: string): Promise<boolean> {
    return await this.membersRepository.exists({
      where: {
        id
      }
    })
  }

  async existsByUsername (username: string): Promise<boolean> {
    return await this.membersRepository.existsBy({
      id: Not(SPACE_MEMBER_ID),
      username
    })
  }

  async findAll (): Promise<Member[]> {
    return await this.membersRepository.find({
      relations: {
        githubMetadata: true,
        telegramMetadata: true
      },
      where: {
        id: Not(SPACE_MEMBER_ID)
      }
    })
  }

  async findAllActive (): Promise<Member[]> {
    return await this.membersRepository.find({
      relations: {
        githubMetadata: true,
        telegramMetadata: true
      },
      where: {
        id: Not(SPACE_MEMBER_ID),
        status: MemberStatus.ACTIVE
      }
    })
  }

  async findById (id: string): Promise<Member | null> {
    if (id === SPACE_MEMBER_ID) {
      return null
    }
    return await this.findByIdUnfiltered(id)
  }

  async findByIdLocked (id: string): Promise<Member | null> {
    if (id === SPACE_MEMBER_ID) {
      return null
    }
    return await this.findByIdUnfilteredLocked(id)
  }

  async findByIdUnfiltered (id: string): Promise<Member | null> {
    return await this.membersRepository.findOne({
      relations: {
        githubMetadata: true,
        telegramMetadata: true
      },
      where: {
        id
      }
    })
  }

  async findByIdUnfilteredLocked (id: string): Promise<Member | null> {
    return await this.membersRepository.findOne({
      lock: {
        mode: 'for_no_key_update'
      },
      where: {
        id
      }
    })
  }

  for (manager: EntityManager): MembersService {
    return new MembersService(manager.getRepository(Member))
  }

  async transaction<T>(transactionFunction: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.membersRepository.manager.transaction(transactionFunction)
  }

  async update (member: Member): Promise<Member> {
    return await this.membersRepository.save(member)
  }
}

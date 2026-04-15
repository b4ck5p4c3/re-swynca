import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import Decimal from 'decimal.js'
import { MembershipSubscription } from 'src/common/database/entities/membership-subscription.entity'
import { DeepPartial, EntityManager, IsNull, Repository } from 'typeorm'

import { MemberStatus } from '../common/database/entities/member.entity'
import { Membership } from '../common/database/entities/membership.entity'

export class MembershipSubscriptionAlreadyDeclinedError extends Error {}

export class MembershipSubscriptionAlreadyExistsError extends Error {}

@Injectable()
export class MembershipSubscriptionsService {
  constructor (@InjectRepository(MembershipSubscription) private membershipSubscriptionRepository: Repository<MembershipSubscription>) {}

  async create (data: DeepPartial<MembershipSubscription>): Promise<MembershipSubscription> {
    const membershipSubscription = this.membershipSubscriptionRepository.create(data)
    await this.membershipSubscriptionRepository.save(membershipSubscription)
    return membershipSubscription
  }

  async findActiveByMemberIdAndMembershipIdLocked (memberId: string, membershipId: string): Promise<MembershipSubscription | null> {
    return await this.membershipSubscriptionRepository.findOne({
      lock: {
        mode: 'for_no_key_update'
      },
      where: {
        declinedAt: IsNull(),
        member: {
          id: memberId
        },
        membership: {
          id: membershipId
        }
      }
    })
  }

  async findAllActive (): Promise<MembershipSubscription[]> {
    return await this.membershipSubscriptionRepository.find({
      relations: {
        member: true,
        membership: true
      },
      where: {
        declinedAt: IsNull(),
        member: {
          status: MemberStatus.ACTIVE
        }
      }
    })
  }

  async findAllByMemberId (id: string): Promise<MembershipSubscription[]> {
    return await this.membershipSubscriptionRepository.find({
      relations: {
        member: true,
        membership: true
      },
      where: {
        member: {
          id
        }
      }
    })
  }

  async findAllByMembershipId (id: string): Promise<MembershipSubscription[]> {
    return await this.membershipSubscriptionRepository.find({
      relations: {
        member: true,
        membership: true
      },
      where: {
        membership: {
          id
        }
      }
    })
  }

  async findById (id: string): Promise<MembershipSubscription | null> {
    return await this.membershipSubscriptionRepository.findOne({
      where: {
        id
      }
    })
  }

  for (manager: EntityManager): MembershipSubscriptionsService {
    return new MembershipSubscriptionsService(manager.getRepository(MembershipSubscription))
  }

  async getSumOfActive (): Promise<Decimal> {
    // WARN - custom query
    const result = await this.membershipSubscriptionRepository.createQueryBuilder()
      .select(`sum(${Membership.name}.amount)`, 'totalAmount')
      .leftJoin(`${MembershipSubscription.name}.membership`, Membership.name)
      .where(`${MembershipSubscription.name}.declinedAt is null`)
      .getRawOne<{ totalAmount: string }>()
    return new Decimal(result.totalAmount ?? 0)
  }

  async transaction<T>(transactionFunction: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.membershipSubscriptionRepository.manager.transaction(transactionFunction)
  }

  async updateIfActive (subscription: MembershipSubscription): Promise<boolean> {
    const updateResult = await this.membershipSubscriptionRepository.update({
      declinedAt: IsNull(),
      id: subscription.id
    }, subscription)
    return updateResult.affected === 1
  }
}

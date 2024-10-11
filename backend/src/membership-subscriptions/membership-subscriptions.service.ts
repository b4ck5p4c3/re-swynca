import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {MembershipSubscription} from "src/common/database/entities/membership-subscription.entity";
import {DeepPartial, EntityManager, IsNull, Not, Repository} from "typeorm";
import {Member} from "../common/database/entities/member.entity";
import {Membership} from "../common/database/entities/membership.entity";
import Decimal from "decimal.js";

export class MembershipSubscriptionAlreadyExistsError extends Error {
}

export class MembershipSubscriptionAlreadyDeclinedError extends Error {
}

@Injectable()
export class MembershipSubscriptionsService {
    constructor(@InjectRepository(MembershipSubscription) private membershipSubscriptionRepository: Repository<MembershipSubscription>) {
    }

    for(manager: EntityManager): MembershipSubscriptionsService {
        return new MembershipSubscriptionsService(manager.getRepository(MembershipSubscription))
    }

    async findById(id: string): Promise<MembershipSubscription | null> {
        return await this.membershipSubscriptionRepository.findOne({
            where: {
                id
            }
        });
    }

    async findAllByMemberId(id: string): Promise<MembershipSubscription[]> {
        return await this.membershipSubscriptionRepository.find({
            where: {
                member: {
                    id
                }
            },
            relations: {
                member: true,
                membership: true
            }
        });
    }

    async findAllByMembershipId(id: string): Promise<MembershipSubscription[]> {
        return await this.membershipSubscriptionRepository.find({
            where: {
                membership: {
                    id
                }
            },
            relations: {
                member: true,
                membership: true
            }
        });
    }

    async findAllActive(): Promise<MembershipSubscription[]> {
        return await this.membershipSubscriptionRepository.find({
            where: {
                declinedAt: IsNull()
            },
            relations: {
                membership: true,
                member: true
            }
        });
    }

    async findActiveByMemberIdAndMembershipIdLocked(memberId: string, membershipId: string): Promise<MembershipSubscription | null> {
        return await this.membershipSubscriptionRepository.findOne({
            where: {
                member: {
                    id: memberId
                },
                membership: {
                    id: membershipId
                },
                declinedAt: IsNull()
            },
            lock: {
                mode: "for_no_key_update"
            }
        });
    }

    async updateIfActive(subscription: MembershipSubscription): Promise<boolean> {
        const updateResult = await this.membershipSubscriptionRepository.update({
            id: subscription.id,
            declinedAt: IsNull()
        }, subscription);
        return updateResult.affected === 1;
    }

    async getSumOfActive(): Promise<Decimal> {
        // WARN - custom query
        const result = await this.membershipSubscriptionRepository.createQueryBuilder()
            .select(`sum(${Membership.name}.amount)`, "totalAmount")
            .leftJoin(`${MembershipSubscription.name}.membership`, Membership.name)
            .where(`${MembershipSubscription.name}.declinedAt is null`)
            .getRawOne<{ totalAmount: string }>();
        return new Decimal(result.totalAmount ?? 0);
    }

    async create(data: DeepPartial<MembershipSubscription>): Promise<MembershipSubscription> {
        const membershipSubscription = this.membershipSubscriptionRepository.create(data);
        await this.membershipSubscriptionRepository.save(membershipSubscription);
        return membershipSubscription;
    }

    async transaction<T>(transactionFn: (manager: EntityManager) => Promise<T>): Promise<T> {
        return await this.membershipSubscriptionRepository.manager.transaction(transactionFn);
    }
}
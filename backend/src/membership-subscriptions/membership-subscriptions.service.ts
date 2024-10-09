import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {MembershipSubscription} from "src/common/database/entities/membership-subscription.entity";
import {IsNull, Not, Repository} from "typeorm";
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

    async updateIfActive(subscription: MembershipSubscription): Promise<MembershipSubscription> {
        const updateResult = await this.membershipSubscriptionRepository.update({
            id: subscription.id,
            declinedAt: IsNull()
        }, subscription);
        if (updateResult.affected !== 1) {
            throw new MembershipSubscriptionAlreadyDeclinedError();
        }
        return subscription;
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

    async createActiveIfNotExist(member: Member, membership: Membership): Promise<MembershipSubscription> {
        return await this.membershipSubscriptionRepository.manager.transaction(async entityManager => {
            const transactionRepository = entityManager.getRepository(MembershipSubscription);
            const activeSubscription = await transactionRepository.findOne({
                where: {
                    member: {
                        id: member.id
                    },
                    membership: {
                        id: membership.id
                    },
                    declinedAt: IsNull()
                },
                lock: {
                    mode: "for_no_key_update"
                }
            });
            if (activeSubscription) {
                throw new MembershipSubscriptionAlreadyExistsError();
            }
            const membershipSubscription = transactionRepository.create({
                member,
                membership,
                subscribedAt: new Date()
            });
            await transactionRepository.save(membershipSubscription);
            return membershipSubscription;
        });
    }
}
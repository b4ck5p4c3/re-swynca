import {Injectable} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MembershipSubscription } from "src/common/database/entities/membership-subscription.entity";
import { Not, Repository } from "typeorm";

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

    async checkIfNotDeclinedByMemberIdAndMemberId (memberId: string, subscriptionId: string): Promise<boolean> {
        const existing = await this.membershipSubscriptionRepository.find({
            where: {
                member: {
                    id: memberId,
                },
                membership: {
                    id: subscriptionId
                },
                declinedAt: Not(null)
            }
        });
        return existing.length > 0;
    }

    async findAllByMemberId(id: string): Promise<MembershipSubscription[]> {
        return await this.membershipSubscriptionRepository.find({
            where: {
                member: {
                    id
                }
            },
            relations: {
                member: true
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
                membership: true
            }
        });
    }

    async subscribe(memberId: string, membershipId: string): Promise<MembershipSubscription> {
        const membershipSubscription = this.membershipSubscriptionRepository.create({
            member: {
                id: memberId
            },
            membership: {
                id: membershipId
            },
            subscribedAt: new Date()
        });
        await this.membershipSubscriptionRepository.save(membershipSubscription);
        return membershipSubscription;
    }
    
    async unsubscribe(id: string): Promise<void> {
        await this.membershipSubscriptionRepository.delete(id);
    }
}
import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {MembershipSubscription} from "src/common/database/entities/membership-subscription.entity";
import {IsNull, Not, Repository} from "typeorm";
import {Member} from "../common/database/entities/member.entity";
import {Membership} from "../common/database/entities/membership.entity";
import Decimal from "decimal.js";

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

    async existsByMemberAndMembershipWithNotDeclined(member: Member, membership: Membership): Promise<boolean> {
        return await this.membershipSubscriptionRepository.existsBy({
            member,
            membership,
            declinedAt: IsNull()
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

    async create(member: Member, membership: Membership): Promise<MembershipSubscription> {
        const membershipSubscription = this.membershipSubscriptionRepository.create({
            member,
            membership,
            subscribedAt: new Date()
        });
        await this.membershipSubscriptionRepository.save(membershipSubscription);
        return membershipSubscription;
    }

    async update(subscription: MembershipSubscription): Promise<MembershipSubscription> {
        return await this.membershipSubscriptionRepository.save(subscription);
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
}
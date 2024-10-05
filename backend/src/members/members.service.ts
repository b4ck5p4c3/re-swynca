import {Injectable} from "@nestjs/common";
import {Member} from "../common/database/entities/member.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {DeepPartial, MoreThanOrEqual, Not, Repository} from "typeorm";
import Decimal from "decimal.js";
import {MONEY_DECIMAL_PLACES} from "../common/money";

export const SPACE_MEMBER_ID = "00000000-0000-0000-0000-000000000000";

@Injectable()
export class MembersService {

    constructor(@InjectRepository(Member) private membersRepository: Repository<Member>) {
    }

    async count(): Promise<number> {
        return await this.membersRepository.countBy({
            id: Not(SPACE_MEMBER_ID)
        });
    }

    async findAll(): Promise<Member[]> {
        return await this.membersRepository.find({
            relations: {
                telegramMetadata: true,
                githubMetadata: true
            },
            where: {
                id: Not(SPACE_MEMBER_ID)
            }
        });
    }

    async findById(id: string): Promise<Member | null> {
        if (id === SPACE_MEMBER_ID) {
            return null;
        }
        return await this.findByIdUnfiltered(id);
    }

    async findByIdUnfiltered(id: string): Promise<Member | null> {
        return await this.membersRepository.findOne({
            where: {
                id
            },
            relations: {
                telegramMetadata: true,
                githubMetadata: true
            }
        });
    }

    async existsByIdUnfiltered(id: string): Promise<boolean> {
        return await this.membersRepository.exists({
            where: {
                id
            }
        });
    }

    async existsByEmail(email: string): Promise<boolean> {
        return await this.membersRepository.existsBy({
            email,
            id: Not(SPACE_MEMBER_ID)
        });
    }

    async create(memberData: DeepPartial<Member>): Promise<Member> {
        const member = this.membersRepository.create(memberData);
        await this.membersRepository.save(member);
        return member;
    }

    async update(member: Member): Promise<Member> {
        return await this.membersRepository.save(member);
    }

    async atomicallyIncrementBalance(member: Member, change: Decimal): Promise<void> {
        const incrementResult = await this.membersRepository.createQueryBuilder()
            .update(Member)
            .set({
                balance: () => "balance + :change"
            })
            .where({
                id: member.id
            })
            .setParameter("change", change.toFixed(MONEY_DECIMAL_PLACES))
            .execute();
        if (incrementResult.affected !== 1) {
            throw new Error("Failed to atomically increment balance");
        }
    }

    async atomicallyDecrementNonZeroedBalance(member: Member, change: Decimal): Promise<void> {
        const decrementResult = await this.membersRepository.createQueryBuilder()
            .update(Member)
            .set({
                balance: () => "balance - :change"
            })
            .where({
                id: member.id
            })
            .andWhere("balance >= :change")
            .setParameter("change", change.toFixed(MONEY_DECIMAL_PLACES))
            .execute();
        if (decrementResult.affected !== 1) {
            throw new Error("Failed to atomically decrement non-zeroed balance");
        }
    }
}
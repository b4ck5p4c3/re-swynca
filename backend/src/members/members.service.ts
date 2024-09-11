import {Injectable} from "@nestjs/common";
import {Member} from "../common/database/entities/member.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {DeepPartial, Repository} from "typeorm";
import {Membership} from "../common/database/entities/membership.entity";
import {ACSKey} from "../common/database/entities/acs-key.entity";

@Injectable()
export class MembersService {

    constructor(@InjectRepository(Member) private membersRepository: Repository<Member>) {
    }

    async findAll(): Promise<Member[]> {
        return await this.membersRepository.find({
            relations: {
                balance: true,
                telegramMetadata: true,
                githubMetadata: true
            }
        });
    }

    async findById(id: string): Promise<Member | null> {
        return await this.membersRepository.findOne({
            where: {
                id
            },
            relations: {
                balance: true,
                telegramMetadata: true,
                githubMetadata: true
            }
        });
    }

    async existsByEmail(email: string): Promise<boolean> {
        return await this.membersRepository.existsBy({
            email
        });
    }

    async create(memberData: Omit<DeepPartial<Member>, "id">): Promise<Member> {
        const member = this.membersRepository.create(memberData);
        await this.membersRepository.save(member);
        return member;
    }

    async update(member: Member): Promise<Member> {
        return await this.membersRepository.save(member);
    }
}
import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Membership} from "../common/database/entities/membership.entity";
import {EntityManager, Repository} from "typeorm";
import Decimal from "decimal.js";
import {DeepPartial} from "typeorm/common/DeepPartial";

@Injectable()
export class MembershipsService {
    constructor(@InjectRepository(Membership) private membershipRepository: Repository<Membership>) {
    }

    for(manager: EntityManager): MembershipsService {
        return new MembershipsService(manager.getRepository(Membership));
    }

    async findAll(): Promise<Membership[]> {
        return await this.membershipRepository.find();
    }

    async findById(id: string): Promise<Membership | null> {
        return await this.membershipRepository.findOne({
            where: {
                id
            }
        });
    }

    async create(membershipData: Omit<DeepPartial<Membership>, "id">): Promise<Membership> {
        const membership = this.membershipRepository.create(membershipData);
        await this.membershipRepository.save(membership);
        return membership;
    }

    async update(membership: Membership): Promise<void> {
        await this.membershipRepository.save(membership);
    }

    async transaction<T>(transactionFn: (manager: EntityManager) => Promise<T>): Promise<T> {
        return await this.membershipRepository.manager.transaction(transactionFn);
    }
}
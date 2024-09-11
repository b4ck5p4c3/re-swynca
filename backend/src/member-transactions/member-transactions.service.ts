import {Injectable} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MemberTransaction } from "src/common/database/entities/member-transaction.entity";
import { Repository } from "typeorm";

@Injectable()
export class MemberTransactionsService {
    constructor(@InjectRepository(MemberTransaction) private memberTransactionRepository: Repository<MemberTransaction>) {
    }

    async findAll(): Promise<MemberTransaction[]> {
        return await this.memberTransactionRepository.find();
    }

    async findAllBySubjectMember(id: string): Promise<MemberTransaction[]> {
        return await this.memberTransactionRepository.find({
            where: {
                subject: {
                    id
                }
            }
        });
    }

    async findAllByActorId(id: string): Promise<MemberTransaction[]> {
        return await this.memberTransactionRepository.find({
            where: {
                actor: {
                    id
                }
            }
        });
    }

    async create(memberTransaction: Omit<MemberTransaction, "id">): Promise<MemberTransaction> {
        const createdMemberTransaction = this.memberTransactionRepository.create(memberTransaction);
        await this.memberTransactionRepository.save(createdMemberTransaction);
        return createdMemberTransaction;
    }
}
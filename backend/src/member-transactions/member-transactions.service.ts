import {Injectable} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MemberTransaction } from "src/common/database/entities/member-transaction.entity";
import {EntityManager, FindOptionsOrder, Repository} from "typeorm";
import {SpaceTransaction} from "../common/database/entities/space-transaction.entity";
import {of} from "rxjs";

@Injectable()
export class MemberTransactionsService {
    constructor(@InjectRepository(MemberTransaction) private memberTransactionRepository: Repository<MemberTransaction>) {
    }

    for(manager: EntityManager): MemberTransactionsService {
        return new MemberTransactionsService(manager.getRepository(MemberTransaction));
    }

    async countAll(): Promise<number> {
        return await this.memberTransactionRepository.count();
    }

    async countAllBySubjectId(id: string): Promise<number> {
        return await this.memberTransactionRepository.count({
            where: {
                subject: {
                    id
                }
            }
        });
    }

    async countAllByActorId(id: string): Promise<number> {
        return await this.memberTransactionRepository.count({
            where: {
                actor: {
                    id
                }
            }
        });
    }

    async findAll(offset: number, count: number,
                  orderBy: FindOptionsOrder<MemberTransaction>): Promise<MemberTransaction[]> {
        return await this.memberTransactionRepository.find({
            skip: offset,
            take: count,
            order: orderBy,
            relations: {
                actor: true,
                subject: true
            }
        });
    }

    async findAllBySubjectId(id: string, offset: number, count: number,
                             orderBy: FindOptionsOrder<MemberTransaction>): Promise<MemberTransaction[]> {
        return await this.memberTransactionRepository.find({
            skip: offset,
            take: count,
            order: orderBy,
            relations: {
                actor: true,
                subject: true
            },
            where: {
                subject: {
                    id
                }
            }
        });
    }

    async findAllByActorId(id: string, offset: number, count: number,
                           orderBy: FindOptionsOrder<MemberTransaction>): Promise<MemberTransaction[]> {
        return await this.memberTransactionRepository.find({
            skip: offset,
            take: count,
            order: orderBy,
            relations: {
                actor: true,
                subject: true
            },
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

    async transaction<T>(transactionFn: (manager: EntityManager) => Promise<T>): Promise<T> {
        return await this.memberTransactionRepository.manager.transaction(transactionFn);
    }
}
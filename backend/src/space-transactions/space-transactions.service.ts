import {Injectable} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SpaceTransaction } from "src/common/database/entities/space-transaction.entity";
import { Repository } from "typeorm";

@Injectable()
export class SpaceTransactionsService {
    constructor(@InjectRepository(SpaceTransaction) private spaceTransactionRepository: Repository<SpaceTransaction>) {
    }

    async findAll(): Promise<SpaceTransaction[]> {
        return await this.spaceTransactionRepository.find();
    }

    async findAllByActorId(id: string): Promise<SpaceTransaction[] | null> {
        return await this.spaceTransactionRepository.find({
            where: {
                id
            }
        });
    }
    async create(spaceTransaction: Omit<SpaceTransaction, "id">): Promise<SpaceTransaction> {
        const createdSpaceTransaction = this.spaceTransactionRepository.create(spaceTransaction);
        await this.spaceTransactionRepository.save(createdSpaceTransaction);
        return createdSpaceTransaction;
    }
}
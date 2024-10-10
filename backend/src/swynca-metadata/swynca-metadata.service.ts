import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {SwyncaMetadata} from "../common/database/entities/swynca-metadata.entity";
import {DeepPartial, EntityManager, Repository} from "typeorm";

export const LAST_SUBSCRIPTIONS_WITHDRAWAL = "last-subscriptions-withdrawal";

@Injectable()
export class SwyncaMetadataService {
    constructor(@InjectRepository(SwyncaMetadata) private swyncaMetadataRepository: Repository<SwyncaMetadata>) {
    }

    for(manager: EntityManager): SwyncaMetadataService {
        return new SwyncaMetadataService(manager.getRepository(SwyncaMetadata));
    }

    async findByKey(key: string): Promise<SwyncaMetadata | null> {
        return await this.swyncaMetadataRepository.findOne({
            where: {
                key
            }
        });
    }

    async create(data: DeepPartial<SwyncaMetadata>): Promise<SwyncaMetadata> {
        const swyncaMetadata = this.swyncaMetadataRepository.create(data);
        await this.swyncaMetadataRepository.save(swyncaMetadata);
        return swyncaMetadata;
    }

    async transaction<T>(transactionFn: (manager: EntityManager) => Promise<T>): Promise<T> {
        return await this.swyncaMetadataRepository.manager.transaction(transactionFn);
    }
}
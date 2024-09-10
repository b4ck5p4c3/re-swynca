import {Injectable} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ACSKey } from "src/common/database/entities/acs-key.entity";
import {DeepPartial, Repository} from "typeorm";

@Injectable()
export class ACSKeysService {
    constructor(@InjectRepository(ACSKey) private acsKeyRepository: Repository<ACSKey>) {
    }
    async findAll(): Promise<ACSKey[]> {
        return await this.acsKeyRepository.find();
    }

    async findAllByMemberId(id: string): Promise<ACSKey[] | null> {
        return await this.acsKeyRepository.find({
            where: {
                id
            }
        });
    }

    async create(acsKey: Omit<DeepPartial<ACSKey>, "id">): Promise<ACSKey> {
        const createdACSKey = this.acsKeyRepository.create(acsKey);
        await this.acsKeyRepository.save(createdACSKey);
        return createdACSKey;
    }

    async remove(id: string): Promise<void> {
        await this.acsKeyRepository.delete(id);
    }
}
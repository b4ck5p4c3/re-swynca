import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {ACSKey} from "src/common/database/entities/acs-key.entity";
import {DeepPartial, Repository} from "typeorm";

@Injectable()
export class ACSKeysService {
    constructor(@InjectRepository(ACSKey) private acsKeyRepository: Repository<ACSKey>) {
    }

    async findAllByMemberId(id: string): Promise<ACSKey[] | null> {
        return await this.acsKeyRepository.find({
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

    async existsByKey(key: string): Promise<boolean> {
        return this.acsKeyRepository.existsBy({
            key
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
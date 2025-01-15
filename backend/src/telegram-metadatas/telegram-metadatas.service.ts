import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {DeepPartial, EntityManager, Repository} from "typeorm";
import {TelegramMetadata} from "../common/database/entities/telegram-metadata.entity";
import {MemberStatus} from "../common/database/entities/member.entity";

@Injectable()
export class TelegramMetadatasService {
    constructor(@InjectRepository(TelegramMetadata) private telegramMetadataRepository: Repository<TelegramMetadata>) {
    }

    for(manager: EntityManager): TelegramMetadatasService {
        return new TelegramMetadatasService(manager.getRepository(TelegramMetadata));
    }

    async findForActiveMembers(): Promise<TelegramMetadata[]> {
        return await this.telegramMetadataRepository.find({
            relations: {
                member: true
            },
            where: {
                member: {
                    status: MemberStatus.ACTIVE
                }
            }
        });
    }

    async create(telegramMetadataData: DeepPartial<TelegramMetadata>): Promise<TelegramMetadata> {
        const telegramMetadata = this.telegramMetadataRepository.create(telegramMetadataData);
        await this.telegramMetadataRepository.save(telegramMetadata);
        return telegramMetadata;
    }

    async update(telegramMetadata: TelegramMetadata): Promise<TelegramMetadata> {
        await this.telegramMetadataRepository.save(telegramMetadata);
        return telegramMetadata;
    }

    async remove(telegramId: string) {
        await this.telegramMetadataRepository.delete(telegramId);
    }

    async existsByTelegramId(telegramId: string) {
        return await this.telegramMetadataRepository.existsBy({
            telegramId
        });
    }

    async updateByTelegramId(telegramId: string, telegramMetadataData: DeepPartial<TelegramMetadata>) {
        await this.telegramMetadataRepository.update({
            telegramId
        }, telegramMetadataData);
    }
}
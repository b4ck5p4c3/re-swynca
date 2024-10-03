import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {DeepPartial, Repository} from "typeorm";
import {TelegramMetadata} from "../common/database/entities/telegram-metadata.entity";

@Injectable()
export class TelegramMetadatasService {
    constructor(@InjectRepository(TelegramMetadata) private telegramMetadataRepository: Repository<TelegramMetadata>) {
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
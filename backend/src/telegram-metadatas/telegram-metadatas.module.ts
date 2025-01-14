import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {TelegramMetadata} from "../common/database/entities/telegram-metadata.entity";
import {TelegramMetadatasService} from "./telegram-metadatas.service";
import {TelegramMetadatasController} from "./telegram-metadatas.controller";

@Module({
    imports: [TypeOrmModule.forFeature([TelegramMetadata])],
    providers: [TelegramMetadatasService],
    controllers: [TelegramMetadatasController],
    exports: [TelegramMetadatasService]
})
export class TelegramMetadatasModule {
}
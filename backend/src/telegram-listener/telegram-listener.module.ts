import {Module} from "@nestjs/common";
import {TelegramListenerController} from "./telegram-listener.controller";
import {ConfigModule} from "@nestjs/config";
import {TelegramMetadatasModule} from "../telegram-metadatas/telegram-metadatas.module";
import {TelegramListenerAuthGuard} from "./telegram-listener-auth.guard";

@Module({
    providers: [TelegramListenerAuthGuard],
    controllers: [TelegramListenerController],
    imports: [ConfigModule, TelegramMetadatasModule]
})
export class TelegramListenerModule {}
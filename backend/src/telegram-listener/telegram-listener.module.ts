import {Module} from "@nestjs/common";
import {TelegramListenerController} from "./telegram-listener.controller";
import {ConfigModule} from "@nestjs/config";
import {TelegramMetadatasModule} from "../telegram-metadatas/telegram-metadatas.module";
import {TelegramListenerGuard} from "./telegram-listener.guard";

@Module({
    providers: [TelegramListenerGuard],
    controllers: [TelegramListenerController],
    imports: [ConfigModule, TelegramMetadatasModule]
})
export class TelegramListenerModule {}
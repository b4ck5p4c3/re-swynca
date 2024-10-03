import {Body, Controller, Logger, Post, UseGuards} from "@nestjs/common";
import {TelegramMetadatasService} from "../telegram-metadatas/telegram-metadatas.service";
import {NoAuth} from "../auth/no-auth.decorator";
import {ApiExcludeEndpoint} from "@nestjs/swagger";
import {TelegramListenerGuard} from "./telegram-listener.guard";

class TelegramWebhookData {
    message?: {
        from?: {
            id?: string,
            username?: string
        }
    }
}

@Controller("telegram")
export class TelegramListenerController {
    constructor(private telegramMetadatasService: TelegramMetadatasService) {
    }

    @Post("/bot")
    @ApiExcludeEndpoint()
    @NoAuth()
    @UseGuards(TelegramListenerGuard)
    async botCallback(@Body() request: TelegramWebhookData): Promise<"OK"> {
        console.info(request);
        if (request.message?.from?.id && request.message?.from?.username) {
            await this.telegramMetadatasService.updateByTelegramId(request.message.from.id, {
                telegramName: request.message.from.username
            });
        }
        return "OK";
    }
}
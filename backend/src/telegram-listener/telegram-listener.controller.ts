import {Body, Controller, HttpCode, Logger, Post, UseGuards} from "@nestjs/common";
import {TelegramMetadatasService} from "../telegram-metadatas/telegram-metadatas.service";
import {NoAuth} from "../auth/no-auth.decorator";
import {ApiExcludeEndpoint} from "@nestjs/swagger";
import {TelegramListenerAuthGuard} from "./telegram-listener-auth.guard";

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
    @UseGuards(TelegramListenerAuthGuard)
    @HttpCode(200)
    async botCallback(@Body() request: TelegramWebhookData): Promise<"OK"> {
        if (request.message?.from?.id && request.message?.from?.username) {
            await this.telegramMetadatasService.updateByTelegramId(request.message.from.id, {
                telegramName: request.message.from.username
            });
        }
        return "OK";
    }
}
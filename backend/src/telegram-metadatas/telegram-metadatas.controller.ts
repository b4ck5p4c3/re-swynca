import {Controller, Get, UseGuards} from "@nestjs/common";
import {ApiExcludeEndpoint, ApiTags} from "@nestjs/swagger";
import {NoAuth} from "../auth/no-auth.decorator";
import {TelegramMetadatasService} from "./telegram-metadatas.service";
import {TelegramMetadatasSystemApiAuthGuard} from "./telegram-metadatas-system-api-auth.guard";

class TelegramMetadatasSystemResponseDTO {
    telegrams: Record<string, string>
}

@Controller("telegram-metadatas")
@ApiTags("telegram-metadatas")
export class TelegramMetadatasController {

    constructor(private readonly telegramMetadataService: TelegramMetadatasService) {}

    @Get("system")
    @ApiExcludeEndpoint()
    @NoAuth()
    @UseGuards(TelegramMetadatasSystemApiAuthGuard)
    async findAllForACSSystem(): Promise<TelegramMetadatasSystemResponseDTO> {
        const result: TelegramMetadatasSystemResponseDTO = {
            telegrams: {}
        }
        for (const telegramMetadata of await this.telegramMetadataService.find()) {
            result.telegrams[telegramMetadata.telegramId] = `${telegramMetadata.member.id}/${telegramMetadata.telegramName}`
        }
        return result;
    }
}
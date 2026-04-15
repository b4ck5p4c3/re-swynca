import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger'

import { NoAuth } from '../auth/no-auth.decorator'
import { TelegramMetadatasSystemApiAuthGuard } from './telegram-metadatas-system-api-auth.guard'
import { TelegramMetadatasService } from './telegram-metadatas.service'

class TelegramMetadatasSystemResponseDTO {
  telegrams: Record<string, string>
}

@ApiTags('telegram-metadatas')
@Controller('telegram-metadatas')
export class TelegramMetadatasController {
  constructor (private readonly telegramMetadataService: TelegramMetadatasService) {}

  @ApiExcludeEndpoint()
  @Get('system')
  @NoAuth()
  @UseGuards(TelegramMetadatasSystemApiAuthGuard)
  async findAllForACSSystem (): Promise<TelegramMetadatasSystemResponseDTO> {
    const result: TelegramMetadatasSystemResponseDTO = {
      telegrams: {}
    }
    for (const telegramMetadata of await this.telegramMetadataService.findForActiveMembers()) {
      result.telegrams[telegramMetadata.telegramId] = `${telegramMetadata.member.id}/${telegramMetadata.telegramName}`
    }
    return result
  }
}

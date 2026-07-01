import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { EmptyResponse } from 'src/common/utils'

import { EntranceSoundListResponseDto } from './dto/entrance-sound-list-response.dto'
import { EntranceSoundDto } from './dto/entrance-sound.dto'
import { PlayEntranceSoundRequestDto } from './dto/play-entrance-sound-request.dto'
import { EntranceSoundService } from './entrance-sound.service'
import { Errors } from 'src/common/errors'

@ApiTags('entrance-sound')
@Controller('entrance-sound')
export class EntranceSoundController {
  private readonly logger = new Logger(EntranceSoundController.name)

  constructor (
    private readonly entranceSoundService: EntranceSoundService,
  ) {}

  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Get entrance sound by ID'
  })
  @Get(':id')
  async getById (@Param('id') id: string): Promise<EntranceSoundDto> {
    return this.entranceSoundService.getById(id)
  }

  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Get list of all entrance sounds'
  })
  @Get()
  async getList (): Promise<EntranceSoundListResponseDto> {
    return this.entranceSoundService.getList()
  }

  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Play an entrance sound'
  })
  @Post('play')
  async playSound (@Body() input: PlayEntranceSoundRequestDto): Promise<EmptyResponse> {
    try {
      await this.entranceSoundService.playSound(input)
    } catch (error) {
      // As we don't have a global interceptor for handling external dependency interaction errors,
      // we simply throw a Quasar error code here.
      this.logger.error(`Failed to play entrance sound with ID ${input.id}: ${error}`)
      throw new HttpException(Errors.QUASAR_TTS_ERROR, HttpStatus.SERVICE_UNAVAILABLE)
    }
    return {}
  }
}

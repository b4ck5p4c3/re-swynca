import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { EntranceSoundListResponseDto } from './dto/entrance-sound-list-response.dto'
import { EntranceSoundDto } from './dto/entrance-sound.dto'
import { PlayEntranceSoundRequestDto } from './dto/play-entrance-sound-request.dto'
import { EntranceSoundService } from './entrance-sound.service'

@ApiTags('entrance-sound')
@Controller('entrance-sound')
export class EntranceSoundController {
  constructor (private readonly entranceSoundService: EntranceSoundService) {}

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
  async playSound (@Body() input: PlayEntranceSoundRequestDto): Promise<void> {
    return this.entranceSoundService.playSound(input)
  }
}

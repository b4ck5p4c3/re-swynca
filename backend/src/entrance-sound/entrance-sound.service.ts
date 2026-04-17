import { HttpService } from '@nestjs/axios'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { EntranceSound } from 'src/common/database/entities/entrance-sound.entity'
import { Errors } from 'src/common/errors'
import { Repository } from 'typeorm'

import { EntranceSoundListResponseDto } from './dto/entrance-sound-list-response.dto'
import { PlayEntranceSoundRequestDto } from './dto/play-entrance-sound-request.dto'

@Injectable()
export class EntranceSoundService {
  constructor (
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(EntranceSound) private entranceSoundRepository: Repository<EntranceSound>
  ) {}

  async getById (id: string): Promise<EntranceSound> {
    const sound = await this.entranceSoundRepository.findOne({ where: { id } })
    if (!sound) {
      throw new HttpException(Errors.ENTRANCE_SOUND_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    return sound
  }

  async getList (): Promise<EntranceSoundListResponseDto> {
    const sounds = await this.entranceSoundRepository.find({
      order: {
        name: 'asc'
      }
    })
    return { sounds }
  }

  async playSound (input: PlayEntranceSoundRequestDto): Promise<void> {
    const playbackUrl = this.configService.get<string>('SWYNCA_ENTRANCE_SOUND_PLAYBACK_URL')
    if (!playbackUrl) {
      throw new HttpException(Errors.FEATURE_NOT_AVAILABLE, HttpStatus.NOT_IMPLEMENTED)
    }

    const sound = await this.entranceSoundRepository.findOne({ where: { id: input.id } })
    if (!sound) {
      throw new HttpException(Errors.ENTRANCE_SOUND_NOT_FOUND, HttpStatus.NOT_FOUND)
    }

    await this.httpService.axiosRef.post(playbackUrl, {
      eventText: `<speaker audio="${sound.key}">`
    })
  }
}

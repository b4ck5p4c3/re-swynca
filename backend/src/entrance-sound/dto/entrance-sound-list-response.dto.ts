import { ApiProperty } from '@nestjs/swagger'

import { EntranceSoundDto } from './entrance-sound.dto'

export class EntranceSoundListResponseDto {
  @ApiProperty({ type: [EntranceSoundDto] })
  sounds: EntranceSoundDto[]
}

import { ApiProperty } from '@nestjs/swagger'

export class PlayEntranceSoundRequestDto {
  @ApiProperty({ description: 'ID of the entrance sound to play', format: 'uuid' })
  id: string
}

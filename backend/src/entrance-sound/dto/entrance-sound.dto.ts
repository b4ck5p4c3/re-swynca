import { ApiProperty } from '@nestjs/swagger'

export class EntranceSoundDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty()
  name: string
}

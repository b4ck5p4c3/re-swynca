import { ApiProperty } from '@nestjs/swagger'

export class ErrorApiResponse {
  @ApiProperty()
  message: string

  @ApiProperty()
  statusCode: number
}

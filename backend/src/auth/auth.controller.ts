import { Controller, Get } from '@nestjs/common'
import { ApiCookieAuth, ApiDefaultResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'

import { ErrorApiResponse } from '../common/api-responses'
import { UserId } from './user-id.decorator'

class SelfAuthInfoDTO {
  @ApiProperty({ format: 'uuid' })
  id: string
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: SelfAuthInfoDTO
  })
  @ApiOperation({
    summary: 'Get self member auth info'
  })
  @Get('self')
  async getSelf (@UserId() userId: string): Promise<SelfAuthInfoDTO> {
    return {
      id: userId
    }
  }
}

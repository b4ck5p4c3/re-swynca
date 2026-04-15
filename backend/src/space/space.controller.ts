import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common'
import { ApiCookieAuth, ApiDefaultResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'

import { ErrorApiResponse } from '../common/api-responses'
import { Errors } from '../common/errors'
import { MONEY_DECIMAL_PLACES } from '../common/money'
import { MembersService, SPACE_MEMBER_ID } from '../members/members.service'

class SpaceBalanceDTO {
  @ApiProperty()
  balance: string
}

@ApiTags('space')
@Controller('space')
export class SpaceController {
  constructor (private membersService: MembersService) {}

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: SpaceBalanceDTO
  })
  @ApiOperation({
    summary: 'Get space balance'
  })
  @Get('balance')
  async getBalance (): Promise<SpaceBalanceDTO> {
    const spaceMember = await this.membersService.findByIdUnfiltered(SPACE_MEMBER_ID)
    if (!spaceMember) {
      throw new HttpException(Errors.SPACE_MEMBER_NOT_FOUND, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    return {
      balance: spaceMember.balance.toFixed(MONEY_DECIMAL_PLACES)
    }
  }
}

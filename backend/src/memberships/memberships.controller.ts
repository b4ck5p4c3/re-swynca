import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post } from '@nestjs/common'
import {
  ApiBody,
  ApiCookieAuth,
  ApiDefaultResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags
} from '@nestjs/swagger'
import { IsNotEmpty, IsNumberString } from 'class-validator'
import Decimal from 'decimal.js'

import { AuditLogService } from '../audit-log/audit-log.service'
import { UserId } from '../auth/user-id.decorator'
import { getValidActor } from '../common/actor-helper'
import { ErrorApiResponse } from '../common/api-responses'
import { Membership } from '../common/database/entities/membership.entity'
import { Errors } from '../common/errors'
import { CustomValidationError } from '../common/exceptions'
import { MONEY_DECIMAL_PLACES, MONEY_PRECISION } from '../common/money'
import { MembersService } from '../members/members.service'
import { MembershipsService } from './memberships.service'

class CreateUpdateMembershipDTO {
  @ApiProperty()
  @IsNotEmpty()
  active: boolean

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  amount: string

  @ApiProperty()
  @IsNotEmpty()
  title: string
}

class MembershipDTO {
  @ApiProperty()
  active: boolean

  @ApiProperty()
  amount: string

  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty()
  title: string
}

@ApiTags('memberships')
@Controller('memberships')
export class MembershipsController {
  constructor (private membershipService: MembershipsService,
    private membersService: MembersService,
    private auditLogService: AuditLogService) {}

  private static mapToDTO (membership: Membership): MembershipDTO {
    return {
      active: membership.active,
      amount: membership.amount.toFixed(MONEY_DECIMAL_PLACES),
      id: membership.id,
      title: membership.title
    }
  }

  @ApiBody({
    type: CreateUpdateMembershipDTO
  })
  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successfull response',
    type: MembershipDTO
  })
  @ApiOperation({
    summary: 'Create new membership'
  })
  @Post()
  async create (@UserId() actorId: string, @Body() request: CreateUpdateMembershipDTO): Promise<MembershipDTO> {
    const actor = await getValidActor(this.membersService, actorId)
    const decimalAmount = new Decimal(request.amount).toDecimalPlaces(MONEY_DECIMAL_PLACES)
    if (decimalAmount.lessThanOrEqualTo(0)) {
      throw new CustomValidationError('Membership amount must be > 0')
    }
    if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
      throw new CustomValidationError(`Membership amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`)
    }

    return MembershipsController.mapToDTO(await this.membershipService.transaction(async manager => {
      const membership = await this.membershipService.for(manager).create({
        active: request.active,
        amount: decimalAmount,
        title: request.title
      })

      await this.auditLogService.for(manager).create('create-membership', actor, {
        active: membership.active,
        amount: membership.amount.toFixed(MONEY_DECIMAL_PLACES),
        id: membership.id,
        title: membership.title
      })

      return membership
    }))
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: [MembershipDTO]
  })
  @ApiOperation({
    summary: 'Get all memberships'
  })
  @Get()
  async findAll (): Promise<MembershipDTO[]> {
    return (await this.membershipService.findAll()).map(MembershipsController.mapToDTO)
  }

  @ApiBody({
    type: CreateUpdateMembershipDTO
  })
  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successfull response',
    type: MembershipDTO
  })
  @ApiOperation({
    summary: 'Update membership'
  })
  @Patch(':id')
  async updateMembership (@UserId() actorId: string, @Param('id') id: string,
    @Body() request: CreateUpdateMembershipDTO): Promise<MembershipDTO> {
    const actor = await getValidActor(this.membersService, actorId)
    const decimalAmount = new Decimal(request.amount).toDecimalPlaces(MONEY_DECIMAL_PLACES)
    if (decimalAmount.lessThanOrEqualTo(0)) {
      throw new CustomValidationError('Membership amount must be > 0')
    }
    if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
      throw new CustomValidationError(`Membership amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`)
    }

    return MembershipsController.mapToDTO(await this.membershipService.transaction(async manager => {
      const membership = await this.membershipService.for(manager).findById(id)
      if (!membership) {
        throw new HttpException(Errors.MEMBERSHIP_NOT_FOUND, HttpStatus.NOT_FOUND)
      }

      membership.title = request.title
      membership.amount = decimalAmount
      membership.active = request.active

      await this.membershipService.for(manager).update(membership)

      await this.auditLogService.for(manager).create('update-membership', actor, {
        active: membership.active,
        amount: membership.amount.toFixed(MONEY_DECIMAL_PLACES),
        id: membership.id,
        title: membership.title
      })

      return membership
    }))
  }
}

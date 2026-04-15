import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common'
import {
  ApiBody,
  ApiCookieAuth,
  ApiDefaultResponse, ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags
} from '@nestjs/swagger'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { MembershipSubscription } from 'src/common/database/entities/membership-subscription.entity'
import { MembersService } from 'src/members/members.service'
import { MembershipsService } from 'src/memberships/memberships.service'

import { AuditLogService } from '../audit-log/audit-log.service'
import { UserId } from '../auth/user-id.decorator'
import { getValidActor } from '../common/actor-helper'
import { ErrorApiResponse } from '../common/api-responses'
import { Errors } from '../common/errors'
import { MONEY_DECIMAL_PLACES } from '../common/money'
import { EmptyResponse } from '../common/utils'
import {
  MembershipSubscriptionAlreadyDeclinedError,
  MembershipSubscriptionAlreadyExistsError,
  MembershipSubscriptionsService
} from './membership-subscriptions.service'

class MembershipSubscriptionDTO {
  @ApiProperty({ format: 'date-time', required: false })
  declinedAt?: string

  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'uuid' })
  memberId: string

  @ApiProperty({ format: 'uuid' })
  membershipId: string

  @ApiProperty({ format: 'date-time' })
  subscribedAt: string
}

class MembershipSubscriptionStatsDTO {
  @ApiProperty()
  totalActiveAmount: string
}

class SubscribeDTO {
  @ApiProperty({ format: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  memberId: string

  @ApiProperty({ format: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  membershipId: string
}

@ApiTags('membership-subscriptions')
@Controller('membership-subscriptions')
export class MembershipSubscriptionsController {
  constructor (private membershipSubscriptionsService: MembershipSubscriptionsService,
    private membersService: MembersService, private membershipService: MembershipsService,
    private auditLogService: AuditLogService) {}

  private static mapToDTO (membershipSubscription: MembershipSubscription): MembershipSubscriptionDTO {
    return {
      declinedAt: membershipSubscription.declinedAt
        ? membershipSubscription.declinedAt.toISOString()
        : undefined,
      id: membershipSubscription.id,
      memberId: membershipSubscription.member.id,
      membershipId: membershipSubscription.membership.id,
      subscribedAt: membershipSubscription.subscribedAt.toISOString()
    }
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: [MembershipSubscriptionDTO]
  })
  @ApiOperation({
    summary: 'Get all membership subscriptions for member'
  })
  @Get('member/:memberId')
  async findAllByMemberId (@Param('memberId') memberId: string): Promise<MembershipSubscriptionDTO[]> {
    return (await this.membershipSubscriptionsService.findAllByMemberId(memberId))
      .map(MembershipSubscriptionsController.mapToDTO)
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: [MembershipSubscriptionDTO]
  })
  @ApiOperation({
    summary: 'Get all membership subscriptions for membership'
  })
  @Get('membership/:membershipId')
  async findAllByMembershipId (@Param('membershipId') membershipId: string): Promise<MembershipSubscriptionDTO[]> {
    return (await this.membershipSubscriptionsService.findAllByMembershipId(membershipId)).map(MembershipSubscriptionsController.mapToDTO)
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MembershipSubscriptionStatsDTO
  })
  @ApiOperation({
    summary: 'Get all membership subscriptions statistics'
  })
  @Get('stats')
  async stats (): Promise<MembershipSubscriptionStatsDTO> {
    return {
      totalActiveAmount: (await this.membershipSubscriptionsService.getSumOfActive())
        .toFixed(MONEY_DECIMAL_PLACES)
    }
  }

  @ApiBody({
    type: SubscribeDTO
  })
  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MembershipSubscriptionDTO
  })
  @ApiOperation({
    summary: 'Subscribe member to membership'
  })
  @Post()
  async subscribe (@UserId() actorId: string, @Body() request: SubscribeDTO): Promise<MembershipSubscriptionDTO> {
    const actor = await getValidActor(this.membersService, actorId)
    const { memberId, membershipId } = request
    const member = await this.membersService.findById(memberId)
    if (!member) {
      throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    const membership = await this.membershipService.findById(membershipId)
    if (!membership) {
      throw new HttpException(Errors.MEMBERSHIP_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    if (!membership.active) {
      throw new HttpException(Errors.MEMBERSHIP_FROZEN, HttpStatus.BAD_REQUEST)
    }

    return MembershipSubscriptionsController.mapToDTO(await this.membershipSubscriptionsService.transaction(async manager => {
      const activeSubscription = await this.membershipSubscriptionsService.for(manager)
        .findActiveByMemberIdAndMembershipIdLocked(member.id, membership.id)
      if (activeSubscription) {
        throw new HttpException(Errors.MEMBER_ALREADY_SUBSCRIBED, HttpStatus.BAD_REQUEST)
      }

      const membershipSubscription = await this.membershipSubscriptionsService.for(manager).create({
        declinedAt: null,
        member,
        membership,
        subscribedAt: new Date()
      })

      await this.auditLogService.for(manager).create('subscribe-member', actor, {
        memberId: member.id,
        membershipId: membership.id,
        membershipSubscriptionId: membershipSubscription.id
      })

      return membershipSubscription
    }))
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: EmptyResponse
  })
  @ApiOperation({
    summary: 'Unsubscribe member from membership'
  })
  @Delete(':id')
  async unsubscribe (@UserId() actorId: string, @Param('id') id: string): Promise<EmptyResponse> {
    const actor = await getValidActor(this.membersService, actorId)
    const membershipSubscription = await this.membershipSubscriptionsService.findById(id)
    if (!membershipSubscription) {
      throw new HttpException(Errors.MEMBERSHIP_SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    await this.membershipSubscriptionsService.transaction(async manager => {
      membershipSubscription.declinedAt = new Date()
      if (!await this.membershipSubscriptionsService.for(manager).updateIfActive(membershipSubscription)) {
        throw new HttpException(Errors.MEMBERSHIP_SUBSCRIPTION_ALREADY_DECLINED, HttpStatus.BAD_REQUEST)
      }
      await this.auditLogService.for(manager).create('unsubscribe-member', actor, {
        membershipSubscriptionId: membershipSubscription.id
      })
    })
    return {}
  }
}

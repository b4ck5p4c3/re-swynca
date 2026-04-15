import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import {
  ApiCookieAuth,
  ApiDefaultResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiProperty, ApiTags
} from '@nestjs/swagger'
import { IsNotEmpty, IsUUID, Matches } from 'class-validator'

import { AuditLogService } from '../audit-log/audit-log.service'
import { NoAuth } from '../auth/no-auth.decorator'
import { UserId } from '../auth/user-id.decorator'
import { getValidActor } from '../common/actor-helper'
import { ErrorApiResponse } from '../common/api-responses'
import { MAC } from '../common/database/entities/mac.entity'
import { Errors } from '../common/errors'
import { EmptyResponse } from '../common/utils'
import { MembersService } from '../members/members.service'
import { MacsSystemApiAuthGuard } from './macs-system-api-auth.guard'
import { MACsService } from './macs.service'

class CreateMACDTO {
  @ApiProperty()
  @IsNotEmpty()
  description: string

  @ApiProperty()
  @IsNotEmpty()
  @Matches('^([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2})$')
  mac: string

  @ApiProperty({ format: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  memberId: string
}

class MACDTO {
  @ApiProperty()
  description: string

  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty()
  mac: string
}

class MacsSystemResponseDTO {
  macs: {
    mac: string;
    memberId: string;
    memberUsername: string;
  }[]
}

@ApiTags('macs')
@Controller('macs')
export class MACsController {
  constructor (private membersService: MembersService, private macsService: MACsService,
    private auditLogService: AuditLogService) {}

  private static mapToDTO (mac: MAC): MACDTO {
    return {
      description: mac.description,
      id: mac.id,
      mac: mac.mac
    }
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MACDTO
  })
  @ApiOperation({
    summary: 'Create new MAC'
  })
  @Post()
  async create (@UserId() actorId: string, @Body() request: CreateMACDTO): Promise<MACDTO> {
    const { memberId } = request
    const member = await getValidActor(this.membersService, memberId)
    const actor = await getValidActor(this.membersService, actorId)
    return MACsController.mapToDTO(await this.macsService.transaction(async manager => {
      const mac = await this.macsService.for(manager).create({
        description: request.description,
        mac: request.mac,
        member
      })
      await this.auditLogService.for(manager).create('create-mac', actor, {
        description: mac.description,
        id: mac.id,
        mac: mac.mac,
        memberId,
      })
      return mac
    }))
  }

  @ApiExcludeEndpoint()
  @Get('system')
  @NoAuth()
  @UseGuards(MacsSystemApiAuthGuard)
  async findAll (): Promise<MacsSystemResponseDTO> {
    const result: MacsSystemResponseDTO = {
      macs: []
    }
    for (const mac of await this.macsService.findForActiveMembers()) {
      result.macs.push({
        mac: mac.mac,
        memberId: mac.member.id,
        memberUsername: mac.member.username
      })
    }
    return result
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: [MACDTO]
  })
  @ApiOperation({
    summary: 'Get MACs for specific member'
  })
  @Get('member/:memberId')
  async findByMemberId (@Param('memberId') memberId: string): Promise<MACDTO[]> {
    return (await this.macsService.findByMemberId(memberId)).map(MACsController.mapToDTO)
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
    summary: 'Delete MAC'
  })
  @Delete(':id')
  async remove (@UserId() actorId: string, @Param('id') id: string): Promise<EmptyResponse> {
    const actor = await getValidActor(this.membersService, actorId)
    const mac = await this.macsService.findById(id)
    if (!mac) {
      throw new HttpException(Errors.MAC_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    await this.macsService.transaction(async manager => {
      await this.macsService.for(manager).remove(id)
      await this.auditLogService.for(manager).create('delete-mac', actor, {
        id
      })
    })
    return {}
  }
}

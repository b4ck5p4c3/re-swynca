import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import {
  ApiBody,
  ApiCookieAuth,
  ApiDefaultResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags
} from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsUUID, Matches } from 'class-validator'
import { MembersService } from 'src/members/members.service'

import { AuditLogService } from '../audit-log/audit-log.service'
import { NoAuth } from '../auth/no-auth.decorator'
import { UserId } from '../auth/user-id.decorator'
import { getValidActor } from '../common/actor-helper'
import { ErrorApiResponse } from '../common/api-responses'
import { ACSKey, ACSKeyType } from '../common/database/entities/acs-key.entity'
import { Errors } from '../common/errors'
import { EmptyResponse } from '../common/utils'
import { AcsKeysSystemApiAuthGuard } from './acs-keys-system-api-auth.guard'
import { ACSKeysService } from './acs-keys.service'

class ACSKeyDTO {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty()
  key: string

  @ApiProperty({ format: 'uuid' })
  memberId: string

  @ApiProperty()
  name: string

  @ApiProperty({ enum: ACSKeyType })
  type: ACSKeyType
}

class ACSKeysSystemResponseDTO {
  pans: Record<string, string>
  uids: Record<string, string>
}

class CreateACSKeyDTO {
  @ApiProperty()
  @IsNotEmpty()
  @Matches('^([0-9a-fA-F]+)$')
  key: string

  @ApiProperty({ format: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  memberId: string

  @ApiProperty()
  @IsNotEmpty()
  name: string

  @ApiProperty({ enum: ACSKeyType })
  @IsEnum(ACSKeyType)
  @IsNotEmpty()
  type: ACSKeyType
}

@ApiTags('acs-keys')
@Controller('acs-keys')
export class ACSKeysController {
  constructor (private acsKeysService: ACSKeysService, private membersService: MembersService,
    private auditLogService: AuditLogService) {}

  private static mapToDTO (acsKey: ACSKey): ACSKeyDTO {
    return {
      id: acsKey.id,
      key: acsKey.key,
      memberId: acsKey.member.id,
      name: acsKey.name,
      type: acsKey.type
    }
  }

  @ApiBody({
    type: CreateACSKeyDTO
  })
  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: ACSKeyDTO
  })
  @ApiOperation({
    summary: 'Create ACS key'
  })
  @Post()
  async create (@UserId() actorId: string, @Body() request: CreateACSKeyDTO): Promise<ACSKeyDTO> {
    const actor = await getValidActor(this.membersService, actorId)
    const { key, memberId, name, type } = request
    const member = await this.membersService.findById(memberId)
    if (!member) {
      throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    const realKey = key.toUpperCase()
    if (await this.acsKeysService.existsByKey(realKey)) {
      throw new HttpException(Errors.ACS_KEY_ALREADY_EXISTS, HttpStatus.BAD_REQUEST)
    }
    return ACSKeysController.mapToDTO(await this.acsKeysService.transaction(async (manager) => {
      const acsKey = await this.acsKeysService.for(manager).create({
        key: realKey,
        member,
        name,
        type
      })
      await this.auditLogService.for(manager).create('create-acs-key', actor, {
        id: acsKey.id,
        key: acsKey.key,
        memberId: member.id,
        name: acsKey.name,
        type: acsKey.type
      })
      return acsKey
    }))
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: [ACSKeyDTO]
  })
  @ApiOperation({
    summary: 'Get ACS keys for specific member'
  })
  @Get('member/:memberId')
  async findAllByMemberId (@Param('memberId') memberId: string): Promise<ACSKeyDTO[]> {
    return (await this.acsKeysService.findAllByMemberId(memberId)).map(ACSKeysController.mapToDTO)
  }

  @ApiExcludeEndpoint()
  @Get('system')
  @NoAuth()
  @UseGuards(AcsKeysSystemApiAuthGuard)
  async findAllForACSSystem (): Promise<ACSKeysSystemResponseDTO> {
    const result: ACSKeysSystemResponseDTO = {
      pans: {},
      uids: {}
    }
    for (const acsKey of await this.acsKeysService.findForActiveMembers()) {
      switch (acsKey.type) {
        case ACSKeyType.PAN: {
          result.pans[acsKey.key] = `${acsKey.id}/${acsKey.member.id}/${acsKey.member.entranceSound?.key ?? 'null'}`
          break
        }
        case ACSKeyType.UID: {
          result.uids[acsKey.key] = `${acsKey.id}/${acsKey.member.id}/${acsKey.member.entranceSound?.key ?? 'null'}`
          break
        }
      }
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
    type: EmptyResponse
  })
  @ApiOperation({
    summary: 'Delete ACS key'
  })
  @Delete(':id')
  async remove (@UserId() actorId: string, @Param('id') id: string): Promise<EmptyResponse> {
    const actor = await getValidActor(this.membersService, actorId)
    await this.acsKeysService.transaction(async manager => {
      await this.acsKeysService.for(manager).remove(id)
      await this.auditLogService.for(manager).create('delete-acs-key', actor, {
        id
      })
    })
    return {}
  }
}

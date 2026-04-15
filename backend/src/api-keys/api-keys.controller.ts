import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiCookieAuth, ApiDefaultResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'
import { randomBytes } from 'node:crypto'

import { AuditLogService } from '../audit-log/audit-log.service'
import { UserId } from '../auth/user-id.decorator'
import { getValidActor } from '../common/actor-helper'
import { ErrorApiResponse } from '../common/api-responses'
import { ApiKey } from '../common/database/entities/api-key.entity'
import { Errors } from '../common/errors'
import { EmptyResponse } from '../common/utils'
import { MembersService } from '../members/members.service'
import { SessionStorageService } from '../session-storage/session-storage.service'
import { ApiKeysService } from './api-keys.service'

class ApiKeyDTO {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty()
  key: string
}

@ApiTags('api-keys')
@Controller('api-keys')
export class ApiKeysController {
  constructor (private apiKeysService: ApiKeysService, private membersService: MembersService,
    private auditLogService: AuditLogService, private sessionStorageService: SessionStorageService) {}

  private static mapToDTO (apiKey: ApiKey): ApiKeyDTO {
    return {
      id: apiKey.id,
      key: apiKey.key
    }
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: ApiKeyDTO
  })
  @ApiOperation({
    summary: 'Create new API key'
  })
  @Post()
  async create (@UserId() actorId: string): Promise<ApiKeyDTO> {
    const actor = await getValidActor(this.membersService, actorId)
    const key = `swynca${randomBytes(32).toString('hex')}0b08`
    return ApiKeysController.mapToDTO(await this.apiKeysService.transaction(async manager => {
      const apiKey = await this.apiKeysService.for(manager).create({
        key,
        member: actor
      })
      await this.sessionStorageService.add(key, actor.id)
      await this.auditLogService.for(manager).create('create-api-key', actor, {
        id: apiKey.id,
        key: apiKey.key
      })
      return apiKey
    }))
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: [ApiKeyDTO]
  })
  @ApiOperation({
    summary: 'Get your API keys'
  })
  @Get()
  async findMy (@UserId() actorId: string): Promise<ApiKeyDTO[]> {
    return (await this.apiKeysService.findByMemberId(actorId)).map(key => ApiKeysController.mapToDTO(key))
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
    summary: 'Delete API key'
  })
  @Delete(':id')
  async remove (@UserId() actorId: string, @Param('id') id: string): Promise<EmptyResponse> {
    const actor = await getValidActor(this.membersService, actorId)
    const apiKey = await this.apiKeysService.findById(id)
    if (!apiKey) {
      throw new HttpException(Errors.API_KEY_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    await this.apiKeysService.transaction(async manager => {
      await this.apiKeysService.for(manager).remove(id)
      await this.sessionStorageService.revokeToken(apiKey.key)
      await this.auditLogService.for(manager).create('delete-acs-key', actor, {
        id
      })
    })
    return {}
  }
}

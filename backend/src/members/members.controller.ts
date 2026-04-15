import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ApiBody,
  ApiCookieAuth,
  ApiDefaultResponse, ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags
} from '@nestjs/swagger'
import { IsEmail, IsEnum, IsNotEmpty, Matches } from 'class-validator'

import { ApiKeysService } from '../api-keys/api-keys.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { NoAuth } from '../auth/no-auth.decorator'
import { UserId } from '../auth/user-id.decorator'
import { getValidActor } from '../common/actor-helper'
import { ErrorApiResponse } from '../common/api-responses'
import { Member, MemberStatus } from '../common/database/entities/member.entity'
import { Errors } from '../common/errors'
import { MONEY_DECIMAL_PLACES } from '../common/money'
import { EmptyResponse } from '../common/utils'
import { GitHubMetadatasService } from '../github-metadatas/github-metadatas.service'
import { GitHubService } from '../github/github.service'
import { LogtoBindingsService } from '../logto-bindings/logto-bindings.service'
import {
  LOGTO_GITHUB_CONNECTOR_TARGET,
  LOGTO_TELEGRAM_CONNECTOR_TARGET,
  LogtoManagementService
} from '../logto-management/logto-management.service'
import { SessionStorageService } from '../session-storage/session-storage.service'
import { TelegramMetadatasService } from '../telegram-metadatas/telegram-metadatas.service'
import { MembersGitHubApiAuthGuard } from './members-github-api-auth.guard'
import { MembersService } from './members.service'

class CreateUpdateMemberDTO {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email: string

  @ApiProperty()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsNotEmpty()
  username: string
}

class GitHubMetadataDTO {
  @ApiProperty()
  githubId: string

  @ApiProperty()
  githubUsername: string
}

class MemberStatsDTO {
  @ApiProperty()
  count: number
}

class TelegramMetadataDTO {
  @ApiProperty()
  telegramId: string

  @ApiProperty({ required: false })
  telegramName?: string
}

class UpdateGitHubMetadataDTO {
  @ApiProperty()
  @IsNotEmpty()
  githubUsername: string
}

class UpdateStatusDTO {
  @ApiProperty({ enum: MemberStatus })
  @IsEnum(MemberStatus)
  @IsNotEmpty()
  status: MemberStatus
}

class UpdateTelegramMetadataDTO {
  @ApiProperty()
  @IsNotEmpty()
  @Matches(String.raw`^(\d{1,20})$`)
  telegramId: string
}

export class MemberDTO {
  @ApiProperty()
  balance: string

  @ApiProperty({ format: 'email' })
  email: string

  @ApiProperty({ required: false })
  githubMetadata?: GitHubMetadataDTO

  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ format: 'date-time' })
  joinedAt: string

  @ApiProperty()
  name: string

  @ApiProperty({ enum: MemberStatus })
  status: MemberStatus

  @ApiProperty({ required: false })
  telegramMetadata?: TelegramMetadataDTO

  @ApiProperty()
  username: string
}

@ApiTags('members')
@Controller('members')
export class MembersController {
  private readonly githubOrganizationName: string
  private readonly logger = new Logger(MembersController.name)

  constructor (private membersService: MembersService, private githubMetadataService: GitHubMetadatasService,
    private githubService: GitHubService, private telegramMetadataService: TelegramMetadatasService,
    private logtoManagementService: LogtoManagementService,
    private logtoBindingsService: LogtoBindingsService, private auditLogService: AuditLogService,
    configService: ConfigService, private sessionStorageService: SessionStorageService,
    private apiKeysService: ApiKeysService) {
    this.githubOrganizationName = configService.getOrThrow('GITHUB_ORGANIZATION_NAME')
  }

  static mapToDTO (member: Member): MemberDTO {
    return {
      balance: member.balance.toFixed(MONEY_DECIMAL_PLACES),
      email: member.email,
      githubMetadata: member.githubMetadata
        ? {
            githubId: member.githubMetadata.githubId,
            githubUsername: member.githubMetadata.githubUsername
          }
        : undefined,
      id: member.id,
      joinedAt: member.joinedAt.toISOString(),
      name: member.name,
      status: member.status,
      telegramMetadata: member.telegramMetadata
        ? {
            telegramId: member.telegramMetadata.telegramId,
            telegramName: member.telegramMetadata.telegramName
          }
        : undefined,
      username: member.username
    }
  }

  @ApiBody({
    type: CreateUpdateMemberDTO
  })
  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MemberDTO
  })
  @ApiOperation({
    summary: 'Create new member'
  })
  @Post()
  async create (@UserId() actorId: string, @Body() request: CreateUpdateMemberDTO): Promise<MemberDTO> {
    const actor = await getValidActor(this.membersService, actorId)
    if (await this.membersService.existsByEmail(request.email)) {
      throw new HttpException(Errors.MEMBER_EMAIL_ALREADY_EXISTS, HttpStatus.BAD_REQUEST)
    }

    return MembersController.mapToDTO(await this.membersService.transaction(async manager => {
      const member = await this.membersService.for(manager).create({
        email: request.email,
        joinedAt: new Date(),
        name: request.name,
        status: MemberStatus.FROZEN,
        username: request.username,
      })

      const logtoId = await this.logtoManagementService.createUser({
        email: request.email,
        name: request.name,
        username: request.username
      })

      // await this.logtoManagementService.updateUserSuspensionStatus(logtoId, true);

      await this.logtoBindingsService.for(manager).create({
        logtoId,
        member
      })

      await this.auditLogService.for(manager).create('create-member', actor, {
        email: member.email,
        id: member.id,
        logtoId,
        name: member.name,
        username: member.username
      })

      return await this.membersService.for(manager).findById(member.id)
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
    summary: 'Delete GitHub metadata for member'
  })
  @Delete(':id/github')
  async deleteGitHubMetadata (@UserId() actorId: string, @Param('id') id: string): Promise<EmptyResponse> {
    const actor = await getValidActor(this.membersService, actorId)
    const member = await this.membersService.findById(id)
    if (!member) {
      throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    if (!member.githubMetadata) {
      throw new HttpException(Errors.MEMBER_NO_GITHUB_METADATA, HttpStatus.NOT_FOUND)
    }
    const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id)
    if (!logtoBinding) {
      throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND)
    }

    // await this.removeMemberFromGitHubOrganization(member);

    await this.logtoManagementService.deleteUserSocialIdentity(logtoBinding.logtoId, LOGTO_GITHUB_CONNECTOR_TARGET)
    await this.githubMetadataService.remove(member.githubMetadata.githubId)

    await this.auditLogService.create('delete-member-github-metadata',
      actor, {
        memberId: member.id
      })

    return {}
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
    summary: 'Delete Telegram metadata for member'
  })
  @Delete(':id/telegram')
  async deleteTelegramMetadata (@UserId() actorId: string, @Param('id') id: string): Promise<EmptyResponse> {
    const actor = await getValidActor(this.membersService, actorId)
    const member = await this.membersService.findById(id)
    if (!member) {
      throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    if (!member.telegramMetadata) {
      throw new HttpException(Errors.MEMBER_NO_TELERGAM_METADATA, HttpStatus.NOT_FOUND)
    }
    const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id)
    if (!logtoBinding) {
      throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND)
    }

    await this.logtoManagementService.deleteUserSocialIdentity(logtoBinding.logtoId, LOGTO_TELEGRAM_CONNECTOR_TARGET)
    await this.telegramMetadataService.remove(member.telegramMetadata.telegramId)

    await this.auditLogService.create('delete-member-telegram-metadata',
      actor, {
        memberId: member.id
      })
    return {}
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: [MemberDTO]
  })
  @ApiOperation({
    summary: 'Get info about all members'
  })
  @Get()
  async findAll (): Promise<MemberDTO[]> {
    return (await this.membersService.findAll()).map(member => MembersController.mapToDTO(member))
  }

  @ApiExcludeEndpoint()
  @Get('github')
  @NoAuth()
  @UseGuards(MembersGitHubApiAuthGuard)
  async findAllMembersGithubs (): Promise<string[]> {
    const members = await this.membersService.findAllActive()
    return members.map(member => member.githubMetadata?.githubUsername)
      .filter(Boolean)
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MemberDTO
  })
  @ApiOperation({
    summary: 'Get full info about member'
  })
  @Get(':id')
  async findById (@Param('id') id: string): Promise<MemberDTO> {
    const member = await this.membersService.findById(id)
    if (!member) {
      throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    return MembersController.mapToDTO(member)
  }

  async removeMemberFromGitHubOrganization (member: Member): Promise<void> {
    try {
      const oldGitHubId = member.githubMetadata.githubId
      const oldGitHubUsername = await this.githubService.getUsernameById(oldGitHubId)
      if (oldGitHubUsername) {
        await this.githubService.removeOrganizationMemberForUser(this.githubOrganizationName, oldGitHubUsername)
      }
    } catch {
      this.logger.warn(`Failed to remove old GitHub user from organization (${
                member.githubMetadata.githubId}/${member.githubMetadata.githubUsername}), user ${member.id}/${member.name}`)
    }
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MemberStatsDTO
  })
  @ApiOperation({
    summary: 'Get stats of all members'
  })
  @Get('stats')
  async stats (): Promise<MemberStatsDTO> {
    return {
      count: await this.membersService.countActive()
    }
  }

  @ApiBody({
    type: CreateUpdateMemberDTO
  })
  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MemberDTO
  })
  @ApiOperation({
    summary: 'Update member'
  })
  @Patch(':id')
  async update (@UserId() actorId: string, @Param('id') id: string, @Body() request: CreateUpdateMemberDTO): Promise<MemberDTO> {
    const actor = await getValidActor(this.membersService, actorId)
    const member = await this.membersService.findById(id)
    if (!member) {
      throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    }

    const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id)
    if (!logtoBinding) {
      throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND)
    }

    if (request.email !== member.email && await this.membersService.existsByEmail(request.email)) {
      throw new HttpException(Errors.MEMBER_EMAIL_ALREADY_EXISTS, HttpStatus.BAD_REQUEST)
    }

    if (request.username !== member.username && await this.membersService.existsByUsername(request.username)) {
      throw new HttpException(Errors.MEMBER_USERNAME_ALREADY_EXISTS, HttpStatus.BAD_REQUEST)
    }

    member.name = request.name
    member.email = request.email
    member.username = request.username

    return MembersController.mapToDTO(await this.membersService.transaction(async manager => {
      await this.logtoManagementService.updateUser(logtoBinding.logtoId, {
        email: request.email,
        name: request.name,
        username: request.username,
      })

      await this.membersService.for(manager).update(member)

      await this.auditLogService.for(manager).create('update-member', actor, {
        email: member.email,
        id: member.id,
        name: member.name,
        username: member.username
      })

      return member
    }))
  }

  @ApiBody({
    type: UpdateGitHubMetadataDTO
  })
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
    summary: 'Add/update GitHub metadata for member'
  })
  @Patch(':id/github')
  async updateGitHubMetadata (@UserId() actorId: string, @Param('id') id: string,
    @Body() request: UpdateGitHubMetadataDTO): Promise<EmptyResponse> {
    const actor = await getValidActor(this.membersService, actorId)
    const member = await this.membersService.findById(id)
    if (!member) {
      throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    const githubInfo = await this.githubService.getIdByUsername(request.githubUsername)
    if (!githubInfo) {
      throw new HttpException(Errors.INVALID_GITHUB_USERNAME, HttpStatus.BAD_REQUEST)
    }

    if (member.githubMetadata && githubInfo.id === member.githubMetadata.githubId) {
      member.githubMetadata.githubUsername = request.githubUsername
      await this.githubMetadataService.update(member.githubMetadata)
      return {}
    }

    if (await this.githubMetadataService.existsByGithubId(githubInfo.id)) {
      throw new HttpException(Errors.MEMBER_GITHUB_ALREADY_EXISTS, HttpStatus.BAD_REQUEST)
    }

    const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id)
    if (!logtoBinding) {
      throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND)
    }

    if (member.githubMetadata) {
      // await this.removeMemberFromGitHubOrganization(member);
      await this.githubMetadataService.remove(member.githubMetadata.githubId)
    }

    /* await this.githubService.setOrganizationMemberForUser(this.githubOrganizationName,
            request.githubUsername, "owner"); */

    await this.logtoManagementService.updateUserSocialIdentity(logtoBinding.logtoId,
      LOGTO_GITHUB_CONNECTOR_TARGET, githubInfo.id, {})

    const githubMetadata = await this.githubMetadataService.create({
      githubId: githubInfo.id,
      githubUsername: githubInfo.username,
      member
    })

    await this.auditLogService.create('update-member-github-metadata',
      actor, {
        githubId: githubMetadata.githubId,
        memberId: member.id
      })

    return {}
  }

  @ApiBody({
    type: UpdateStatusDTO
  })
  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MemberDTO
  })
  @ApiOperation({
    summary: 'Freeze/unfreeze member'
  })
  @Patch(':id/status')
  async updateStatus (@UserId() actorId: string, @Param('id') id: string, @Body() request: UpdateStatusDTO): Promise<MemberDTO> {
    const actor = await getValidActor(this.membersService, actorId)

    return MembersController.mapToDTO(await this.membersService.transaction(async (manager) => {
      const memberWithoutRelations = await this.membersService.for(manager).findByIdLocked(id)
      if (!memberWithoutRelations) {
        throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
      }

      const member = await this.membersService.for(manager).findById(id)

      const logtoBinding = await this.logtoBindingsService.findByMemberId(id)
      if (!logtoBinding) {
        throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND)
      }

      await this.logtoManagementService.updateUserSuspensionStatus(logtoBinding.logtoId,
        request.status === 'frozen')

      await (request.status === 'frozen' ? this.sessionStorageService.revokeAllByUserId(id) : this.apiKeysService.initializeApiKeysInStorage())

      await this.auditLogService.for(manager).create(request.status === 'frozen' ? 'freeze-member' : 'unfreeze-member',
        actor, {
          id: member.id
        })

      member.status = request.status
      await this.membersService.for(manager).update(member)
      return member
    }))
  }

  @ApiBody({
    type: UpdateTelegramMetadataDTO
  })
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
    summary: 'Add/update Telegram metadata for member'
  })
  @Patch(':id/telegram')
  async updateTelegramMetadata (@UserId() actorId: string, @Param('id') id: string,
    @Body() request: UpdateTelegramMetadataDTO): Promise<EmptyResponse> {
    const actor = await getValidActor(this.membersService, actorId)
    const member = await this.membersService.findById(id)
    if (!member) {
      throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    if (member.telegramMetadata && request.telegramId === member.telegramMetadata.telegramId) {
      return {}
    }

    if (await this.telegramMetadataService.existsByTelegramId(request.telegramId)) {
      throw new HttpException(Errors.MEMBER_TELEGRAM_ALREADY_EXISTS, HttpStatus.BAD_REQUEST)
    }

    const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id)
    if (!logtoBinding) {
      throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND)
    }

    if (member.telegramMetadata) {
      await this.telegramMetadataService.remove(member.telegramMetadata.telegramId)

      await this.logtoManagementService.deleteUserSocialIdentity(logtoBinding.logtoId,
        LOGTO_TELEGRAM_CONNECTOR_TARGET)
    }

    const telegramMetadata = await this.telegramMetadataService.create({
      member,
      telegramId: request.telegramId,
      telegramName: null
    })
    await this.logtoManagementService.updateUserSocialIdentity(logtoBinding.logtoId,
      LOGTO_TELEGRAM_CONNECTOR_TARGET, request.telegramId, {})

    await this.auditLogService.create('update-member-telegram-metadata',
      actor, {
        memberId: member.id,
        telegramId: telegramMetadata.telegramId
      })

    return {}
  }
}

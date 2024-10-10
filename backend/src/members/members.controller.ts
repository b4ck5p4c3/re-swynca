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
} from "@nestjs/common";
import {
    ApiBody,
    ApiCookieAuth,
    ApiDefaultResponse, ApiExcludeEndpoint,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags
} from "@nestjs/swagger";
import {Member, MemberStatus} from "../common/database/entities/member.entity";
import {IsEmail, IsEnum, IsNotEmpty, IsNumberString, Matches} from "class-validator";
import {ErrorApiResponse} from "../common/api-responses";
import {MemberNotFoundError, MembersService} from "./members.service";
import {GitHubMetadatasService} from "../github-metadatas/github-metadatas.service";
import {GitHubService} from "../github/github.service";
import {TelegramMetadatasService} from "../telegram-metadatas/telegram-metadatas.service";
import {
    LOGTO_GITHUB_CONNECTOR_TARGET,
    LOGTO_TELEGRAM_CONNECTOR_TARGET,
    LogtoManagementService
} from "../logto-management/logto-management.service";
import {LogtoBindingsService} from "../logto-bindings/logto-bindings.service";
import {MONEY_DECIMAL_PLACES} from "../common/money";
import {AuditLogService} from "../audit-log/audit-log.service";
import {UserId} from "../auth/user-id.decorator";
import {ConfigService} from "@nestjs/config";
import {EmptyResponse} from "../common/utils";
import {Errors} from "../common/errors";
import {getValidActor} from "../common/actor-helper";
import {SessionStorageService} from "../session-storage/session-storage.service";
import {ApiKeysService} from "../api-keys/api-keys.service";
import {MembersGitHubApiAuthGuard} from "./members-github-api-auth.guard";

class GitHubMetadataDTO {
    @ApiProperty()
    githubId: string;

    @ApiProperty()
    githubUsername: string;
}

class TelegramMetadataDTO {
    @ApiProperty()
    telegramId: string;

    @ApiProperty({required: false})
    telegramName?: string;
}

export class MemberDTO {
    @ApiProperty({format: "uuid"})
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({format: "email"})
    email: string;

    @ApiProperty({enum: MemberStatus})
    status: MemberStatus;

    @ApiProperty()
    balance: string;

    @ApiProperty({format: "date-time"})
    joinedAt: string;

    @ApiProperty({required: false})
    telegramMetadata?: TelegramMetadataDTO;

    @ApiProperty({required: false})
    githubMetadata?: GitHubMetadataDTO;
}

class CreateUpdateMemberDTO {
    @ApiProperty()
    @IsNotEmpty()
    name: string;

    @ApiProperty({format: "email"})
    @IsEmail()
    email: string;
}

class UpdateTelegramMetadataDTO {
    @ApiProperty()
    @IsNotEmpty()
    @Matches("^(\\d{1,20})$")
    telegramId: string;
}

class UpdateGitHubMetadataDTO {
    @ApiProperty()
    @IsNotEmpty()
    githubUsername: string;
}

class UpdateStatusDTO {
    @ApiProperty({enum: MemberStatus})
    @IsEnum(MemberStatus)
    @IsNotEmpty()
    status: MemberStatus;
}

class MemberStatsDTO {
    @ApiProperty()
    count: number;
}

@ApiTags("members")
@Controller("members")
export class MembersController {
    private readonly logger = new Logger(MembersController.name);
    private readonly githubOrganizationName: string;

    constructor(private membersService: MembersService, private githubMetadataService: GitHubMetadatasService,
                private githubService: GitHubService, private telegramMetadataService: TelegramMetadatasService,
                private logtoManagementService: LogtoManagementService,
                private logtoBindingsService: LogtoBindingsService, private auditLogService: AuditLogService,
                configService: ConfigService, private sessionStorageService: SessionStorageService,
                private apiKeysService: ApiKeysService) {
        this.githubOrganizationName = configService.getOrThrow("GITHUB_ORGANIZATION_NAME");
    }

    static mapToDTO(member: Member): MemberDTO {
        return {
            id: member.id,
            name: member.name,
            email: member.email,
            status: member.status,
            balance: member.balance.toFixed(MONEY_DECIMAL_PLACES),
            joinedAt: member.joinedAt.toISOString(),
            telegramMetadata: member.telegramMetadata ? {
                telegramId: member.telegramMetadata.telegramId,
                telegramName: member.telegramMetadata.telegramName
            } : undefined,
            githubMetadata: member.githubMetadata ? {
                githubId: member.githubMetadata.githubId,
                githubUsername: member.githubMetadata.githubUsername
            } : undefined
        };
    }

    @Get("stats")
    @ApiOperation({
        summary: "Get stats of all members"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: MemberStatsDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async stats(): Promise<MemberStatsDTO> {
        return {
            count: await this.membersService.count()
        };
    }

    @Get()
    @ApiOperation({
        summary: "Get info about all members"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [MemberDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAll(): Promise<MemberDTO[]> {
        return (await this.membersService.findAll()).map(member => MembersController.mapToDTO(member));
    }

    @Get(":id")
    @ApiOperation({
        summary: "Get full info about member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: MemberDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findById(@Param("id") id: string): Promise<MemberDTO> {
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        return MembersController.mapToDTO(member);
    }

    @Post()
    @ApiOperation({
        summary: "Create new member"
    })
    @ApiBody({
        type: CreateUpdateMemberDTO
    })
    @ApiOkResponse({
        description: "Successful response",
        type: MemberDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async create(@UserId() actorId: string, @Body() request: CreateUpdateMemberDTO): Promise<MemberDTO> {
        const actor = await getValidActor(this.membersService, actorId);
        if (await this.membersService.existsByEmail(request.email)) {
            throw new HttpException(Errors.MEMBER_EMAIL_ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
        }

        return MembersController.mapToDTO(await this.membersService.transaction(async manager => {
            const member = await this.membersService.for(manager).create({
                name: request.name,
                email: request.email,
                status: MemberStatus.FROZEN,
                joinedAt: new Date(),
            });

            const logtoId = await this.logtoManagementService.createUser({
                name: request.name,
                email: request.email
            });

            await this.logtoManagementService.updateUserSuspensionStatus(logtoId, true);

            await this.logtoBindingsService.for(manager).create({
                logtoId,
                member
            });

            await this.auditLogService.for(manager).create("create-member", actor, {
                id: member.id,
                name: member.name,
                email: member.email,
                logtoId: logtoId
            });

            return await this.membersService.for(manager).findById(member.id);
        }));
    }

    @Patch(":id")
    @ApiOperation({
        summary: "Update member"
    })
    @ApiBody({
        type: CreateUpdateMemberDTO
    })
    @ApiOkResponse({
        description: "Successful response",
        type: MemberDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async update(@UserId() actorId: string, @Param("id") id: string, @Body() request: CreateUpdateMemberDTO): Promise<MemberDTO> {
        const actor = await getValidActor(this.membersService, actorId);
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id);
        if (!logtoBinding) {
            throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND);
        }

        if (request.email !== member.email) {
            if (await this.membersService.existsByEmail(request.email)) {
                throw new HttpException(Errors.MEMBER_EMAIL_ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
            }
        }

        member.name = request.name;
        member.email = request.email;

        return MembersController.mapToDTO(await this.membersService.transaction(async manager => {
            await this.logtoManagementService.updateUser(logtoBinding.logtoId, {
                name: request.name,
                email: request.email
            });

            await this.membersService.for(manager).update(member);

            await this.auditLogService.for(manager).create("update-member", actor, {
                id: member.id,
                name: member.name,
                email: member.email
            });

            return member;
        }));
    }

    @Patch(":id/status")
    @ApiOperation({
        summary: "Freeze/unfreeze member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: MemberDTO
    })
    @ApiBody({
        type: UpdateStatusDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async updateStatus(@UserId() actorId: string, @Param("id") id: string, @Body() request: UpdateStatusDTO): Promise<MemberDTO> {
        const actor = await getValidActor(this.membersService, actorId);

        return MembersController.mapToDTO(await this.membersService.transaction(async (manager) => {
            const memberWithoutRelations = await this.membersService.for(manager).findByIdLocked(id);
            if (!memberWithoutRelations) {
                throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND);
            }

            const member = await this.membersService.for(manager).findById(id);

            const logtoBinding = await this.logtoBindingsService.findByMemberId(id);
            if (!logtoBinding) {
                throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND);
            }

            await this.logtoManagementService.updateUserSuspensionStatus(logtoBinding.logtoId,
                request.status === "frozen");

            if (request.status === "frozen") {
                await this.sessionStorageService.revokeAllByUserId(id);
            } else {
                await this.apiKeysService.initializeApiKeysInStorage();
            }

            await this.auditLogService.for(manager).create(request.status === "frozen" ? "freeze-member" : "unfreeze-member",
                actor, {
                    id: member.id
                });

            member.status = request.status;
            await this.membersService.for(manager).update(member);
            return member;
        }));
    }

    @Patch(":id/telegram")
    @ApiOperation({
        summary: "Add/update Telegram metadata for member"
    })
    @ApiBody({
        type: UpdateTelegramMetadataDTO
    })
    @ApiOkResponse({
        description: "Successful response",
        type: EmptyResponse
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async updateTelegramMetadata(@UserId() actorId: string, @Param("id") id: string,
                                 @Body() request: UpdateTelegramMetadataDTO): Promise<EmptyResponse> {
        const actor = await getValidActor(this.membersService, actorId);
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (member.telegramMetadata && request.telegramId === member.telegramMetadata.telegramId) {
            return {};
        }

        if (await this.telegramMetadataService.existsByTelegramId(request.telegramId)) {
            throw new HttpException(Errors.MEMBER_TELEGRAM_ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
        }

        const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id);
        if (!logtoBinding) {
            throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND);
        }

        if (member.telegramMetadata) {
            await this.telegramMetadataService.remove(member.telegramMetadata.telegramId);

            await this.logtoManagementService.deleteUserSocialIdentity(logtoBinding.logtoId,
                LOGTO_TELEGRAM_CONNECTOR_TARGET);
        }

        const telegramMetadata = await this.telegramMetadataService.create({
            telegramId: request.telegramId,
            telegramName: null,
            member
        });
        await this.logtoManagementService.updateUserSocialIdentity(logtoBinding.logtoId,
            LOGTO_TELEGRAM_CONNECTOR_TARGET, request.telegramId, {});

        await this.auditLogService.create("update-member-telegram-metadata",
            actor, {
                memberId: member.id,
                telegramId: telegramMetadata.telegramId
            });

        return {};
    }

    @Delete(":id/telegram")
    @ApiOperation({
        summary: "Delete Telegram metadata for member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: EmptyResponse
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async deleteTelegramMetadata(@UserId() actorId: string, @Param("id") id: string): Promise<EmptyResponse> {
        const actor = await getValidActor(this.membersService, actorId);
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (!member.telegramMetadata) {
            throw new HttpException(Errors.MEMBER_NO_TELERGAM_METADATA, HttpStatus.NOT_FOUND);
        }
        const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id);
        if (!logtoBinding) {
            throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND);
        }

        await this.logtoManagementService.deleteUserSocialIdentity(logtoBinding.logtoId, LOGTO_TELEGRAM_CONNECTOR_TARGET);
        await this.telegramMetadataService.remove(member.telegramMetadata.telegramId);

        await this.auditLogService.create("delete-member-telegram-metadata",
            actor, {
                memberId: member.id
            });
        return {};
    }

    async removeMemberFromGitHubOrganization(member: Member): Promise<void> {
        try {
            const oldGitHubId = member.githubMetadata.githubId;
            const oldGitHubUsername = await this.githubService.getUsernameById(oldGitHubId);
            if (oldGitHubUsername) {
                await this.githubService.removeOrganizationMemberForUser(this.githubOrganizationName, oldGitHubUsername);
            }
        } catch (e) {
            this.logger.warn(`Failed to remove old GitHub user from organization (${
                member.githubMetadata.githubId}/${member.githubMetadata.githubUsername}), user ${member.id}/${member.name}`);
        }
    }

    @Patch(":id/github")
    @ApiOperation({
        summary: "Add/update GitHub metadata for member"
    })
    @ApiBody({
        type: UpdateGitHubMetadataDTO
    })
    @ApiOkResponse({
        description: "Successful response",
        type: EmptyResponse
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async updateGitHubMetadata(@UserId() actorId: string, @Param("id") id: string,
                               @Body() request: UpdateGitHubMetadataDTO): Promise<EmptyResponse> {
        const actor = await getValidActor(this.membersService, actorId);
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        const githubInfo = await this.githubService.getIdByUsername(request.githubUsername);
        if (!githubInfo) {
            throw new HttpException(Errors.INVALID_GITHUB_USERNAME, HttpStatus.BAD_REQUEST);
        }

        if (member.githubMetadata && githubInfo.id === member.githubMetadata.githubId) {
            return {};
        }

        if (await this.githubMetadataService.existsByGithubId(githubInfo.id)) {
            throw new HttpException(Errors.MEMBER_GITHUB_ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
        }

        const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id);
        if (!logtoBinding) {
            throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND);
        }

        if (member.githubMetadata) {
            // await this.removeMemberFromGitHubOrganization(member);
            await this.githubMetadataService.remove(member.githubMetadata.githubId);
        }

        /* await this.githubService.setOrganizationMemberForUser(this.githubOrganizationName,
            request.githubUsername, "owner"); */

        await this.logtoManagementService.updateUserSocialIdentity(logtoBinding.logtoId,
            LOGTO_GITHUB_CONNECTOR_TARGET, githubInfo.id, {});

        const githubMetadata = await this.githubMetadataService.create({
            githubId: githubInfo.id,
            githubUsername: githubInfo.username,
            member
        });

        await this.auditLogService.create("update-member-github-metadata",
            actor, {
                memberId: member.id,
                githubId: githubMetadata.githubId
            });

        return {};
    }

    @Delete(":id/github")
    @ApiOperation({
        summary: "Delete GitHub metadata for member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: EmptyResponse
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async deleteGitHubMetadata(@UserId() actorId: string, @Param("id") id: string): Promise<EmptyResponse> {
        const actor = await getValidActor(this.membersService, actorId);
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (!member.githubMetadata) {
            throw new HttpException(Errors.MEMBER_NO_GITHUB_METADATA, HttpStatus.NOT_FOUND);
        }
        const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id);
        if (!logtoBinding) {
            throw new HttpException(Errors.MEMBER_NO_LOGTO_BINDING, HttpStatus.NOT_FOUND);
        }

        // await this.removeMemberFromGitHubOrganization(member);

        await this.logtoManagementService.deleteUserSocialIdentity(logtoBinding.logtoId, LOGTO_GITHUB_CONNECTOR_TARGET);
        await this.githubMetadataService.remove(member.githubMetadata.githubId);

        await this.auditLogService.create("delete-member-github-metadata",
            actor, {
                memberId: member.id
            });

        return {};
    }

    @Get("github")
    @ApiExcludeEndpoint()
    @UseGuards(MembersGitHubApiAuthGuard)
    async getGithubs(): Promise<string[]> {
        const members = await this.membersService.findAll();
        return members.map(member => member.githubMetadata?.githubUsername)
            .filter(githubUsername => githubUsername);
    }
}
import {Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post} from "@nestjs/common";
import {
    ApiBody,
    ApiCookieAuth,
    ApiDefaultResponse,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags
} from "@nestjs/swagger";
import {Member, MemberStatus} from "../common/database/entities/member.entity";
import {IsEmail, IsEnum, IsNotEmpty, IsNumberString, Matches} from "class-validator";
import {ErrorApiResponse} from "../common/api-responses";
import {MembersService} from "./members.service";
import {GitHubMetadatasService} from "../github-metadatas/github-metadatas.service";
import {GitHubService} from "../github/github.service";
import {TelegramMetadatasService} from "../telegram-metadatas/telegram-metadatas.service";
import {LOGTO_GITHUB_CONNECTOR_TARGET, LogtoManagementService} from "../logto-management/logto-management.service";
import {LogtoBindingsService} from "../logto-bindings/logto-bindings.service";
import {MONEY_DECIMAL_PLACES} from "../common/money";

class GitHubMetadataDTO {
    @ApiProperty()
    githubId: string;

    @ApiProperty()
    githubUsername: string;
}

class TelegramMetadataDTO {
    @ApiProperty()
    telegramId: string;

    @ApiProperty()
    telegramName: string;
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
    @Matches("^(\d{1,20})$")
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

@ApiTags("members")
@Controller("members")
export class MembersController {

    constructor(private membersService: MembersService, private githubMetadataService: GitHubMetadatasService,
                private githubService: GitHubService, private telegramMetadataService: TelegramMetadatasService,
                private logtoManagementService: LogtoManagementService,
                private logtoBindingsService: LogtoBindingsService) {
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
            throw new HttpException("Not found", HttpStatus.NOT_FOUND);
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
    async create(@Body() request: CreateUpdateMemberDTO): Promise<MemberDTO> {
        if (await this.membersService.existsByEmail(request.email)) {
            throw new HttpException("Member with this email already exists", HttpStatus.BAD_REQUEST);
        }

        const logtoId = await this.logtoManagementService.createUser({
            name: request.name,
            email: request.email
        });
        await this.logtoManagementService.updateUserSuspensionStatus(logtoId, true);

        const member = await this.membersService.create({
            name: request.name,
            email: request.email,
            status: MemberStatus.FROZEN,
            joinedAt: new Date(),
        });

        await this.logtoBindingsService.create({
            logtoId,
            member
        });

        return MembersController.mapToDTO(await this.membersService.findById(member.id));
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
    async update(@Param("id") id: string, @Body() request: CreateUpdateMemberDTO): Promise<MemberDTO> {
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException("Member not found", HttpStatus.NOT_FOUND);
        }

        const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id);
        if (!logtoBinding) {
            throw new HttpException("Member does not have Logto binding", HttpStatus.NOT_FOUND);
        }

        if (request.email !== member.email) {
            if (await this.membersService.existsByEmail(request.email)) {
                throw new HttpException("Member with such email already exists", HttpStatus.BAD_REQUEST);
            }
        }

        await this.logtoManagementService.updateUser(logtoBinding.logtoId, {
            name: request.name,
            email: request.email
        });

        member.name = request.name;
        member.email = request.email;

        await this.membersService.update(member);

        return MembersController.mapToDTO(member);
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
    async freeze(@Param("id") id: string, @Body() request: UpdateStatusDTO): Promise<MemberDTO> {
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException("Member not found", HttpStatus.NOT_FOUND);
        }

        const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id);

        if (!logtoBinding) {
            throw new HttpException("Member does not have Logto binding", HttpStatus.NOT_FOUND);
        }

        await this.logtoManagementService.updateUserSuspensionStatus(logtoBinding.logtoId,
            request.status === "frozen");

        member.status = request.status;

        await this.membersService.update(member);

        return MembersController.mapToDTO(member);
    }

    @Patch(":id/telegram")
    @ApiOperation({
        summary: "Add/update Telegram metadata for member"
    })
    @ApiBody({
        type: UpdateTelegramMetadataDTO
    })
    @ApiNoContentResponse({
        description: "Successful response"
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async updateTelegramMetadata(@Param("id") id: string, @Body() request: UpdateTelegramMetadataDTO): Promise<void> {
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException("Member not found", HttpStatus.NOT_FOUND);
        }

        if (await this.telegramMetadataService.existsByTelegramId(request.telegramId)) {
            throw new HttpException("This Telegram account is already linked", HttpStatus.BAD_REQUEST);
        }

        if (member.telegramMetadata) {
            await this.telegramMetadataService.remove(member.telegramMetadata.telegramId);
        }

        await this.telegramMetadataService.create({
            telegramId: request.telegramId,
            telegramName: "Unknown",
            member
        });
    }

    @Delete(":id/telegram")
    @ApiOperation({
        summary: "Delete Telegram metadata for member"
    })
    @ApiNoContentResponse({
        description: "Successful response"
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async deleteTelegramMetadata(@Param("id") id: string): Promise<void> {
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException("Member not found", HttpStatus.NOT_FOUND);
        }
        if (!member.telegramMetadata) {
            throw new HttpException("Member does not have Telegram metadata", HttpStatus.NOT_FOUND);
        }
        await this.telegramMetadataService.remove(member.telegramMetadata.telegramId);
    }

    @Patch(":id/github")
    @ApiOperation({
        summary: "Add/update GitHub metadata for member"
    })
    @ApiBody({
        type: UpdateGitHubMetadataDTO
    })
    @ApiNoContentResponse({
        description: "Successful response",
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async updateGitHubMetadata(@Param("id") id: string, @Body() request: UpdateGitHubMetadataDTO): Promise<void> {
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException("Member not found", HttpStatus.NOT_FOUND);
        }
        const githubId = await this.githubService.getIdByUsername(request.githubUsername);
        if (!githubId) {
            throw new HttpException("Invalid GitHub username", HttpStatus.BAD_REQUEST);
        }

        if (await this.githubMetadataService.existsByGithubId(githubId)) {
            throw new HttpException("This GitHub account is already linked", HttpStatus.BAD_REQUEST);
        }

        const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id);
        if (!logtoBinding) {
            throw new HttpException("Member does not have Logto binding", HttpStatus.NOT_FOUND);
        }

        await this.logtoManagementService.updateUserSocialIdentity(logtoBinding.logtoId,
            LOGTO_GITHUB_CONNECTOR_TARGET, githubId, {});

        if (member.githubMetadata) {
            await this.githubMetadataService.remove(member.githubMetadata.githubId);
        }

        await this.githubMetadataService.create({
            githubId,
            githubUsername: request.githubUsername,
            member
        });
    }

    @Delete(":id/github")
    @ApiOperation({
        summary: "Delete GitHub metadata for member"
    })
    @ApiNoContentResponse({
        description: "Successful response"
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async deleteGitHubMetadata(@Param("id") id: string): Promise<void> {
        const member = await this.membersService.findById(id);
        if (!member) {
            throw new HttpException("Member not found", HttpStatus.NOT_FOUND);
        }
        if (!member.githubMetadata) {
            throw new HttpException("Member does not have GitHub metadata", HttpStatus.NOT_FOUND);
        }
        const logtoBinding = await this.logtoBindingsService.findByMemberId(member.id);
        if (!logtoBinding) {
            throw new HttpException("Member does not have Logto binding", HttpStatus.NOT_FOUND);
        }
        await this.logtoManagementService.deleteUserSocialIdentity(logtoBinding.logtoId, LOGTO_GITHUB_CONNECTOR_TARGET);
        await this.githubMetadataService.remove(member.githubMetadata.githubId);
    }
}
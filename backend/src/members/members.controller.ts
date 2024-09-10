import {Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post} from "@nestjs/common";
import {
    ApiBody,
    ApiCookieAuth,
    ApiDefaultResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags
} from "@nestjs/swagger";
import {Member, MemberStatus} from "../common/database/entities/member.entity";
import {ACSKeyType} from "../common/database/entities/acs-key.entity";
import {IsEmail, IsEnum, IsNotEmpty} from "class-validator";
import {GitHubMetadata} from "../common/database/entities/github-metadata.entity";
import {ErrorApiResponse} from "../common/api-responses";

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

class MemberDTO {
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
    telegramId: string;
}

class UpdateGitHubMetadataDTO {
    @ApiProperty()
    @IsNotEmpty()
    githubId: string;
}

class UpdateStatusDTO {
    @ApiProperty()
    @IsEnum({enum: MemberStatus})
    @IsNotEmpty()
    status: MemberStatus;
}

@ApiTags("members")
@Controller("members")
export class MembersController {

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
        return [];
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
        throw new HttpException("Not found", HttpStatus.NOT_FOUND);
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
        throw new HttpException("Not found", HttpStatus.NOT_FOUND);
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
        throw new HttpException("Not found", HttpStatus.NOT_FOUND);
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
        throw new HttpException("Not found", HttpStatus.NOT_FOUND);
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
        type: MemberDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async updateTelegramMetadata(@Param("id") id: string, @Body() request: UpdateTelegramMetadataDTO): Promise<MemberDTO> {
        throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }

    @Delete(":id/telegram")
    @ApiOperation({
        summary: "Delete Telegram metadata for member"
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
    async deleteTelegramMetadata(@Param("id") id: string): Promise<MemberDTO> {
        throw new HttpException("Not found", HttpStatus.NOT_FOUND);
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
        type: MemberDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async updateGitHubMetadata(@Param("id") id: string, @Body() request: UpdateGitHubMetadataDTO): Promise<MemberDTO> {
        throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }

    @Delete(":id/github")
    @ApiOperation({
        summary: "Delete GitHub metadata for member"
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
    async deleteGitHubMetadata(@Param("id") id: string): Promise<MemberDTO> {
        throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }
}
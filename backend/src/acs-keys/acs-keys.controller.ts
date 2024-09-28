import {Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post} from "@nestjs/common";
import {ACSKey, ACSKeyType} from "../common/database/entities/acs-key.entity";
import {
    ApiBody,
    ApiCookieAuth,
    ApiDefaultResponse, ApiNoContentResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags
} from "@nestjs/swagger";
import {IsEnum, IsNotEmpty, IsUUID} from "class-validator";
import {ErrorApiResponse} from "../common/api-responses";
import {ACSKeysService} from "./acs-keys.service";
import {MembersService} from "src/members/members.service";
import {AuditLogService} from "../audit-log/audit-log.service";
import {UserId} from "../auth/user-id.decorator";
import {EmptyResponse} from "../common/utils";
import {Errors} from "../common/errors";
import {getValidActor} from "../common/actor-helper";

class CreateACSKeyDTO {
    @ApiProperty({enum: ACSKeyType})
    @IsEnum(ACSKeyType)
    @IsNotEmpty()
    type: ACSKeyType;

    @ApiProperty()
    @IsNotEmpty()
    key: string;

    @ApiProperty()
    @IsNotEmpty()
    name: string;

    @ApiProperty({format: "uuid"})
    @IsUUID()
    @IsNotEmpty()
    memberId: string;
}

class ACSKeyDTO {
    @ApiProperty({format: "uuid"})
    id: string;

    @ApiProperty({format: "uuid"})
    memberId: string;

    @ApiProperty({enum: ACSKeyType})
    type: ACSKeyType;

    @ApiProperty()
    key: string;

    @ApiProperty()
    name: string;
}

@ApiTags("acs-keys")
@Controller("acs-keys")
export class ACSKeysController {
    constructor(private acsKeysService: ACSKeysService, private membersService: MembersService,
                private auditLogService: AuditLogService) {
    }

    private static mapToDTO(acsKey: ACSKey): ACSKeyDTO {
        return {
            id: acsKey.id,
            type: acsKey.type,
            key: acsKey.key,
            name: acsKey.name,
            memberId: acsKey.member.id
        };
    }

    @Get("member/:memberId")
    @ApiOperation({
        summary: "Get ACS keys for specific member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [ACSKeyDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAllByMemberId(@Param("memberId") memberId: string): Promise<ACSKeyDTO[]> {
        return (await this.acsKeysService.findAllByMemberId(memberId)).map(ACSKeysController.mapToDTO);
    }

    @Post()
    @ApiOperation({
        summary: "Create ACS key"
    })
    @ApiBody({
        type: CreateACSKeyDTO
    })
    @ApiOkResponse({
        description: "Successful response",
        type: ACSKeyDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async create(@UserId() actorId: string, @Body() request: CreateACSKeyDTO): Promise<ACSKeyDTO> {
        const actor = await getValidActor(this.membersService, actorId);
        const {type, key, name, memberId} = request;
        const member = await this.membersService.findById(memberId);
        if (!member) {
            throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (await this.acsKeysService.existsByKey(key)) {
            throw new HttpException(Errors.ACS_KEY_ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
        }
        const acsKey = await this.acsKeysService.create({
            type,
            key,
            name,
            member
        });
        await this.auditLogService.create("create-acs-key", actor, {
            id: acsKey.id,
            type: acsKey.type,
            key: acsKey.key,
            name: acsKey.name,
            memberId: member.id
        });
        return ACSKeysController.mapToDTO(acsKey);
    }

    @Delete(":id")
    @ApiOperation({
        summary: "Delete ACS key"
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
    async remove(@UserId() actorId: string, @Param("id") id: string): Promise<EmptyResponse> {
        const actor = await getValidActor(this.membersService, actorId);
        await this.acsKeysService.remove(id);
        await this.auditLogService.create("delete-acs-key", actor, {
            id
        });
        return {};
    }
}
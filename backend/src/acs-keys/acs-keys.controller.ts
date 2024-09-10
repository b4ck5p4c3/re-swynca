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
import { ACSKeysService } from "./acs-keys.service";
import { MembersService } from "src/members/members.service";

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

    @ApiProperty()
    key: string;

    @ApiProperty()
    name: string;
}

@ApiTags("acs-keys")
@Controller("acs-keys")
export class ACSKeysController {
    constructor(private acsKeysService: ACSKeysService, private membersService: MembersService) {
    }

    private mapToDTO(acsKey: ACSKey): ACSKeyDTO {
        return {
            id: acsKey.id,
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
        return (await this.acsKeysService.findAllByMemberId(memberId)).map(this.mapToDTO);
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
    async create(@Body() request: CreateACSKeyDTO): Promise<ACSKeyDTO> {
        const {type, key, name, memberId} = request;
        const member = await this.membersService.findById(memberId);
        if (!member) {
            throw new HttpException("Member not found", HttpStatus.NOT_FOUND);
        }
        const acsKey = await this.acsKeysService.create({
            type,
            key,
            name,
            member
        });
        return this.mapToDTO(acsKey);
    }

    @Delete(":id")
    @ApiOperation({
        summary: "Delete ACS key"
    })
    @ApiNoContentResponse({
        description: "Successful response"
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async remove(@Param("id") id: string): Promise<void> {
        await this.acsKeysService.remove(id);
    }
}
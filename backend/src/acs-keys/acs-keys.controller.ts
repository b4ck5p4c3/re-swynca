import {Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post} from "@nestjs/common";
import {ACSKeyType} from "../common/database/entities/acs-key.entity";
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
        return [];
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
        throw new HttpException("Not found", HttpStatus.NOT_FOUND);
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

    }
}
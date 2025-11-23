import {Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, UseGuards} from "@nestjs/common";
import {MACsService} from "./macs.service";
import {
    ApiCookieAuth,
    ApiDefaultResponse,
    ApiExcludeEndpoint,
    ApiOkResponse,
    ApiOperation,
    ApiProperty, ApiTags
} from "@nestjs/swagger";
import {ErrorApiResponse} from "../common/api-responses";
import {UserId} from "../auth/user-id.decorator";
import {getValidActor} from "../common/actor-helper";
import {EmptyResponse} from "../common/utils";
import {Errors} from "../common/errors";
import {MembersService} from "../members/members.service";
import {AuditLogService} from "../audit-log/audit-log.service";
import {MAC} from "../common/database/entities/mac.entity";
import {IsNotEmpty, IsUUID, Matches} from "class-validator";
import {NoAuth} from "../auth/no-auth.decorator";
import {MacsSystemApiAuthGuard} from "./macs-system-api-auth.guard";

class MACDTO {
    @ApiProperty({format:"uuid"})
    id: string;

    @ApiProperty()
    mac: string;

    @ApiProperty()
    description: string;
}

class CreateMACDTO {
    @ApiProperty({format: "uuid"})
    @IsNotEmpty()
    @IsUUID()
    memberId: string;

    @ApiProperty()
    @IsNotEmpty()
    @Matches("^([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2})$")
    mac: string;

    @ApiProperty()
    @IsNotEmpty()
    description: string;
}

class MacsSystemResponseDTO {
    macs: {
        memberId: string;
        memberUsername: string;
        mac: string;
    }[]
}

@Controller("macs")
@ApiTags("macs")
export class MACsController {

    constructor(private membersService: MembersService, private macsService: MACsService,
                private auditLogService: AuditLogService) {
    }

    private static mapToDTO(mac: MAC): MACDTO {
        return {
            id: mac.id,
            mac: mac.mac,
            description: mac.description
        };
    }

    @Get("system")
    @ApiExcludeEndpoint()
    @NoAuth()
    @UseGuards(MacsSystemApiAuthGuard)
    async findAll(): Promise<MacsSystemResponseDTO> {
        const result: MacsSystemResponseDTO = {
            macs: []
        }
        for (const mac of await this.macsService.findForActiveMembers()) {
            result.macs.push({
                memberId: mac.member.id,
                memberUsername: mac.member.username,
                mac: mac.mac
            })
        }
        return result;
    }

    @Get("member/:memberId")
    @ApiOperation({
        summary: "Get MACs for specific member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [MACDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findByMemberId(@Param("memberId") memberId: string): Promise<MACDTO[]> {
        return (await this.macsService.findByMemberId(memberId)).map(MACsController.mapToDTO);
    }

    @Post()
    @ApiOperation({
        summary: "Create new MAC"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: MACDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async create(@UserId() actorId: string, @Body() request: CreateMACDTO): Promise<MACDTO> {
        const {memberId} = request;
        const member = await getValidActor(this.membersService, memberId);
        const actor = await getValidActor(this.membersService, actorId);
        return MACsController.mapToDTO(await this.macsService.transaction(async manager => {
            const mac = await this.macsService.for(manager).create({
                mac: request.mac,
                description: request.description,
                member
            });
            await this.auditLogService.for(manager).create("create-mac", actor, {
                id: mac.id,
                mac: mac.mac,
                description: mac.description,
                memberId,
            });
            return mac;
        }));
    }

    @Delete(":id")
    @ApiOperation({
        summary: "Delete MAC"
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
        const mac = await this.macsService.findById(id);
        if (!mac) {
            throw new HttpException(Errors.MAC_NOT_FOUND, HttpStatus.NOT_FOUND)
        }
        await this.macsService.transaction(async manager => {
            await this.macsService.for(manager).remove(id);
            await this.auditLogService.for(manager).create("delete-mac", actor, {
                id
            });
        });
        return {};
    }
}
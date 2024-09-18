import {Controller, Get, Query} from "@nestjs/common";
import {AuditLogService} from "./audit-log.service";
import {ApiCookieAuth, ApiDefaultResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags} from "@nestjs/swagger";
import {ErrorApiResponse} from "../common/api-responses";
import {getCountAndOffset} from "../common/utils";
import {AuditLog} from "../common/database/entities/audit-log.entity";
import {MemberDTO, MembersController} from "../members/members.controller";

class AuditLogEntryDTO {
    @ApiProperty({format: "uuid"})
    id: string;

    @ApiProperty({format: "date-time"})
    createdAt: string;

    @ApiProperty()
    action: string;

    @ApiProperty()
    metadata: object;

    @ApiProperty()
    actor: MemberDTO;

    @ApiProperty({required: false})
    nearTransactionHash?: string;
}

class AuditLogEntriesDTO {
    @ApiProperty()
    count: number;

    @ApiProperty({type: [AuditLogEntryDTO]})
    entries: AuditLogEntryDTO[];
}

@Controller("audit-log")
@ApiTags("audit-log")
export class AuditLogController {
    constructor(private auditLogService: AuditLogService) {
    }

    private static mapToDTO(entry: AuditLog): AuditLogEntryDTO {
        return {
            id: entry.id,
            createdAt: entry.createdAt.toISOString(),
            action: entry.action,
            metadata: entry.metadata,
            actor: MembersController.mapToDTO(entry.actor),
            nearTransactionHash: entry.nearTransactionHash
        }
    }

    @Get()
    @ApiOperation({
        summary: "Get all audit log entries"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: AuditLogEntriesDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAll(@Query("offset") offset?: string,
                  @Query("count") count?: string): Promise<AuditLogEntriesDTO> {
        const entriesCount = await this.auditLogService.countAll();
        const [realCount, realOffset] = getCountAndOffset(count, offset, 100);

        const entries = await this.auditLogService.findAll(realOffset,
            realCount);

        return {
            count: entriesCount,
            entries: entries.map(entry =>
                AuditLogController.mapToDTO(entry))
        };
    }
}
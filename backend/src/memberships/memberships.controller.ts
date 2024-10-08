import {
    ApiBody,
    ApiCookieAuth,
    ApiDefaultResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags
} from "@nestjs/swagger";
import {MembershipsService} from "./memberships.service";
import {Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post} from "@nestjs/common";
import {MONEY_DECIMAL_PLACES, MONEY_PRECISION} from "../common/money";
import {IsNotEmpty, IsNumberString} from "class-validator";
import Decimal from "decimal.js";
import {CustomValidationError} from "../common/exceptions";
import {Membership} from "../common/database/entities/membership.entity";
import {ErrorApiResponse} from "../common/api-responses";
import {MembersService} from "../members/members.service";
import {AuditLogService} from "../audit-log/audit-log.service";
import {UserId} from "../auth/user-id.decorator";
import {Errors} from "../common/errors";
import {getValidActor} from "../common/actor-helper";

class MembershipDTO {
    @ApiProperty({format: "uuid"})
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    amount: string;

    @ApiProperty()
    active: boolean;
}

class CreateUpdateMembershipDTO {
    @ApiProperty()
    @IsNotEmpty()
    title: string;

    @ApiProperty()
    @IsNumberString()
    @IsNotEmpty()
    amount: string;

    @ApiProperty()
    @IsNotEmpty()
    active: boolean;
}

@ApiTags("memberships")
@Controller("memberships")
export class MembershipsController {
    constructor(private membershipService: MembershipsService,
                private membersService: MembersService,
                private auditLogService: AuditLogService) {
    }

    private static mapToDTO(membership: Membership): MembershipDTO {
        return {
            id: membership.id,
            title: membership.title,
            amount: membership.amount.toFixed(MONEY_DECIMAL_PLACES),
            active: membership.active
        };
    }

    @Get()
    @ApiOperation({
        summary: "Get all memberships"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [MembershipDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAll(): Promise<MembershipDTO[]> {
        return (await this.membershipService.findAll()).map(MembershipsController.mapToDTO);
    }

    @Post()
    @ApiOperation({
        summary: "Create new membership"
    })
    @ApiBody({
        type: CreateUpdateMembershipDTO
    })
    @ApiOkResponse({
        description: "Successfull response",
        type: MembershipDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async create(@UserId() actorId: string, @Body() request: CreateUpdateMembershipDTO): Promise<MembershipDTO> {
        const actor = await getValidActor(this.membersService, actorId);
        const decimalAmount = new Decimal(request.amount).toDecimalPlaces(MONEY_DECIMAL_PLACES);
        if (decimalAmount.lessThanOrEqualTo(0)) {
            throw new CustomValidationError("Membership amount must be > 0");
        }
        if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
            throw new CustomValidationError(`Membership amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`);
        }

        return MembershipsController.mapToDTO(await this.membershipService.transaction(async manager => {
            const membership = await this.membershipService.for(manager).create({
                title: request.title,
                amount: decimalAmount,
                active: request.active
            });

            await this.auditLogService.for(manager).create("create-membership", actor, {
                id: membership.id,
                title: membership.title,
                amount: membership.amount.toFixed(MONEY_DECIMAL_PLACES),
                active: membership.active
            });

            return membership;
        }));
    }

    @Patch(":id")
    @ApiOperation({
        summary: "Update membership"
    })
    @ApiBody({
        type: CreateUpdateMembershipDTO
    })
    @ApiOkResponse({
        description: "Successfull response",
        type: MembershipDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async updateMembership(@UserId() actorId: string, @Param("id") id: string,
                           @Body() request: CreateUpdateMembershipDTO): Promise<MembershipDTO> {
        const actor = await getValidActor(this.membersService, actorId);
        const decimalAmount = new Decimal(request.amount).toDecimalPlaces(MONEY_DECIMAL_PLACES);
        if (decimalAmount.lessThanOrEqualTo(0)) {
            throw new CustomValidationError("Membership amount must be > 0");
        }
        if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
            throw new CustomValidationError(`Membership amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`);
        }

        return MembershipsController.mapToDTO(await this.membershipService.transaction(async manager => {
            const membership = await this.membershipService.for(manager).findById(id);
            if (!membership) {
                throw new HttpException(Errors.MEMBERSHIP_NOT_FOUND, HttpStatus.NOT_FOUND);
            }

            membership.title = request.title;
            membership.amount = decimalAmount;
            membership.active = request.active;

            await this.membershipService.for(manager).update(membership);

            await this.auditLogService.for(manager).create("update-membership", actor, {
                id: membership.id,
                title: membership.title,
                amount: membership.amount.toFixed(MONEY_DECIMAL_PLACES),
                active: membership.active
            });

            return membership;
        }));
    }
}
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
    constructor(private membershipService: MembershipsService) {
    }

    private mapToDTO(membership: Membership): MembershipDTO {
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
        return (await this.membershipService.findAll()).map(this.mapToDTO);
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
    async create(@Body() request: CreateUpdateMembershipDTO): Promise<MembershipDTO> {
        const decimalAmount = new Decimal(request.amount).toDecimalPlaces(MONEY_DECIMAL_PLACES);
        if (decimalAmount.lessThanOrEqualTo(0)) {
            throw new CustomValidationError("Membership amount must be > 0");
        }
        if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
            throw new CustomValidationError(`Membership amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`);
        }
        return this.mapToDTO(await this.membershipService.create({
            title: request.title,
            amount: decimalAmount,
            active: request.active
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
    async updateMembership(@Param("id") id: string, @Body() request: CreateUpdateMembershipDTO): Promise<MembershipDTO> {
        const decimalAmount = new Decimal(request.amount).toDecimalPlaces(MONEY_DECIMAL_PLACES);
        if (decimalAmount.lessThanOrEqualTo(0)) {
            throw new CustomValidationError("Membership amount must be > 0");
        }
        if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
            throw new CustomValidationError(`Membership amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`);
        }
        const membership = await this.membershipService.findById(id);
        if (!membership) {
            throw new HttpException("Membership not found", HttpStatus.NOT_FOUND);
        }

        membership.title = request.title;
        membership.amount = decimalAmount;
        membership.active = request.active;

        await this.membershipService.update(membership);

        return this.mapToDTO(membership);
    }
}
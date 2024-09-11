import {Body, Controller, Get, HttpException, HttpStatus, Param, Post} from "@nestjs/common";
import {
    ApiBody, ApiCookieAuth,
    ApiDefaultResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags,
} from "@nestjs/swagger";
import {TransactionType} from "../common/database/entities/common";
import {IsDate, IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsUUID} from "class-validator";
import {
    SpaceTransaction,
    SpaceTransactionDeposit,
    SpaceTransactionWithdrawal
} from "../common/database/entities/space-transaction.entity";
import {ErrorApiResponse} from "../common/api-responses";
import { SpaceTransactionsService } from "./space-transactions.service";
import { MembersService } from "src/members/members.service";
import Decimal from "decimal.js";
import { CustomValidationError } from "src/common/exceptions";
import { MONEY_DECIMAL_PLACES, MONEY_PRECISION } from "src/common/money";
import { MemberTransactionsController } from "src/member-transactions/member-transactions.controller";
import { UserId } from "src/auth/user-id.decorator";

class SpaceTransactionDTO {
    @ApiProperty({format: "uuid"})
    id: string;

    @ApiProperty({enum: TransactionType})
    type: TransactionType;

    @ApiProperty()
    amount: string;

    @ApiProperty({required: false})
    comment?: string;

    @ApiProperty({format: "date-time"})
    date: string;

    @ApiProperty({required: false, enum: SpaceTransactionDeposit})
    source?: SpaceTransactionDeposit;

    @ApiProperty({required: false, enum: SpaceTransactionWithdrawal})
    target?: SpaceTransactionWithdrawal;

    @ApiProperty({format: "uuid"})
    actorId: string;

    @ApiProperty({format: "date-time"})
    createdAt: string;
}

class CreateSpaceTransactionDTO {
    @ApiProperty({enum: TransactionType})
    @IsEnum(TransactionType)
    @IsNotEmpty()
    type: TransactionType;

    @ApiProperty()
    @IsNumberString()
    @IsNotEmpty()
    amount: string;

    @ApiProperty({required: false})
    comment?: string;

    @ApiProperty({format: "date-time"})
    @IsDate()
    @IsNotEmpty()
    date: string;

    @ApiProperty({required: false, enum: SpaceTransactionDeposit})
    @IsEnum(SpaceTransactionDeposit)
    source?: SpaceTransactionDeposit;

    @ApiProperty({required: false, enum: SpaceTransactionWithdrawal})
    @IsEnum(SpaceTransactionWithdrawal)
    target?: SpaceTransactionWithdrawal;
}

@Controller("space-transactions")
@ApiTags("space-transactions")
export class SpaceTransactionsController {
    constructor(private spaceTransactionsService: SpaceTransactionsService, private membersService: MembersService){
    }
    private static mapToDTO(spaceTransaction: SpaceTransaction): SpaceTransactionDTO {
        return {
            id: spaceTransaction.id,
            type: spaceTransaction.type,
            amount: spaceTransaction.amount.toString(),
            comment: spaceTransaction.comment,
            date: spaceTransaction.date.toISOString(),
            source: spaceTransaction.source,
            target: spaceTransaction.target,
            actorId: spaceTransaction.actor.id,
            createdAt: spaceTransaction.createdAt.toISOString()
        };
    }
    @Get()
    @ApiOperation({
        summary: "Get all space transactions"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [SpaceTransactionDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAll(): Promise<SpaceTransactionDTO[]> {
        return (await this.spaceTransactionsService.findAll()).map(SpaceTransactionsController.mapToDTO);
    }

    @Get("actor/:memberId")
    @ApiOperation({
        summary: "Get all space transactions"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [SpaceTransactionDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAllByActor(@Param("memberId") actorId: string): Promise<SpaceTransactionDTO[]> {
        return (await this.spaceTransactionsService.findAllByMemberId(actorId)).map(SpaceTransactionsController.mapToDTO);
    }

    @Post()
    @ApiOperation({
        summary: "Create new space transaction"
    })
    @ApiBody({
        type: CreateSpaceTransactionDTO
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [SpaceTransactionDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async create(@UserId() actorId: string, @Body() request: CreateSpaceTransactionDTO): Promise<SpaceTransactionDTO> {
        const {type, amount, comment, date, source, target} = request;
        const actor = await this.membersService.findById(actorId);
        if (!actor) {
            throw new HttpException("Actor not found", HttpStatus.NOT_FOUND);
        }
        const decimalAmount = new Decimal(amount).toDecimalPlaces(MONEY_DECIMAL_PLACES);
        if (decimalAmount.lessThanOrEqualTo(0)) {
            throw new CustomValidationError("Membership amount must be > 0");
        }
        if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
            throw new CustomValidationError(`Membership amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`);
        }

        return SpaceTransactionsController.mapToDTO(await this.spaceTransactionsService.create({
            type,
            amount: decimalAmount,
            comment,
            date: new Date(date),
            source,
            target,
            createdAt: new Date(),
            actor
        }));
    };
}
import {Body, Controller, Get, Param, Post} from "@nestjs/common";
import {
    ApiBody, ApiCookieAuth,
    ApiDefaultResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {TransactionType} from "../common/database/entities/common";
import {IsDate, IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsUUID} from "class-validator";
import {
    SpaceTransactionDeposit,
    SpaceTransactionWithdrawal
} from "../common/database/entities/space-transaction.entity";
import {ErrorApiResponse} from "../common/api-responses";

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
        return [];
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
    async findAllByActor(@Param("memberId") memberId: string): Promise<SpaceTransactionDTO[]> {
        return [];
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
    async create(@Body() request: CreateSpaceTransactionDTO): Promise<SpaceTransactionDTO> {
        throw new Error();
    }
}
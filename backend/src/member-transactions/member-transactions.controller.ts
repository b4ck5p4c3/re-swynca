import {Body, Controller, Get, Param, Post} from "@nestjs/common";
import {
    ApiBody,
    ApiCookieAuth,
    ApiDefaultResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags
} from "@nestjs/swagger";
import {TransactionType} from "../common/database/entities/common";
import {
    MemberTransactionDeposit,
    MemberTransactionWithdrawal
} from "../common/database/entities/member-transaction.entity";
import {IsDate, IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsUUID} from "class-validator";
import {ErrorApiResponse} from "../common/api-responses";

class MemberTransactionDTO {
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

    @ApiProperty({required: false, enum: MemberTransactionDeposit})
    source?: MemberTransactionDeposit;

    @ApiProperty({required: false, enum: MemberTransactionWithdrawal})
    target?: MemberTransactionWithdrawal;

    @ApiProperty({format: "uuid"})
    actorId: string;

    @ApiProperty({format: "uuid"})
    subjectId: string;

    @ApiProperty({format: "date-time"})
    createdAt: string;
}

class CreateMemberTransactionDTO {
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

    @ApiProperty({required: false, enum: MemberTransactionDeposit})
    @IsEnum(MemberTransactionDeposit)
    source?: MemberTransactionDeposit;

    @ApiProperty({required: false, enum: MemberTransactionWithdrawal})
    @IsEnum(MemberTransactionWithdrawal)
    target?: MemberTransactionWithdrawal;

    @ApiProperty({format: "uuid"})
    @IsNotEmpty()
    @IsUUID()
    subjectId: string;
}

@Controller("member-transactions")
@ApiTags("member-transactions")
export class MemberTransactionsController {
    @Get()
    @ApiOperation({
        summary: "Get all member transactions"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [MemberTransactionDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAll(): Promise<MemberTransactionDTO[]> {
        return [];
    }

    @Get("subject/:memberId")
    @ApiOperation({
        summary: "Get all member transactions for subject member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [MemberTransactionDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAllBySubjectMember(@Param("memberId") memberId: string): Promise<MemberTransactionDTO[]> {
        return [];
    }

    @Get("actor/:memberId")
    @ApiOperation({
        summary: "Get all member transactions for actor member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [MemberTransactionDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAllByActorMember(@Param("memberId") memberId: string): Promise<MemberTransactionDTO[]> {
        return [];
    }

    @Post()
    @ApiOperation({
        summary: "Create new member transaction"
    })
    @ApiBody({
        type: CreateMemberTransactionDTO
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [MemberTransactionDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async create(@Body() request: CreateMemberTransactionDTO): Promise<MemberTransactionDTO> {
        throw new Error();
    }
}
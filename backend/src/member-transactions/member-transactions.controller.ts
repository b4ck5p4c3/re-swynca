import {Body, Controller, Get, HttpException, HttpStatus, Param, Post} from "@nestjs/common";
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
    MemberTransaction,
    MemberTransactionDeposit,
    MemberTransactionWithdrawal
} from "../common/database/entities/member-transaction.entity";
import {IsDate, IsEnum, IsNotEmpty, IsNumberString, IsUUID} from "class-validator";
import {ErrorApiResponse} from "../common/api-responses";
import {MemberTransactionsService} from "./member-transactions.service";
import {MembersService} from "src/members/members.service";
import Decimal from "decimal.js";
import {CustomValidationError} from "src/common/exceptions";
import {MONEY_DECIMAL_PLACES, MONEY_PRECISION} from "src/common/money";
import {UserId} from "src/auth/user-id.decorator";

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
    constructor(private readonly memberTransactionsService: MemberTransactionsService, private readonly membersSerivice: MembersService) {
    }

    private static mapToDTO(memberTransaction: MemberTransaction): MemberTransactionDTO {
        return {
            id: memberTransaction.id,
            type: memberTransaction.type,
            amount: memberTransaction.amount.toString(),
            comment: memberTransaction.comment,
            date: memberTransaction.date.toISOString(),
            source: memberTransaction.source,
            target: memberTransaction.target,
            actorId: memberTransaction.actor.id,
            subjectId: memberTransaction.subject.id,
            createdAt: memberTransaction.createdAt.toISOString()
        };
    }

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
        return (await this.memberTransactionsService.findAll()).map(MemberTransactionsController.mapToDTO);
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
    async findAllBySubjectMember(@Param("memberId") subjectId: string): Promise<MemberTransactionDTO[]> {
        return (await this.memberTransactionsService.findAllBySubjectId(subjectId)).map(MemberTransactionsController.mapToDTO);

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
    async findAllByActorMember(@Param("memberId") actorId: string): Promise<MemberTransactionDTO[]> {
        return (await this.memberTransactionsService.findAllByActorId(actorId)).map(MemberTransactionsController.mapToDTO);
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
    async create(@UserId() actorId: string, @Body() request: CreateMemberTransactionDTO): Promise<MemberTransactionDTO> {
        const {
            type, amount, comment, date, source
            , target, subjectId
        } = request;
        const decimalAmount = new Decimal(amount).toDecimalPlaces(MONEY_DECIMAL_PLACES);
        const actor = await this.membersSerivice.findById(actorId);
        if (!actor) {
            throw new HttpException("Actor not found", HttpStatus.NOT_FOUND);
        }

        const subjectMember = await this.membersSerivice.findById(subjectId);
        if (!subjectMember) {
            throw new HttpException("Subject member not found", HttpStatus.NOT_FOUND);
        }

        if (decimalAmount.lessThanOrEqualTo(0)) {
            throw new CustomValidationError("Transaction amount must be > 0");
        }
        if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
            throw new CustomValidationError(`Transaction amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`);
        }

        return MemberTransactionsController.mapToDTO(await this.memberTransactionsService.create({
            type,
            amount: decimalAmount,
            comment,
            date: new Date(date),
            source,
            target,
            subject: subjectMember,
            actor,
            createdAt: new Date()
        }));
    };
}
import {Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query} from "@nestjs/common";
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
import {IsDate, IsEnum, IsISO8601, IsNotEmpty, IsNumberString, IsOptional, IsUUID} from "class-validator";
import {ErrorApiResponse} from "../common/api-responses";
import {MemberTransactionsService} from "./member-transactions.service";
import {MembersService, SPACE_MEMBER_ID} from "src/members/members.service";
import Decimal from "decimal.js";
import {CustomValidationError} from "src/common/exceptions";
import {MONEY_DECIMAL_PLACES, MONEY_PRECISION} from "src/common/money";
import {UserId} from "src/auth/user-id.decorator";
import {getCountAndOffset, getOrderObject} from "../common/utils";
import {SpaceTransaction, SpaceTransactionDeposit} from "../common/database/entities/space-transaction.entity";
import {MemberDTO, MembersController} from "../members/members.controller";
import {SpaceTransactionsService} from "../space-transactions/space-transactions.service";
import {AuditLogService} from "../audit-log/audit-log.service";

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

    @ApiProperty()
    actor: MemberDTO;

    @ApiProperty()
    subject: MemberDTO;

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
    @IsISO8601({strict: true})
    @IsNotEmpty()
    date: string;

    @ApiProperty({required: false, enum: MemberTransactionDeposit})
    @IsOptional()
    @IsEnum(MemberTransactionDeposit)
    source?: MemberTransactionDeposit;

    @ApiProperty({required: false, enum: MemberTransactionWithdrawal})
    @IsOptional()
    @IsEnum(MemberTransactionWithdrawal)
    target?: MemberTransactionWithdrawal;

    @ApiProperty({format: "uuid"})
    @IsNotEmpty()
    @IsUUID()
    subjectId: string;
}

class MemberTransactionsDTO {
    @ApiProperty()
    count: number;

    @ApiProperty({type: [MemberTransactionDTO]})
    transactions: MemberTransactionDTO[];
}

@Controller("member-transactions")
@ApiTags("member-transactions")
export class MemberTransactionsController {
    constructor(private memberTransactionsService: MemberTransactionsService,
                private membersService: MembersService,
                private spaceTransactionsService: SpaceTransactionsService,
                private auditLogService: AuditLogService) {
    }

    private static mapToDTO(memberTransaction: MemberTransaction): MemberTransactionDTO {
        return {
            id: memberTransaction.id,
            type: memberTransaction.type,
            amount: memberTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
            comment: memberTransaction.comment,
            date: memberTransaction.date.toISOString(),
            source: memberTransaction.source,
            target: memberTransaction.target,
            actor: MembersController.mapToDTO(memberTransaction.actor),
            subject: MembersController.mapToDTO(memberTransaction.subject),
            createdAt: memberTransaction.createdAt.toISOString()
        };
    }

    @Get()
    @ApiOperation({
        summary: "Get all member transactions"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: MemberTransactionsDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAll(@Query("offset") offset?: string,
                  @Query("count") count?: string,
                  @Query("orderBy") orderBy?: string,
                  @Query("orderDirection") orderDirection?: string): Promise<MemberTransactionsDTO> {
        const transactionsCount = await this.memberTransactionsService.countAll();
        const [realCount, realOffset] = getCountAndOffset(count, offset, 100);

        const orderObject = getOrderObject<SpaceTransaction>(orderBy, orderDirection,
            {
                date: true,
                createdAt: true
            });

        const transactions = await this.memberTransactionsService.findAll(realOffset,
            realCount, orderObject);

        return {
            count: transactionsCount,
            transactions: transactions.map(transaction =>
                MemberTransactionsController.mapToDTO(transaction))
        };
    }

    @Get("subject/:memberId")
    @ApiOperation({
        summary: "Get all member transactions for subject member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: MemberTransactionsDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAllBySubjectMember(@Param("memberId") subjectId: string, @Query("offset") offset?: string,
                                 @Query("count") count?: string,
                                 @Query("orderBy") orderBy?: string,
                                 @Query("orderDirection") orderDirection?: string): Promise<MemberTransactionsDTO> {
        const transactionsCount = await this.memberTransactionsService.countAllBySubjectId(subjectId);
        const [realCount, realOffset] = getCountAndOffset(count, offset, 100);

        const orderObject = getOrderObject<SpaceTransaction>(orderBy, orderDirection,
            {
                date: true,
                createdAt: true
            });

        const transactions = await this.memberTransactionsService.findAllBySubjectId(subjectId,
            realOffset, realCount, orderObject);

        return {
            count: transactionsCount,
            transactions: transactions.map(transaction =>
                MemberTransactionsController.mapToDTO(transaction))
        };
    }

    @Get("actor/:memberId")
    @ApiOperation({
        summary: "Get all member transactions for actor member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: MemberTransactionsDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAllByActorMember(@Param("memberId") actorId: string, @Query("offset") offset?: string,
                               @Query("count") count?: string,
                               @Query("orderBy") orderBy?: string,
                               @Query("orderDirection") orderDirection?: string): Promise<MemberTransactionsDTO> {
        const transactionsCount = await this.memberTransactionsService.countAllByActorId(actorId);
        const [realCount, realOffset] = getCountAndOffset(count, offset, 100);

        const orderObject = getOrderObject<SpaceTransaction>(orderBy, orderDirection,
            {
                date: true,
                createdAt: true
            });

        const transactions = await this.memberTransactionsService.findAllByActorId(actorId,
            realOffset, realCount, orderObject);

        return {
            count: transactionsCount,
            transactions: transactions.map(transaction =>
                MemberTransactionsController.mapToDTO(transaction))
        };
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
        type: MemberTransactionDTO
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
        if (source && target) {
            throw new HttpException("Target and source can't be defined at the same time", HttpStatus.BAD_REQUEST);
        }
        const decimalAmount = new Decimal(amount).toDecimalPlaces(MONEY_DECIMAL_PLACES);if (decimalAmount.lessThanOrEqualTo(0)) {
            throw new CustomValidationError("Transaction amount must be > 0");
        }
        if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
            throw new CustomValidationError(`Transaction amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`);
        }
        const actor = await this.membersService.findById(actorId);
        if (!actor) {
            throw new HttpException("Actor not found", HttpStatus.NOT_FOUND);
        }
        const subjectMember = await this.membersService.findById(subjectId);
        if (!subjectMember) {
            throw new HttpException("Subject member not found", HttpStatus.NOT_FOUND);
        }
        const spaceMember = await this.membersService.findByIdUnfiltered(SPACE_MEMBER_ID);
        if (!spaceMember) {
            throw new HttpException("Space member does not exist", HttpStatus.INTERNAL_SERVER_ERROR);
        }


        const memberTransaction = await this.memberTransactionsService.create({
            type,
            amount: decimalAmount,
            comment,
            date: new Date(date),
            source,
            target,
            subject: subjectMember,
            actor,
            createdAt: new Date()
        });

        await this.auditLogService.create("create-member-transaction", actor, {
            id: memberTransaction.id,
            type: memberTransaction.type,
            amount: memberTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
            comment: memberTransaction.comment,
            date: memberTransaction.date.toISOString(),
            source: memberTransaction.source,
            target: memberTransaction.target,
            subjectId: subjectMember.id
        });

        if (type !== TransactionType.DEPOSIT || source !== MemberTransactionDeposit.DONATE) {
            await this.membersService.atomicIncrementBalance(subjectMember,
                type === TransactionType.DEPOSIT ?
                    decimalAmount : decimalAmount.negated());
        }
        if (type === TransactionType.DEPOSIT && source !== MemberTransactionDeposit.MAGIC) {
            const spaceTransaction = await this.spaceTransactionsService.create({
                type: TransactionType.DEPOSIT,
                amount: decimalAmount,
                date: new Date(date),
                source: source === MemberTransactionDeposit.DONATE ? SpaceTransactionDeposit.DONATE :
                    (source === MemberTransactionDeposit.TOPUP ?
                        SpaceTransactionDeposit.TOPUP : SpaceTransactionDeposit.MAGIC),
                comment,
                actor,
                createdAt: new Date(),
                relatedMemberTransaction: memberTransaction
            });
            await this.membersService.atomicIncrementBalance(spaceMember, decimalAmount);
            await this.auditLogService.create("create-space-transaction", actor, {
                id: spaceTransaction.id,
                type: spaceTransaction.type,
                amount: spaceTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
                comment: spaceTransaction.comment,
                date: spaceTransaction.date.toISOString(),
                source: spaceTransaction.source,
                target: spaceTransaction.target,
                relatedMemberTransaction: memberTransaction.id
            });
        }

        return MemberTransactionsController.mapToDTO(memberTransaction);
    };
}
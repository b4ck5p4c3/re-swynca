import {Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query} from "@nestjs/common";
import {
    ApiBody, ApiCookieAuth,
    ApiDefaultResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags,
} from "@nestjs/swagger";
import {TransactionType} from "../common/database/entities/common";
import {IsEnum, IsISO8601, IsNotEmpty, IsNumberString, IsOptional} from "class-validator";
import {
    SpaceTransaction,
    SpaceTransactionDeposit,
    SpaceTransactionWithdrawal
} from "../common/database/entities/space-transaction.entity";
import {ErrorApiResponse} from "../common/api-responses";
import {SpaceTransactionsService} from "./space-transactions.service";
import {MembersService, SPACE_MEMBER_ID} from "src/members/members.service";
import Decimal from "decimal.js";
import {CustomValidationError} from "src/common/exceptions";
import {MONEY_DECIMAL_PLACES, MONEY_PRECISION} from "src/common/money";
import {UserId} from "src/auth/user-id.decorator";
import {MemberDTO, MembersController} from "../members/members.controller";
import {getCountAndOffset, getOrderObject} from "../common/utils";
import {AuditLogService} from "../audit-log/audit-log.service";
import {Errors} from "../common/errors";
import {getValidActor} from "../common/actor-helper";

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

    @ApiProperty()
    actor: MemberDTO;

    @ApiProperty({required: false})
    relatedMemberTransactionSubject?: MemberDTO;

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
    @IsISO8601({strict: true})
    @IsNotEmpty()
    date: string;

    @ApiProperty({required: false, enum: SpaceTransactionDeposit})
    @IsEnum(SpaceTransactionDeposit)
    @IsOptional()
    source?: SpaceTransactionDeposit;

    @ApiProperty({required: false, enum: SpaceTransactionWithdrawal})
    @IsEnum(SpaceTransactionWithdrawal)
    @IsOptional()
    target?: SpaceTransactionWithdrawal;
}

class SpaceTransactionsDTO {
    @ApiProperty()
    count: number;

    @ApiProperty({type: [SpaceTransactionDTO]})
    transactions: SpaceTransactionDTO[];
}

@Controller("space-transactions")
@ApiTags("space-transactions")
export class SpaceTransactionsController {
    constructor(private spaceTransactionsService: SpaceTransactionsService, private membersService: MembersService,
                private auditLogService: AuditLogService) {
    }

    private static mapToDTO(spaceTransaction: SpaceTransaction): SpaceTransactionDTO {
        return {
            id: spaceTransaction.id,
            type: spaceTransaction.type,
            amount: spaceTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
            comment: spaceTransaction.comment,
            date: spaceTransaction.date.toISOString(),
            source: spaceTransaction.source,
            target: spaceTransaction.target,
            actor: MembersController.mapToDTO(spaceTransaction.actor),
            createdAt: spaceTransaction.createdAt.toISOString(),
            relatedMemberTransactionSubject: spaceTransaction.relatedMemberTransaction ?
                MembersController.mapToDTO(spaceTransaction.relatedMemberTransaction.subject) : undefined,
        };
    }

    @Get()
    @ApiOperation({
        summary: "Get all space transactions"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: SpaceTransactionsDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAll(@Query("offset") offset?: string, @Query("count") count?: string,
                  @Query("orderBy") orderBy?: string,
                  @Query("orderDirection") orderDirection?: string): Promise<SpaceTransactionsDTO> {
        const transactionsCount = await this.spaceTransactionsService.countAll();
        const [realCount, realOffset] = getCountAndOffset(count, offset, 100);

        const orderObject = getOrderObject<SpaceTransaction>(orderBy, orderDirection,
            {
                date: true,
                createdAt: true
            });

        const transactions = await this.spaceTransactionsService.findAll(realOffset, realCount, orderObject);

        return {
            count: transactionsCount,
            transactions: transactions.map(transaction => SpaceTransactionsController.mapToDTO(transaction))
        };
    }

    @Get("actor/:memberId")
    @ApiOperation({
        summary: "Get all space transactions"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: SpaceTransactionsDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAllByActor(@Param("memberId") actorId: string, @Query("offset") offset?: string,
                         @Query("count") count?: string,
                         @Query("orderBy") orderBy?: string,
                         @Query("orderDirection") orderDirection?: string): Promise<SpaceTransactionsDTO> {
        const transactionsCount = await this.spaceTransactionsService.countAllByActorId(actorId);
        const [realCount, realOffset] = getCountAndOffset(count, offset, 100);

        const orderObject = getOrderObject<SpaceTransaction>(orderBy, orderDirection,
            {
                date: true,
                createdAt: true
            });

        const transactions = await this.spaceTransactionsService.findAllByActorId(actorId,
            realOffset, realCount, orderObject);

        return {
            count: transactionsCount,
            transactions: transactions.map(transaction => SpaceTransactionsController.mapToDTO(transaction))
        };
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

        if (source && target) {
            throw new CustomValidationError("Transaction target and source can't be defined at the same time");
        }
        if (request.type === TransactionType.DEPOSIT && !request.source) {
            throw new CustomValidationError("Transaction source must be defined for deposit transaction");
        }
        if (request.type === TransactionType.WITHDRAWAL && !request.target) {
            throw new CustomValidationError("Transaction target must be defined for withdrawal transaction");
        }
        const decimalAmount = new Decimal(amount).toDecimalPlaces(MONEY_DECIMAL_PLACES);
        if (decimalAmount.lessThanOrEqualTo(0)) {
            throw new CustomValidationError("Transaction amount must be > 0");
        }
        if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
            throw new CustomValidationError(`Transaction amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`);
        }
        const spaceMember = await this.membersService.findByIdUnfiltered(SPACE_MEMBER_ID);
        if (!spaceMember) {
            throw new HttpException(Errors.SPACE_MEMBER_NOT_FOUND, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        if (type === TransactionType.WITHDRAWAL && spaceMember.balance.lt(decimalAmount)) {
            throw new HttpException(Errors.SPACE_BALANCE_IS_TOO_LOW, HttpStatus.BAD_REQUEST);
        }
        const actor = await getValidActor(this.membersService, actorId);

        const spaceTransaction = await this.spaceTransactionsService.create({
            type,
            amount: decimalAmount,
            comment,
            date: new Date(date),
            source,
            target,
            createdAt: new Date(),
            actor
        });

        await this.membersService.atomicIncrementBalance(spaceMember,
            request.type === TransactionType.DEPOSIT ?
                decimalAmount : decimalAmount.negated());

        await this.auditLogService.create("create-space-transaction", actor, {
            id: spaceTransaction.id,
            type: spaceTransaction.type,
            amount: spaceTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
            comment: spaceTransaction.comment,
            date: spaceTransaction.date.toISOString(),
            source: spaceTransaction.source,
            target: spaceTransaction.target
        });

        return SpaceTransactionsController.mapToDTO(spaceTransaction);
    };
}
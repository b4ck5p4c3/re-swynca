import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common'
import {
  ApiBody, ApiCookieAuth,
  ApiDefaultResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import { IsEnum, IsISO8601, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator'
import Decimal from 'decimal.js'
import { UserId } from 'src/auth/user-id.decorator'
import { CustomValidationError } from 'src/common/exceptions'
import { MONEY_DECIMAL_PLACES, MONEY_PRECISION } from 'src/common/money'
import { MembersService, SPACE_MEMBER_ID } from 'src/members/members.service'

import { AuditLogService } from '../audit-log/audit-log.service'
import { getValidActor } from '../common/actor-helper'
import { ErrorApiResponse } from '../common/api-responses'
import { TransactionType } from '../common/database/entities/common'
import {
  SpaceTransaction,
  SpaceTransactionDeposit,
  SpaceTransactionWithdrawal
} from '../common/database/entities/space-transaction.entity'
import { Errors } from '../common/errors'
import { getCountAndOffset, getOrderObject } from '../common/utils'
import { MemberDTO, MembersController } from '../members/members.controller'
import { SpaceTransactionsService } from './space-transactions.service'

class CreateSpaceTransactionDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  amount: string

  @ApiProperty({ required: false })
  comment?: string

  @ApiProperty({ format: 'date-time' })
  @IsISO8601({ strict: true })
  @IsNotEmpty()
  date: string

  @ApiProperty({ enum: SpaceTransactionDeposit, required: false })
  @IsEnum(SpaceTransactionDeposit)
  @IsOptional()
  source?: SpaceTransactionDeposit

  @ApiProperty({ enum: SpaceTransactionWithdrawal, required: false })
  @IsEnum(SpaceTransactionWithdrawal)
  @IsOptional()
  target?: SpaceTransactionWithdrawal

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType
}

class SpaceTransactionDTO {
  @ApiProperty()
  actor: MemberDTO

  @ApiProperty()
  amount: string

  @ApiProperty({ required: false })
  comment?: string

  @ApiProperty({ format: 'date-time' })
  createdAt: string

  @ApiProperty({ format: 'date-time' })
  date: string

  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ required: false })
  relatedMemberTransactionSubject?: MemberDTO

  @ApiProperty({ enum: SpaceTransactionDeposit, required: false })
  source?: SpaceTransactionDeposit

  @ApiProperty({ enum: SpaceTransactionWithdrawal, required: false })
  target?: SpaceTransactionWithdrawal

  @ApiProperty({ enum: TransactionType })
  type: TransactionType
}

class SpaceTransactionsDTO {
  @ApiProperty()
  count: number

  @ApiProperty({ type: [SpaceTransactionDTO] })
  transactions: SpaceTransactionDTO[]
}

@ApiTags('space-transactions')
@Controller('space-transactions')
export class SpaceTransactionsController {
  constructor (private spaceTransactionsService: SpaceTransactionsService, private membersService: MembersService,
    private auditLogService: AuditLogService) {}

  private static mapToDTO (spaceTransaction: SpaceTransaction): SpaceTransactionDTO {
    return {
      actor: MembersController.mapToDTO(spaceTransaction.actor),
      amount: spaceTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
      comment: spaceTransaction.comment,
      createdAt: spaceTransaction.createdAt.toISOString(),
      date: spaceTransaction.date.toISOString(),
      id: spaceTransaction.id,
      relatedMemberTransactionSubject: spaceTransaction.relatedMemberTransaction
        ? MembersController.mapToDTO(spaceTransaction.relatedMemberTransaction.subject)
        : undefined,
      source: spaceTransaction.source,
      target: spaceTransaction.target,
      type: spaceTransaction.type,
    }
  }

  @ApiBody({
    type: CreateSpaceTransactionDTO
  })
  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: [SpaceTransactionDTO]
  })
  @ApiOperation({
    summary: 'Create new space transaction'
  })
  @Post()
  async create (@UserId() actorId: string, @Body() request: CreateSpaceTransactionDTO): Promise<SpaceTransactionDTO> {
    const { amount, comment, date, source, target, type } = request

    if (source && target) {
      throw new CustomValidationError("Transaction target and source can't be defined at the same time")
    }
    if (request.type === TransactionType.DEPOSIT && !request.source) {
      throw new CustomValidationError('Transaction source must be defined for deposit transaction')
    }
    if (request.type === TransactionType.WITHDRAWAL && !request.target) {
      throw new CustomValidationError('Transaction target must be defined for withdrawal transaction')
    }
    const decimalAmount = new Decimal(amount).toDecimalPlaces(MONEY_DECIMAL_PLACES)
    if (decimalAmount.lessThanOrEqualTo(0)) {
      throw new CustomValidationError('Transaction amount must be > 0')
    }
    if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
      throw new CustomValidationError(`Transaction amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`)
    }
    const spaceMember = await this.membersService.findByIdUnfiltered(SPACE_MEMBER_ID)
    if (!spaceMember) {
      throw new HttpException(Errors.SPACE_MEMBER_NOT_FOUND, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (type === TransactionType.WITHDRAWAL && spaceMember.balance.lt(decimalAmount)) {
      throw new HttpException(Errors.SPACE_BALANCE_IS_TOO_LOW, HttpStatus.BAD_REQUEST)
    }
    const actor = await getValidActor(this.membersService, actorId)

    const spaceTransaction = await this.spaceTransactionsService.transaction(async (manager) => {
      await (request.type === TransactionType.DEPOSIT
        ? this.membersService.for(manager)
          .atomicallyIncrementBalance(spaceMember, decimalAmount)
        : this.membersService.for(manager)
          .atomicallyDecrementNonZeroableBalance(spaceMember, decimalAmount))

      const spaceTransaction = await this.spaceTransactionsService.for(manager).create({
        actor,
        amount: decimalAmount,
        comment,
        createdAt: new Date(),
        date: new Date(date),
        source,
        target,
        type
      })

      await this.auditLogService.for(manager).create('create-space-transaction', actor, {
        amount: spaceTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
        comment: spaceTransaction.comment,
        date: spaceTransaction.date.toISOString(),
        id: spaceTransaction.id,
        source: spaceTransaction.source,
        target: spaceTransaction.target,
        type: spaceTransaction.type
      })

      return spaceTransaction
    })

    return SpaceTransactionsController.mapToDTO(spaceTransaction)
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: SpaceTransactionsDTO
  })
  @ApiOperation({
    summary: 'Get all space transactions'
  })
  @Get()
  async findAll (@Query('offset') offset?: string, @Query('count') count?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: string): Promise<SpaceTransactionsDTO> {
    const transactionsCount = await this.spaceTransactionsService.countAll()
    const [realCount, realOffset] = getCountAndOffset(count, offset, 100)

    const orderObject = getOrderObject<SpaceTransaction>(orderBy, orderDirection,
      {
        createdAt: true,
        date: true
      })

    const transactions = await this.spaceTransactionsService.findAll(realOffset, realCount, orderObject)

    return {
      count: transactionsCount,
      transactions: transactions.map(transaction => SpaceTransactionsController.mapToDTO(transaction))
    }
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: SpaceTransactionsDTO
  })
  @ApiOperation({
    summary: 'Get all space transactions'
  })
  @Get('actor/:memberId')
  async findAllByActor (@Param('memberId') actorId: string, @Query('offset') offset?: string,
    @Query('count') count?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: string): Promise<SpaceTransactionsDTO> {
    const transactionsCount = await this.spaceTransactionsService.countAllByActorId(actorId)
    const [realCount, realOffset] = getCountAndOffset(count, offset, 100)

    const orderObject = getOrderObject<SpaceTransaction>(orderBy, orderDirection,
      {
        createdAt: true,
        date: true
      })

    const transactions = await this.spaceTransactionsService.findAllByActorId(actorId,
      realOffset, realCount, orderObject)

    return {
      count: transactionsCount,
      transactions: transactions.map(transaction => SpaceTransactionsController.mapToDTO(transaction))
    }
  };
}

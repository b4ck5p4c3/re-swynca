import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common'
import {
  ApiBody,
  ApiCookieAuth,
  ApiDefaultResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags
} from '@nestjs/swagger'
import { IsEnum, IsISO8601, IsNotEmpty, IsNumberString, IsOptional, IsUUID } from 'class-validator'
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
  MemberTransaction,
  MemberTransactionDeposit,
  MemberTransactionWithdrawal
} from '../common/database/entities/member-transaction.entity'
import { SpaceTransaction, SpaceTransactionDeposit } from '../common/database/entities/space-transaction.entity'
import { Errors } from '../common/errors'
import { getCountAndOffset, getOrderObject } from '../common/utils'
import { MemberDTO, MembersController } from '../members/members.controller'
import { SpaceTransactionsService } from '../space-transactions/space-transactions.service'
import { MemberTransactionsService } from './member-transactions.service'

class CreateMemberTransactionDTO {
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

  @ApiProperty({ enum: MemberTransactionDeposit, required: false })
  @IsEnum(MemberTransactionDeposit)
  @IsOptional()
  source?: MemberTransactionDeposit

  @ApiProperty({ format: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  subjectId: string

  @ApiProperty({ enum: MemberTransactionWithdrawal, required: false })
  @IsEnum(MemberTransactionWithdrawal)
  @IsOptional()
  target?: MemberTransactionWithdrawal

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType
}

class MemberTransactionDTO {
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

  @ApiProperty({ enum: MemberTransactionDeposit, required: false })
  source?: MemberTransactionDeposit

  @ApiProperty()
  subject: MemberDTO

  @ApiProperty({ enum: MemberTransactionWithdrawal, required: false })
  target?: MemberTransactionWithdrawal

  @ApiProperty({ enum: TransactionType })
  type: TransactionType
}

class MemberTransactionsDTO {
  @ApiProperty()
  count: number

  @ApiProperty({ type: [MemberTransactionDTO] })
  transactions: MemberTransactionDTO[]
}

@ApiTags('member-transactions')
@Controller('member-transactions')
export class MemberTransactionsController {
  constructor (private memberTransactionsService: MemberTransactionsService,
    private membersService: MembersService,
    private spaceTransactionsService: SpaceTransactionsService,
    private auditLogService: AuditLogService) {}

  private static mapToDTO (memberTransaction: MemberTransaction): MemberTransactionDTO {
    return {
      actor: MembersController.mapToDTO(memberTransaction.actor),
      amount: memberTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
      comment: memberTransaction.comment,
      createdAt: memberTransaction.createdAt.toISOString(),
      date: memberTransaction.date.toISOString(),
      id: memberTransaction.id,
      source: memberTransaction.source,
      subject: MembersController.mapToDTO(memberTransaction.subject),
      target: memberTransaction.target,
      type: memberTransaction.type
    }
  }

  @ApiBody({
    type: CreateMemberTransactionDTO
  })
  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MemberTransactionDTO
  })
  @ApiOperation({
    summary: 'Create new member transaction'
  })
  @Post()
  async create (@UserId() actorId: string, @Body() request: CreateMemberTransactionDTO): Promise<MemberTransactionDTO> {
    const actor = await getValidActor(this.membersService, actorId)
    const {
      amount, comment, date, source, subjectId
      , target, type
    } = request
    if (source && target) {
      throw new CustomValidationError("Transaction target and source can't be defined at the same time")
    }
    if (request.type === TransactionType.DEPOSIT && !request.source) {
      throw new CustomValidationError('Transaction source must be defined for deposit transaction')
    }
    if (request.type === TransactionType.WITHDRAWAL && !request.target) {
      throw new CustomValidationError('Transaction target must be defined for withdrawal transaction')
    }
    const decimalAmount = new Decimal(amount).toDecimalPlaces(MONEY_DECIMAL_PLACES); if (decimalAmount.lessThanOrEqualTo(0)) {
      throw new CustomValidationError('Transaction amount must be > 0')
    }
    if (decimalAmount.precision() > MONEY_PRECISION - MONEY_DECIMAL_PLACES) {
      throw new CustomValidationError(`Transaction amount must be < 10^${MONEY_PRECISION - MONEY_DECIMAL_PLACES}`)
    }
    const subjectMember = await this.membersService.findById(subjectId)
    if (!subjectMember) {
      throw new HttpException(Errors.SUBJECT_MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    const spaceMember = await this.membersService.findByIdUnfiltered(SPACE_MEMBER_ID)
    if (!spaceMember) {
      throw new HttpException(Errors.SPACE_MEMBER_NOT_FOUND, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    const memberTransaction = await this.memberTransactionsService.transaction(async manager => {
      const memberTransaction = await this.memberTransactionsService.for(manager).create({
        actor,
        amount: decimalAmount,
        comment,
        createdAt: new Date(),
        date: new Date(date),
        source,
        subject: subjectMember,
        target,
        type
      })

      await this.auditLogService.for(manager).create('create-member-transaction', actor, {
        amount: memberTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
        comment: memberTransaction.comment,
        date: memberTransaction.date.toISOString(),
        id: memberTransaction.id,
        source: memberTransaction.source,
        subjectId: subjectMember.id,
        target: memberTransaction.target,
        type: memberTransaction.type
      })
      if (type !== TransactionType.DEPOSIT || source !== MemberTransactionDeposit.DONATE) {
        await this.membersService.for(manager).atomicallyIncrementBalance(subjectMember,
          type === TransactionType.DEPOSIT
            ? decimalAmount
            : decimalAmount.negated())
      }

      if (type === TransactionType.DEPOSIT && source !== MemberTransactionDeposit.MAGIC) {
        const spaceTransaction = await this.spaceTransactionsService.for(manager).create({
          actor,
          amount: decimalAmount,
          comment,
          createdAt: new Date(),
          date: new Date(date),
          relatedMemberTransaction: memberTransaction,
          source: source === MemberTransactionDeposit.DONATE
            ? SpaceTransactionDeposit.DONATE
            : (source === MemberTransactionDeposit.TOPUP
                ? SpaceTransactionDeposit.TOPUP
                : SpaceTransactionDeposit.MAGIC),
          type: TransactionType.DEPOSIT
        })
        await this.membersService.for(manager).atomicallyIncrementBalance(spaceMember, decimalAmount)

        await this.auditLogService.for(manager).create('create-space-transaction', actor, {
          amount: spaceTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
          comment: spaceTransaction.comment,
          date: spaceTransaction.date.toISOString(),
          id: spaceTransaction.id,
          relatedMemberTransaction: memberTransaction.id,
          source: spaceTransaction.source,
          target: spaceTransaction.target,
          type: spaceTransaction.type
        })
      }

      return memberTransaction
    })

    return MemberTransactionsController.mapToDTO(memberTransaction)
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MemberTransactionsDTO
  })
  @ApiOperation({
    summary: 'Get all member transactions'
  })
  @Get()
  async findAll (@Query('offset') offset?: string,
    @Query('count') count?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: string): Promise<MemberTransactionsDTO> {
    const transactionsCount = await this.memberTransactionsService.countAll()
    const [realCount, realOffset] = getCountAndOffset(count, offset, 100)

    const orderObject = getOrderObject<SpaceTransaction>(orderBy, orderDirection,
      {
        createdAt: true,
        date: true
      })

    const transactions = await this.memberTransactionsService.findAll(realOffset,
      realCount, orderObject)

    return {
      count: transactionsCount,
      transactions: transactions.map(transaction =>
        MemberTransactionsController.mapToDTO(transaction))
    }
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MemberTransactionsDTO
  })
  @ApiOperation({
    summary: 'Get all member transactions for actor member'
  })
  @Get('actor/:memberId')
  async findAllByActorMember (@Param('memberId') actorId: string, @Query('offset') offset?: string,
    @Query('count') count?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: string): Promise<MemberTransactionsDTO> {
    const transactionsCount = await this.memberTransactionsService.countAllByActorId(actorId)
    const [realCount, realOffset] = getCountAndOffset(count, offset, 100)

    const orderObject = getOrderObject<SpaceTransaction>(orderBy, orderDirection,
      {
        createdAt: true,
        date: true
      })

    const transactions = await this.memberTransactionsService.findAllByActorId(actorId,
      realOffset, realCount, orderObject)

    return {
      count: transactionsCount,
      transactions: transactions.map(transaction =>
        MemberTransactionsController.mapToDTO(transaction))
    }
  }

  @ApiCookieAuth()
  @ApiDefaultResponse({
    description: 'Erroneous response',
    type: ErrorApiResponse
  })
  @ApiOkResponse({
    description: 'Successful response',
    type: MemberTransactionsDTO
  })
  @ApiOperation({
    summary: 'Get all member transactions for subject member'
  })
  @Get('subject/:memberId')
  async findAllBySubjectMember (@Param('memberId') subjectId: string, @Query('offset') offset?: string,
    @Query('count') count?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: string): Promise<MemberTransactionsDTO> {
    const transactionsCount = await this.memberTransactionsService.countAllBySubjectId(subjectId)
    const [realCount, realOffset] = getCountAndOffset(count, offset, 100)

    const orderObject = getOrderObject<SpaceTransaction>(orderBy, orderDirection,
      {
        createdAt: true,
        date: true
      })

    const transactions = await this.memberTransactionsService.findAllBySubjectId(subjectId,
      realOffset, realCount, orderObject)

    return {
      count: transactionsCount,
      transactions: transactions.map(transaction =>
        MemberTransactionsController.mapToDTO(transaction))
    }
  };
}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MemberTransaction } from 'src/common/database/entities/member-transaction.entity'
import { MembersService } from 'src/members/members.service'

import { AuditLogModule } from '../audit-log/audit-log.module'
import { MembersModule } from '../members/members.module'
import { SpaceTransactionsModule } from '../space-transactions/space-transactions.module'
import { MemberTransactionsController } from './member-transactions.controller'
import { MemberTransactionsService } from './member-transactions.service'

@Module({
  controllers: [MemberTransactionsController],
  exports: [MemberTransactionsService],
  imports: [MembersModule, TypeOrmModule.forFeature([MemberTransaction]),
    SpaceTransactionsModule, AuditLogModule],
  providers: [MemberTransactionsService]
})
export class MemberTransactionsModule {}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SpaceTransaction } from 'src/common/database/entities/space-transaction.entity'
import { MembersService } from 'src/members/members.service'

import { AuditLogModule } from '../audit-log/audit-log.module'
import { MembersModule } from '../members/members.module'
import { SpaceTransactionsController } from './space-transactions.controller'
import { SpaceTransactionsService } from './space-transactions.service'

@Module({
  controllers: [SpaceTransactionsController],
  exports: [SpaceTransactionsService],
  imports: [MembersModule, TypeOrmModule.forFeature([SpaceTransaction]), AuditLogModule],
  providers: [SpaceTransactionsService]
})
export class SpaceTransactionsModule {}

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuditLogModule } from '../audit-log/audit-log.module'
import { MAC } from '../common/database/entities/mac.entity'
import { MembersModule } from '../members/members.module'
import { MACsController } from './macs.controller'
import { MACsService } from './macs.service'

@Module({
  controllers: [MACsController],
  imports: [TypeOrmModule.forFeature([MAC]), AuditLogModule, MembersModule, ConfigModule],
  providers: [MACsService],
})
export class MACsModule {}

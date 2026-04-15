import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuditLogModule } from '../audit-log/audit-log.module'
import { Membership } from '../common/database/entities/membership.entity'
import { MembersModule } from '../members/members.module'
import { MembershipsController } from './memberships.controller'
import { MembershipsService } from './memberships.service'

@Module({
  controllers: [MembershipsController],
  exports: [MembershipsService],
  imports: [TypeOrmModule.forFeature([Membership]), AuditLogModule, MembersModule],
  providers: [MembershipsService]
})
export class MembershipsModule {}

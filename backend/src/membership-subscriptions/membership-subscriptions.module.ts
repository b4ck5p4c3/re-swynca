import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuditLogModule } from '../audit-log/audit-log.module'
import { MembershipSubscription } from '../common/database/entities/membership-subscription.entity'
import { MembersModule } from '../members/members.module'
import { MembershipsModule } from '../memberships/memberships.module'
import { MembershipSubscriptionsController } from './membership-subscriptions.controller'
import { MembershipSubscriptionsService } from './membership-subscriptions.service'

@Module({
  controllers: [MembershipSubscriptionsController],
  exports: [MembershipSubscriptionsService],
  imports: [TypeOrmModule.forFeature([MembershipSubscription]),
    MembershipsModule, MembersModule, AuditLogModule],
  providers: [MembershipSubscriptionsService]
})
export class MembershipSubscriptionsModule {}

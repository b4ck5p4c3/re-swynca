import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'

import { ACSKeysModule } from './acs-keys/acs-keys.module'
import { ApiKeysControllerModule } from './api-keys/api-keys-controller.module'
import { AuditLogModule } from './audit-log/audit-log.module'
import { BaseAuditLogModule } from './base-audit-log/base-audit-log.module'
import { AppConfigModule } from './common/config/app-config.module'
import { DatabaseModule } from './common/database/database.module'
import { AppHttpModule } from './common/http/app-http.module'
import { LogtoAuthModule } from './logto-auth/logto-auth.module'
import { MACsModule } from './macs/macs.module'
import { MemberTransactionsModule } from './member-transactions/member-transactions.module'
import { MembersModule } from './members/members.module'
import { MembershipSubscriptionsModule } from './membership-subscriptions/membership-subscriptions.module'
import { MembershipsModule } from './memberships/memberships.module'
import { SeederModule } from './seeder/seeder.module'
import { SpaceTransactionsModule } from './space-transactions/space-transactions.module'
import { SpaceModule } from './space/space.module'
import { StatusModule } from './status/status.module'
import { SubscriptionsWithdrawerModule } from './subscriptions-withdrawer/subscriptions-withdrawer.module'
import { TelegramListenerModule } from './telegram-listener/telegram-listener.module'

@Module({
  controllers: [],
  imports: [
    ScheduleModule.forRoot(),
    AppConfigModule,
    AppHttpModule,

    DatabaseModule,

    AuditLogModule,
    BaseAuditLogModule,

    MembershipsModule,
    MembersModule,
    ACSKeysModule,
    MemberTransactionsModule,
    SpaceTransactionsModule,
    MembershipSubscriptionsModule,
    SpaceModule,
    ApiKeysControllerModule,
    MACsModule,

    StatusModule,

    LogtoAuthModule,

    SeederModule,
    SubscriptionsWithdrawerModule,

    TelegramListenerModule
  ],
  providers: [],
})
export class AppModule {}

import {Module} from '@nestjs/common';
import {AppConfigModule} from "./common/config/app-config.module";
import {DatabaseModule} from "./common/database/database.module";
import {MembershipsModule} from "./memberships/memberships.module";
import {MembersModule} from "./members/members.module";
import {ACSKeysModule} from "./acs-keys/acs-keys.module";
import {MemberTransactionsModule} from "./member-transactions/member-transactions.module";
import {SpaceTransactionsModule} from "./space-transactions/space-transactions.module";
import {MembershipSubscriptionsModule} from "./membership-subscriptions/membership-subscriptions.module";
import {LogtoAuthModule} from "./logto-auth/logto-auth.module";
import {AppJwtModule} from "./common/jwt/app-jwt.module";
import {AppHttpModule} from "./common/http/app-http.module";
import {SpaceSeederModule} from "./space-seeder/space-seeder.module";
import {SpaceModule} from "./space/space.module";
import {AuditLogModule} from "./audit-log/audit-log.module";

@Module({
    imports: [
        AppConfigModule,
        AppJwtModule,
        AppHttpModule,

        DatabaseModule,

        AuditLogModule,

        MembershipsModule,
        MembersModule,
        ACSKeysModule,
        MemberTransactionsModule,
        SpaceTransactionsModule,
        MembershipSubscriptionsModule,
        SpaceModule,

        LogtoAuthModule,

        SpaceSeederModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule {
}

import {Module} from "@nestjs/common";
import {SwyncaMetadataModule} from "../swynca-metadata/swynca-metadata.module";
import {SubscriptionsWithdrawerService} from "./subscriptions-withdrawer.service";
import {MembershipSubscriptionsModule} from "../membership-subscriptions/membership-subscriptions.module";
import {MembersModule} from "../members/members.module";
import {MemberTransactionsModule} from "../member-transactions/member-transactions.module";
import {AuditLogModule} from "../audit-log/audit-log.module";

@Module({
    imports: [SwyncaMetadataModule, MembershipSubscriptionsModule,
        MembersModule, MemberTransactionsModule, AuditLogModule],
    providers: [SubscriptionsWithdrawerService]
})
export class SubscriptionsWithdrawerModule {
}
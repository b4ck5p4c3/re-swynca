import {Module} from "@nestjs/common";
import {MembershipSubscriptionsController} from "./membership-subscriptions.controller";
import {MembershipSubscriptionsService} from "./membership-subscriptions.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {MembershipSubscription} from "../common/database/entities/membership-subscription.entity";
import {MembershipsModule} from "../memberships/memberships.module";
import {MembersModule} from "../members/members.module";
import {AuditLogModule} from "../audit-log/audit-log.module";

@Module({
    imports: [TypeOrmModule.forFeature([MembershipSubscription]),
        MembershipsModule, MembersModule, AuditLogModule],
    controllers: [MembershipSubscriptionsController],
    providers: [MembershipSubscriptionsService]
})
export class MembershipSubscriptionsModule {

}
import {Module} from "@nestjs/common";
import {MembershipSubscriptionsController} from "./membership-subscriptions.controller";
import {MembershipSubscriptionsService} from "./membership-subscriptions.service";

@Module({
    controllers: [MembershipSubscriptionsController],
    providers: [MembershipSubscriptionsService]
})
export class MembershipSubscriptionsModule {

}
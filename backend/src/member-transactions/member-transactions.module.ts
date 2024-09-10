import {Module} from "@nestjs/common";
import {MemberTransactionsController} from "./member-transactions.controller";
import {MemberTransactionsService} from "./member-transactions.service";

@Module({
    controllers: [MemberTransactionsController],
    providers: [MemberTransactionsService]
})
export class MemberTransactionsModule {
}
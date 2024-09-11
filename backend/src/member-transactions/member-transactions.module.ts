import {Module} from "@nestjs/common";
import {MemberTransactionsController} from "./member-transactions.controller";
import {MemberTransactionsService} from "./member-transactions.service";
import { MembersService } from "src/members/members.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MemberTransaction } from "src/common/database/entities/member-transaction.entity";

@Module({
    imports: [MembersService, TypeOrmModule.forFeature([MemberTransaction])],
    controllers: [MemberTransactionsController],
    providers: [MemberTransactionsService]
})
export class MemberTransactionsModule {
}
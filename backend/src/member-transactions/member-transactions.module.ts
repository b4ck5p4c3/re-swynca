import {Module} from "@nestjs/common";
import {MemberTransactionsController} from "./member-transactions.controller";
import {MemberTransactionsService} from "./member-transactions.service";
import { MembersService } from "src/members/members.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MemberTransaction } from "src/common/database/entities/member-transaction.entity";
import {MembersModule} from "../members/members.module";
import {SpaceTransactionsModule} from "../space-transactions/space-transactions.module";

@Module({
    imports: [MembersModule, TypeOrmModule.forFeature([MemberTransaction]), SpaceTransactionsModule],
    controllers: [MemberTransactionsController],
    providers: [MemberTransactionsService]
})
export class MemberTransactionsModule {
}
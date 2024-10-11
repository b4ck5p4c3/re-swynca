import {Module} from "@nestjs/common";
import {MemberTransactionsController} from "./member-transactions.controller";
import {MemberTransactionsService} from "./member-transactions.service";
import { MembersService } from "src/members/members.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MemberTransaction } from "src/common/database/entities/member-transaction.entity";
import {MembersModule} from "../members/members.module";
import {SpaceTransactionsModule} from "../space-transactions/space-transactions.module";
import {AuditLogModule} from "../audit-log/audit-log.module";

@Module({
    imports: [MembersModule, TypeOrmModule.forFeature([MemberTransaction]),
        SpaceTransactionsModule, AuditLogModule],
    controllers: [MemberTransactionsController],
    providers: [MemberTransactionsService],
    exports: [MemberTransactionsService]
})
export class MemberTransactionsModule {
}
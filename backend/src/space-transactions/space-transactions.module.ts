import {Module} from "@nestjs/common";
import {SpaceTransactionsController} from "./space-transactions.controller";
import {SpaceTransactionsService} from "./space-transactions.service";
import { MembersService } from "src/members/members.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SpaceTransaction } from "src/common/database/entities/space-transaction.entity";
import {MembersModule} from "../members/members.module";
import {AuditLogModule} from "../audit-log/audit-log.module";

@Module({
    imports: [MembersModule, TypeOrmModule.forFeature([SpaceTransaction]), AuditLogModule],
    controllers: [SpaceTransactionsController],
    providers: [SpaceTransactionsService],
    exports: [SpaceTransactionsService]
})
export class SpaceTransactionsModule {
}
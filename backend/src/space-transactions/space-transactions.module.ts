import {Module} from "@nestjs/common";
import {SpaceTransactionsController} from "./space-transactions.controller";
import {SpaceTransactionsService} from "./space-transactions.service";
import { MembersService } from "src/members/members.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SpaceTransaction } from "src/common/database/entities/space-transaction.entity";

@Module({
    imports: [MembersService, TypeOrmModule.forFeature([SpaceTransaction])],
    controllers: [SpaceTransactionsController],
    providers: [SpaceTransactionsService]
})
export class SpaceTransactionsModule {
}
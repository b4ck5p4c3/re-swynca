import {Module} from "@nestjs/common";
import {SpaceTransactionsController} from "./space-transactions.controller";
import {SpaceTransactionsService} from "./space-transactions.service";
import { MembersService } from "src/members/members.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SpaceTransaction } from "src/common/database/entities/space-transaction.entity";
import {MembersModule} from "../members/members.module";

@Module({
    imports: [MembersModule, TypeOrmModule.forFeature([SpaceTransaction])],
    controllers: [SpaceTransactionsController],
    providers: [SpaceTransactionsService]
})
export class SpaceTransactionsModule {
}
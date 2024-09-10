import {Module} from "@nestjs/common";
import {SpaceTransactionsController} from "./space-transactions.controller";
import {SpaceTransactionsService} from "./space-transactions.service";

@Module({
    controllers: [SpaceTransactionsController],
    providers: [SpaceTransactionsService]
})
export class SpaceTransactionsModule {
}
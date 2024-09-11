import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {BalancesService} from "./balances.service";
import {Balance} from "../common/database/entities/balance.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Balance])],
    providers: [BalancesService],
    exports: [BalancesService],
})
export class BalancesModule {
}
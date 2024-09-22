import {Module} from "@nestjs/common";
import {BaseTransactionSignerService} from "./base-transaction-signer.service";
import {ConfigModule} from "@nestjs/config";

@Module({
    imports: [ConfigModule],
    providers: [BaseTransactionSignerService],
    exports: [BaseTransactionSignerService]
})
export class BaseTransactionSignerModule {
}
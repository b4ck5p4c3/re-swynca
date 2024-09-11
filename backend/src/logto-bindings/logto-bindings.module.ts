import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {LogtoBinding} from "../common/database/entities/logto-binding.entity";
import {LogtoBindingsService} from "./logto-bindings.service";

@Module({
    imports: [TypeOrmModule.forFeature([LogtoBinding])],
    providers: [LogtoBindingsService],
    exports: [LogtoBindingsService]
})
export class LogtoBindingsModule {
}
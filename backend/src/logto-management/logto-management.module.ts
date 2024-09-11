import {Module} from "@nestjs/common";
import {LogtoManagementService} from "./logto-management.service";
import {ConfigModule} from "@nestjs/config";
import {HttpModule} from "@nestjs/axios";

@Module({
    imports: [ConfigModule, HttpModule],
    providers: [LogtoManagementService],
    exports: [LogtoManagementService]
})
export class LogtoManagementModule {
}
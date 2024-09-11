import {Module} from "@nestjs/common";
import {LogtoManagementService} from "./logto-management.service";

@Module({
    providers: [LogtoManagementService],
    exports: [LogtoManagementService]
})
export class LogtoManagementModule {
}
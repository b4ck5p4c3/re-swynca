import {Module} from "@nestjs/common";
import {LogtoAuthController} from "./logto-auth.controller";
import {LogtoAuthService} from "./logto-auth.service";
import {ConfigModule} from "@nestjs/config";
import {AuthModule} from "../auth/auth.module";
import {HttpModule} from "@nestjs/axios";
import {LogtoBindingsModule} from "../logto-bindings/logto-bindings.module";
import {AuditLogModule} from "../audit-log/audit-log.module";

@Module({
    imports: [ConfigModule, AuthModule, LogtoBindingsModule,
        HttpModule, AuditLogModule],
    controllers: [LogtoAuthController],
    providers: [LogtoAuthService]
})
export class LogtoAuthModule {
}
import {Module} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {AuthController} from "./auth.controller";
import {APP_GUARD} from "@nestjs/core";
import {AuthGuard} from "./auth.guard";
import {ConfigModule} from "@nestjs/config";
import {SessionStorageModule} from "../session-storage/session-storage.module";

@Module({
    imports: [SessionStorageModule, ConfigModule],
    providers: [AuthService, {
        provide: APP_GUARD,
        useClass: AuthGuard
    }],
    controllers: [AuthController],
    exports: [AuthService]
})
export class AuthModule {
}
import {Module} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {AppJwtModule} from "../common/jwt/app-jwt.module";
import {AuthController} from "./auth.controller";
import {APP_GUARD} from "@nestjs/core";
import {AuthGuard} from "./auth.guard";

@Module({
    imports: [AppJwtModule],
    providers: [AuthService, {
        provide: APP_GUARD,
        useClass: AuthGuard
    }],
    controllers: [AuthController],
    exports: [AuthService]
})
export class AuthModule {
}
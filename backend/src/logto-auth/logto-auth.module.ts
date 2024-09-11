import {Module} from "@nestjs/common";
import {LogtoAuthController} from "./logto-auth.controller";
import {LogtoAuthService} from "./logto-auth.service";
import {ConfigModule} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ExternalAuthenticationLogto} from "../common/database/entities/external-authentication-logto.entity";
import {AuthModule} from "../auth/auth.module";
import {AppHttpModule} from "../common/http/app-http.module";
import {HttpModule} from "@nestjs/axios";

@Module({
    imports: [ConfigModule, AuthModule, TypeOrmModule.forFeature([ExternalAuthenticationLogto]),
        HttpModule],
    controllers: [LogtoAuthController],
    providers: [LogtoAuthService]
})
export class LogtoAuthModule {
}
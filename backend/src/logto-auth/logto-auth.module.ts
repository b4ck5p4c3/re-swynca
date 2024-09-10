import {Module} from "@nestjs/common";
import {LogtoAuthController} from "./logto-auth.controller";
import {LogtoAuthService} from "./logto-auth.service";
import {ConfigModule} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ExternalAuthenticationLogto} from "../common/database/entities/external-authentication-logto.entity";
import {AuthModule} from "../auth/auth.module";

@Module({
    imports: [ConfigModule, AuthModule, TypeOrmModule.forFeature([ExternalAuthenticationLogto])],
    controllers: [LogtoAuthController],
    providers: [LogtoAuthService]
})
export class LogtoAuthModule {
}
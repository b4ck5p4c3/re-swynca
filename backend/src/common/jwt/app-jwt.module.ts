import {Module} from "@nestjs/common";
import {JwtModule} from "@nestjs/jwt";
import {ConfigModule, ConfigService} from "@nestjs/config";

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.getOrThrow("JWT_SECRET"),
                signOptions: {expiresIn: 8 * 60 * 60},
                global: true
            }),
            inject: [ConfigService]
        })
    ],
    exports: [JwtModule]
})
export class AppJwtModule {
}
import {Module} from "@nestjs/common";
import {HttpModule, HttpService} from "@nestjs/axios";
import {ConfigModule, ConfigService} from "@nestjs/config";

@Module({
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                timeout: parseInt(configService.getOrThrow("HTTP_TIMEOUT")),
                maxRedirects: 0
            }),
            inject: [ConfigService]
        })
    ]
})
export class AppHttpModule {
}
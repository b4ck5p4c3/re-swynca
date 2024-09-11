import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {HttpService} from "@nestjs/axios";

interface LogtoM2MConfig {
    endpoint: string;
    appId: string;
    appSecret: string;
}

interface LogtoM2MToken {
    expiresAt: number,
    token: string;
}

@Injectable()
export class LogtoManagementService {
    private logtoM2MConfig: LogtoM2MConfig;
    private logtoM2MToken: LogtoM2MToken;

    constructor(private configService: ConfigService, private httpService: HttpService) {
        this.logtoM2MConfig = {
            endpoint: configService.getOrThrow("LOGTO_M2M_ENDPOINT"),
            appId: configService.getOrThrow("LOGTO_M2M_APP_ID"),
            appSecret: configService.getOrThrow("LOGTO_M2M_APP_SECRET"),
        };
    }

    async getToken(): Promise<string> {
        return "nigga";
    }
}
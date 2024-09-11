import {Injectable, OnModuleInit} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {HttpService} from "@nestjs/axios";

export interface OIDCServiceConfig {
    issuer: string;
    clientId: string;
    clientSecret: string;
}

interface OIDCConfig {
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
}

interface OIDCTokenResponse {
    access_token: string;
    token_type: string;
}

interface OIDCUserInfo {
    sub: string;
}

@Injectable()
export class OIDCService implements OnModuleInit {
    private issuerConfig: OIDCConfig;

    constructor(private readonly config: OIDCServiceConfig, private httpService: HttpService) {
    }

    async onModuleInit(): Promise<void> {
        this.issuerConfig = (await this.httpService.axiosRef.get<OIDCConfig>(
            `${this.config.issuer}/.well-known/openid-configuration`)).data;
    }

    getAuthUrl(redirectUrl: string): string {
        const authUrl = new URL(this.issuerConfig.authorization_endpoint);
        authUrl.searchParams.set("redirect_url", redirectUrl);
        authUrl.searchParams.set("client_id", this.config.clientId);
        authUrl.searchParams.set("scope", "openid");
        authUrl.searchParams.set("response_type", "code");
        return authUrl.toString();
    }

    async authorizeCode(code: string, redirectUrl: string): Promise<string> {
        const postData = new URLSearchParams();
        postData.set("grant_type", "authorization_code");
        postData.set("code", code);
        postData.set("redirect_url", redirectUrl);
        postData.set("client_id", this.config.clientId);
        postData.set("client_secret", this.config.clientSecret);
        const response: OIDCTokenResponse = (await this.httpService.axiosRef.post(this.issuerConfig.token_endpoint, postData.toString(), {
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            }
        })).data;

        if (response.token_type !== "Bearer") {
            throw new Error(`OIDC token type from response '${response.token_type}' !== 'Bearer'`);
        }

        const userInfo: OIDCUserInfo = (await this.httpService.axiosRef.get(this.issuerConfig.userinfo_endpoint, {
            headers: {
                "authorization": `Bearer ${response.access_token}`
            }
        })).data;

        if (!userInfo.sub) {
            throw new Error(`No 'sub' in OIDC user info`);
        }

        return userInfo.sub;
    }
}
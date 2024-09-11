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

interface LogtoTokenEndpointResponse {
    access_token: string;
    expires_in: number;
}

interface CreateUserData {
    name: string;
    email: string;
}

interface UpdateUserData {
    name: string;
    email: string;
}

interface LogtoCreateUserResponse {
    id: string;
}

const LOGTO_MANAGEMENT_API_ID = "https://default.logto.app/api";

@Injectable()
export class LogtoManagementService {
    private logtoM2MConfig: LogtoM2MConfig;
    private logtoM2MToken: LogtoM2MToken = {expiresAt: 0, token: ""};

    constructor(private configService: ConfigService, private httpService: HttpService) {
        this.logtoM2MConfig = {
            endpoint: configService.getOrThrow("LOGTO_M2M_ENDPOINT"),
            appId: configService.getOrThrow("LOGTO_M2M_APP_ID"),
            appSecret: configService.getOrThrow("LOGTO_M2M_APP_SECRET"),
        };
    }

    async fetchToken(): Promise<LogtoM2MToken> {
        const request = new URLSearchParams();
        request.set("grant_type", "client_credentials");
        request.set("resource", LOGTO_MANAGEMENT_API_ID);
        request.set("scope", "all");

        const response = (await this.httpService.axiosRef.post<LogtoTokenEndpointResponse>(
            `${this.logtoM2MConfig.endpoint}/oidc/token`, request.toString(), {
                auth: {
                    username: this.logtoM2MConfig.appId,
                    password: this.logtoM2MConfig.appSecret,
                },
                headers: {
                    "content-type": "application/x-www-form-urlencoded"
                },
            })).data;

        const accessToken = response.access_token;
        const expiresIn = response.expires_in;

        return {
            token: accessToken,
            expiresAt: Date.now() + expiresIn * 1000
        }
    }

    async getToken(): Promise<string> {
        if (this.logtoM2MToken.expiresAt - Date.now() > 60000) {
            return this.logtoM2MToken.token;
        }

        this.logtoM2MToken = await this.fetchToken();

        return this.logtoM2MToken.token;
    }

    async createUser(createUserData: CreateUserData): Promise<string> {
        const response = (await this.httpService.axiosRef.post<LogtoCreateUserResponse>(
            `${this.logtoM2MConfig.endpoint}/api/users`, {
                primaryEmail: createUserData.email,
                name: createUserData.name
            }, {
                headers: {
                    "authorization": `Bearer ${await this.getToken()}`
                }
            })).data;

        return response.id;
    }

    async updateUserSuspensionStatus(id: string, isSuspended: boolean): Promise<void> {
        await this.httpService.axiosRef.patch(
            `${this.logtoM2MConfig.endpoint}/api/users/${id}/is-suspended`, {
                isSuspended
            }, {
                headers: {
                    "authorization": `Bearer ${await this.getToken()}`
                }
            });
    }

    async updateUser(id: string, data: UpdateUserData): Promise<void> {
        await this.httpService.axiosRef.patch(
            `${this.logtoM2MConfig.endpoint}/api/users/${id}`, {
                name: data.name,
                primaryEmail: data.email
            }, {
                headers: {
                    "authorization": `Bearer ${await this.getToken()}`
                }
            });
    }
}
import {Injectable} from "@nestjs/common";
import {OIDCService} from "../oidc/oidc.service";
import {ConfigService} from "@nestjs/config";
import {Member} from "../common/database/entities/member.entity";
import {HttpService} from "@nestjs/axios";
import {LogtoBindingsService} from "../logto-bindings/logto-bindings.service";

@Injectable()
export class LogtoAuthService extends OIDCService {

    constructor(private configService: ConfigService, private logtoBindingsService: LogtoBindingsService,
                httpService: HttpService) {
        super({
            issuer: configService.getOrThrow("LOGTO_ISSUER"),
            clientId: configService.getOrThrow("LOGTO_CLIENT_ID"),
            clientSecret: configService.getOrThrow("LOGTO_CLIENT_SECRET")
        }, httpService);
    }

    async getMemberFromLogtoId(logtoId: string): Promise<Member | null> {
        const memberAuth = await this.logtoBindingsService.findByLogtoId(logtoId);
        if (!memberAuth) {
            return null;
        }
        return memberAuth.member;
    }
}
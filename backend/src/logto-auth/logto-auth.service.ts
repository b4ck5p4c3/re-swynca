import {Injectable} from "@nestjs/common";
import {OIDCService} from "../oidc/oidc.service";
import {ConfigService} from "@nestjs/config";
import {Member} from "../common/database/entities/member.entity";
import {Repository} from "typeorm";
import {ExternalAuthenticationLogto} from "../common/database/entities/external-authentication-logto.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {HttpService} from "@nestjs/axios";

@Injectable()
export class LogtoAuthService extends OIDCService {

    constructor(private configService: ConfigService,
                @InjectRepository(ExternalAuthenticationLogto) private externalAuthenticationLogtoRepository:
                    Repository<ExternalAuthenticationLogto>,
                httpService: HttpService) {
        super({
            issuer: configService.getOrThrow("LOGTO_ISSUER"),
            clientId: configService.getOrThrow("LOGTO_CLIENT_ID"),
            clientSecret: configService.getOrThrow("LOGTO_CLIENT_SECRET")
        }, httpService);
    }

    async getMemberFromLogtoId(logtoId: string): Promise<Member | null> {
        const memberAuth = await this.externalAuthenticationLogtoRepository.findOne({
            where: {
                logtoId: logtoId
            },
            relations: {
                member: true
            }
        });
        if (!memberAuth) {
            return null;
        }
        return memberAuth.member;
    }
}
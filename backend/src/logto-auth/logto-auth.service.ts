import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { Member } from '../common/database/entities/member.entity'
import { LogtoBindingsService } from '../logto-bindings/logto-bindings.service'
import { OIDCService } from '../oidc/oidc.service'

@Injectable()
export class LogtoAuthService extends OIDCService {
  constructor (private configService: ConfigService, private logtoBindingsService: LogtoBindingsService,
    httpService: HttpService) {
    super({
      clientId: configService.getOrThrow('LOGTO_CLIENT_ID'),
      clientSecret: configService.getOrThrow('LOGTO_CLIENT_SECRET'),
      issuer: configService.getOrThrow('LOGTO_ISSUER')
    }, httpService)
  }

  async getMemberFromLogtoId (logtoId: string): Promise<Member | null> {
    const memberAuth = await this.logtoBindingsService.findByLogtoId(logtoId)
    if (!memberAuth) {
      return null
    }
    return memberAuth.member
  }
}

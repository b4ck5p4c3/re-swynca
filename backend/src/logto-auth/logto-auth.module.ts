import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuditLogModule } from '../audit-log/audit-log.module'
import { AuthModule } from '../auth/auth.module'
import { LogtoBindingsModule } from '../logto-bindings/logto-bindings.module'
import { LogtoAuthController } from './logto-auth.controller'
import { LogtoAuthService } from './logto-auth.service'

@Module({
  controllers: [LogtoAuthController],
  imports: [ConfigModule, AuthModule, LogtoBindingsModule,
    HttpModule, AuditLogModule],
  providers: [LogtoAuthService]
})
export class LogtoAuthModule {}

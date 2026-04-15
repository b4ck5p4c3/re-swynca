import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuditLogModule } from '../audit-log/audit-log.module'
import { BaseTransactionSignerModule } from '../base-transaction-signer/base-transaction-signer.module'
import { BaseAuditLogService } from './base-audit-log.service'

@Module({
  imports: [ConfigModule, AuditLogModule, BaseTransactionSignerModule],
  providers: [BaseAuditLogService]
})
export class BaseAuditLogModule {}

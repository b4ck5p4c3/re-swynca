import { Module } from '@nestjs/common'

import { AuditLogModule } from '../audit-log/audit-log.module'
import { MembersModule } from '../members/members.module'
import { SessionStorageModule } from '../session-storage/session-storage.module'
import { ApiKeysController } from './api-keys.controller'
import { ApiKeysModule } from './api-keys.module'

@Module({
  controllers: [ApiKeysController],
  imports: [ApiKeysModule, MembersModule, AuditLogModule, SessionStorageModule],
})
export class ApiKeysControllerModule {}

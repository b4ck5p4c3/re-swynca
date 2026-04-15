import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuditLogModule } from '../audit-log/audit-log.module'
import { ACSKey } from '../common/database/entities/acs-key.entity'
import { MembersModule } from '../members/members.module'
import { AcsKeysSystemApiAuthGuard } from './acs-keys-system-api-auth.guard'
import { ACSKeysController } from './acs-keys.controller'
import { ACSKeysService } from './acs-keys.service'

@Module({
  controllers: [ACSKeysController],
  imports: [MembersModule, TypeOrmModule.forFeature([ACSKey]), AuditLogModule, ConfigModule],
  providers: [ACSKeysService, AcsKeysSystemApiAuthGuard]
})
export class ACSKeysModule {}

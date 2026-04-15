import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuditLog } from '../common/database/entities/audit-log.entity'
import { AuditLogService } from './audit-log.service'

@Module({
  exports: [AuditLogService],
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService]
})
export class AuditLogModule {}

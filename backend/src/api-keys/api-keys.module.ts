import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ApiKey } from '../common/database/entities/api-key.entity'
import { SessionStorageModule } from '../session-storage/session-storage.module'
import { ApiKeysService } from './api-keys.service'

@Module({
  exports: [ApiKeysService],
  imports: [SessionStorageModule, TypeOrmModule.forFeature([ApiKey])],
  providers: [ApiKeysService]
})
export class ApiKeysModule {}

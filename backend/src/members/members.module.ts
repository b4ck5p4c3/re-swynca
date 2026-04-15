import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ApiKeysModule } from '../api-keys/api-keys.module'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { Member } from '../common/database/entities/member.entity'
import { GitHubMetadatasModule } from '../github-metadatas/github-metadatas.module'
import { GitHubModule } from '../github/github.module'
import { LogtoBindingsModule } from '../logto-bindings/logto-bindings.module'
import { LogtoManagementModule } from '../logto-management/logto-management.module'
import { SessionStorageModule } from '../session-storage/session-storage.module'
import { TelegramMetadatasModule } from '../telegram-metadatas/telegram-metadatas.module'
import { MembersController } from './members.controller'
import { MembersService } from './members.service'

@Module({
  controllers: [MembersController],
  exports: [MembersService],
  imports: [TypeOrmModule.forFeature([Member]), GitHubModule, GitHubMetadatasModule,
    TelegramMetadatasModule, LogtoManagementModule, LogtoBindingsModule, AuditLogModule,
    ConfigModule, SessionStorageModule, ApiKeysModule],
  providers: [MembersService]
})
export class MembersModule {}

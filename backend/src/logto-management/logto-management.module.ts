import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { LogtoManagementService } from './logto-management.service'

@Module({
  exports: [LogtoManagementService],
  imports: [ConfigModule, HttpModule],
  providers: [LogtoManagementService]
})
export class LogtoManagementModule {}

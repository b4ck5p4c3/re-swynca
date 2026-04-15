import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { GitHubService } from './github.service'

@Module({
  exports: [GitHubService],
  imports: [ConfigModule, HttpModule],
  providers: [GitHubService],
})
export class GitHubModule {}

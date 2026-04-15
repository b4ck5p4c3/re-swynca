import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { TelegramMetadata } from '../common/database/entities/telegram-metadata.entity'
import { TelegramMetadatasController } from './telegram-metadatas.controller'
import { TelegramMetadatasService } from './telegram-metadatas.service'

@Module({
  controllers: [TelegramMetadatasController],
  exports: [TelegramMetadatasService],
  imports: [TypeOrmModule.forFeature([TelegramMetadata]), ConfigModule],
  providers: [TelegramMetadatasService]
})
export class TelegramMetadatasModule {}

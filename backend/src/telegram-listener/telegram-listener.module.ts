import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { TelegramMetadatasModule } from '../telegram-metadatas/telegram-metadatas.module'
import { TelegramListenerAuthGuard } from './telegram-listener-auth.guard'
import { TelegramListenerController } from './telegram-listener.controller'

@Module({
  controllers: [TelegramListenerController],
  imports: [ConfigModule, TelegramMetadatasModule],
  providers: [TelegramListenerAuthGuard]
})
export class TelegramListenerModule {}

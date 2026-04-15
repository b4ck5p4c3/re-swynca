import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { BaseTransactionSignerService } from './base-transaction-signer.service'

@Module({
  exports: [BaseTransactionSignerService],
  imports: [ConfigModule],
  providers: [BaseTransactionSignerService]
})
export class BaseTransactionSignerModule {}

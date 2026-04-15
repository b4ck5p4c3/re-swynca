import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LogtoBinding } from '../common/database/entities/logto-binding.entity'
import { LogtoBindingsService } from './logto-bindings.service'

@Module({
  exports: [LogtoBindingsService],
  imports: [TypeOrmModule.forFeature([LogtoBinding])],
  providers: [LogtoBindingsService]
})
export class LogtoBindingsModule {}

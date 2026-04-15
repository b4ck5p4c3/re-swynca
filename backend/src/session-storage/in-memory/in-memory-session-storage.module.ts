import { Module } from '@nestjs/common'

import { SessionStorageService } from '../session-storage.service'
import { InMemorySessionStorageService } from './in-memory-session-storage.service'

@Module({
  exports: [SessionStorageService],
  providers: [{
    provide: SessionStorageService,
    useClass: InMemorySessionStorageService
  }]
})
export class InMemorySessionStorageModule {}

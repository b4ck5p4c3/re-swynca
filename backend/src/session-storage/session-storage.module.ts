import { Module } from '@nestjs/common'

import { InMemorySessionStorageModule } from './in-memory/in-memory-session-storage.module'
import { SessionStorageService } from './session-storage.service'

@Module({
  exports: [InMemorySessionStorageModule],
  imports: [InMemorySessionStorageModule]
})
export class SessionStorageModule {}

import { Module } from '@nestjs/common'

import { MembersModule } from '../members/members.module'
import { StatusController } from './status.controller'
import { StatusService } from './status.service'

@Module({
  controllers: [StatusController],
  imports: [MembersModule],
  providers: [StatusService],
})
export class StatusModule {}

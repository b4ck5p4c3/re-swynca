import { Module } from '@nestjs/common'

import { MembersModule } from '../members/members.module'
import { SpaceController } from './space.controller'

@Module({
  controllers: [SpaceController],
  imports: [MembersModule]
})
export class SpaceModule {}

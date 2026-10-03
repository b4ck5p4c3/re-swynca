import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { RealSenseService } from './realsense.service'

@Module({
  exports: [RealSenseService],
  imports: [ConfigModule, HttpModule],
  providers: [RealSenseService],
})
export class RealSenseModule {}

import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EntranceSound } from 'src/common/database/entities/entrance-sound.entity'

import { EntranceSoundController } from './entrance-sound.controller'
import { EntranceSoundService } from './entrance-sound.service'

@Module({
  controllers: [EntranceSoundController],
  exports: [EntranceSoundService],
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([EntranceSound])
  ],
  providers: [EntranceSoundService],
})
export class EntranceSoundModule {}

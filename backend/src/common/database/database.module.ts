import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ACSKey } from './entities/acs-key.entity'
import { ApiKey } from './entities/api-key.entity'
import { AuditLog } from './entities/audit-log.entity'
import { EntranceSound } from './entities/entrance-sound.entity'
import { GitHubMetadata } from './entities/github-metadata.entity'
import { LogtoBinding } from './entities/logto-binding.entity'
import { MAC } from './entities/mac.entity'
import { MemberTransaction } from './entities/member-transaction.entity'
import { Member } from './entities/member.entity'
import { MembershipSubscription } from './entities/membership-subscription.entity'
import { Membership } from './entities/membership.entity'
import { SpaceTransaction } from './entities/space-transaction.entity'
import { SwyncaMetadata } from './entities/swynca-metadata.entity'
import { TelegramMetadata } from './entities/telegram-metadata.entity'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        entities: [Member, LogtoBinding, ACSKey,
          SpaceTransaction, MemberTransaction,
          Membership, MembershipSubscription,
          TelegramMetadata, GitHubMetadata,
          AuditLog, ApiKey, SwyncaMetadata,
          MAC, EntranceSound],
        logging: process.env.NODE_ENV === 'development',
        synchronize: true,
        type: 'postgres',
        url: configService.getOrThrow('DATABASE_URL')
      })
    })
  ]
})
export class DatabaseModule {}

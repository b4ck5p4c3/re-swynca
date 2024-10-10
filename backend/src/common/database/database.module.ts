import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {Member} from "./entities/member.entity";
import {LogtoBinding} from "./entities/logto-binding.entity";
import {ACSKey} from "./entities/acs-key.entity";
import {SpaceTransaction} from "./entities/space-transaction.entity";
import {MemberTransaction} from "./entities/member-transaction.entity";
import {Membership} from "./entities/membership.entity";
import {MembershipSubscription} from "./entities/membership-subscription.entity";
import {TelegramMetadata} from "./entities/telegram-metadata.entity";
import {GitHubMetadata} from "./entities/github-metadata.entity";
import {AuditLog} from "./entities/audit-log.entity";
import {ApiKey} from "./entities/api-key.entity";
import {SwyncaMetadata} from "./entities/swynca-metadata.entity";

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: "postgres",
                url: configService.getOrThrow("DATABASE_URL"),
                entities: [Member, LogtoBinding, ACSKey,
                    SpaceTransaction, MemberTransaction,
                    Membership, MembershipSubscription,
                    TelegramMetadata, GitHubMetadata,
                    AuditLog, ApiKey, SwyncaMetadata],
                synchronize: true,
                logging: process.env.NODE_ENV === "development"
            }),
            inject: [ConfigService]
        })
    ]
})
export class DatabaseModule {
}
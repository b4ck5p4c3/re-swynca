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
                    TelegramMetadata, GitHubMetadata],
                synchronize: true
            }),
            inject: [ConfigService]
        })
    ]
})
export class DatabaseModule {
}
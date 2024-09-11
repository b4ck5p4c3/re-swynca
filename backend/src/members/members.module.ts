import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Member} from "../common/database/entities/member.entity";
import {MembersController} from "./members.controller";
import {MembersService} from "./members.service";
import {GitHubModule} from "../github/github.module";
import {GitHubMetadatasModule} from "../github-metadatas/github-metadatas.module";
import {TelegramMetadatasModule} from "../telegram-metadatas/telegram-metadatas.module";
import {BalancesModule} from "../balances/balances.module";

@Module({
    imports: [TypeOrmModule.forFeature([Member]), GitHubModule, GitHubMetadatasModule,
        TelegramMetadatasModule, BalancesModule],
    controllers: [MembersController],
    providers: [MembersService],
    exports: [MembersService]
})
export class MembersModule {
}
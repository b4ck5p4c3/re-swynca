import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Member} from "../common/database/entities/member.entity";
import {MembersController} from "./members.controller";
import {MembersService} from "./members.service";
import {GitHubModule} from "../github/github.module";
import {GitHubMetadatasModule} from "../github-metadatas/github-metadatas.module";
import {TelegramMetadatasModule} from "../telegram-metadatas/telegram-metadatas.module";
import {LogtoManagementModule} from "../logto-management/logto-management.module";
import {LogtoBindingsModule} from "../logto-bindings/logto-bindings.module";

@Module({
    imports: [TypeOrmModule.forFeature([Member]), GitHubModule, GitHubMetadatasModule,
        TelegramMetadatasModule, LogtoManagementModule, LogtoBindingsModule],
    controllers: [MembersController],
    providers: [MembersService],
    exports: [MembersService]
})
export class MembersModule {
}
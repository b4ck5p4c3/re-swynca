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
import {AuditLogModule} from "../audit-log/audit-log.module";
import {ConfigModule} from "@nestjs/config";
import {SessionStorageModule} from "../session-storage/session-storage.module";

@Module({
    imports: [TypeOrmModule.forFeature([Member]), GitHubModule, GitHubMetadatasModule,
        TelegramMetadatasModule, LogtoManagementModule, LogtoBindingsModule, AuditLogModule,
        ConfigModule, SessionStorageModule],
    controllers: [MembersController],
    providers: [MembersService],
    exports: [MembersService]
})
export class MembersModule {
}
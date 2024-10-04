import {Module} from "@nestjs/common";
import {ApiKeysService} from "./api-keys.service";
import {ApiKeysController} from "./api-keys.controller";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ApiKey} from "../common/database/entities/api-key.entity";
import {MembersModule} from "../members/members.module";
import {AuditLogModule} from "../audit-log/audit-log.module";
import {SessionStorageModule} from "../session-storage/session-storage.module";

@Module({
    imports: [TypeOrmModule.forFeature([ApiKey]), MembersModule, AuditLogModule, SessionStorageModule],
    providers: [ApiKeysService],
    controllers: [ApiKeysController],
})
export class ApiKeysModule {
}
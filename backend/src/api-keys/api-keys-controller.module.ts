import {Module} from "@nestjs/common";
import {ApiKeysModule} from "./api-keys.module";
import {MembersModule} from "../members/members.module";
import {ApiKeysController} from "./api-keys.controller";
import {AuditLogModule} from "../audit-log/audit-log.module";
import {SessionStorageModule} from "../session-storage/session-storage.module";

@Module({
    imports: [ApiKeysModule, MembersModule, AuditLogModule, SessionStorageModule],
    controllers: [ApiKeysController],
})
export class ApiKeysControllerModule {}
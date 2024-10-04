import {Module} from "@nestjs/common";
import {ACSKeysController} from "./acs-keys.controller";
import {ACSKeysService} from "./acs-keys.service";
import {MembersModule} from "../members/members.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ACSKey} from "../common/database/entities/acs-key.entity";
import {AuditLogModule} from "../audit-log/audit-log.module";
import {ACSKeysApiAuthGuard} from "./acs-keys-api-auth.guard";
import {ConfigModule} from "@nestjs/config";

@Module({
    imports: [MembersModule, TypeOrmModule.forFeature([ACSKey]), AuditLogModule, ConfigModule],
    controllers: [ACSKeysController],
    providers: [ACSKeysService, ACSKeysApiAuthGuard]
})
export class ACSKeysModule {
}
import {Module} from "@nestjs/common";
import {ACSKeysController} from "./acs-keys.controller";
import {ACSKeysService} from "./acs-keys.service";
import {MembersModule} from "../members/members.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ACSKey} from "../common/database/entities/acs-key.entity";
import {AuditLogModule} from "../audit-log/audit-log.module";

@Module({
    imports: [MembersModule, TypeOrmModule.forFeature([ACSKey]), AuditLogModule],
    controllers: [ACSKeysController],
    providers: [ACSKeysService]
})
export class ACSKeysModule {
}
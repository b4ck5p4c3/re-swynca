import {Module} from "@nestjs/common";
import {MACsController} from "./macs.controller";
import {MACsService} from "./macs.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {MAC} from "../common/database/entities/mac.entity";
import {AuditLogModule} from "../audit-log/audit-log.module";
import {MembersModule} from "../members/members.module";
import {ConfigModule} from "@nestjs/config";

@Module({
    imports: [TypeOrmModule.forFeature([MAC]), AuditLogModule, MembersModule, ConfigModule],
    controllers: [MACsController],
    providers: [MACsService],
})
export class MACsModule {
}
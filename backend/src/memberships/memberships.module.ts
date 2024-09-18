import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Membership} from "../common/database/entities/membership.entity";
import {MembershipsController} from "./memberships.controller";
import {MembershipsService} from "./memberships.service";
import {MembersModule} from "../members/members.module";
import {AuditLogModule} from "../audit-log/audit-log.module";

@Module({
    imports: [TypeOrmModule.forFeature([Membership]), AuditLogModule, MembersModule],
    controllers: [MembershipsController],
    providers: [MembershipsService],
    exports: [MembershipsService]
})
export class MembershipsModule {}
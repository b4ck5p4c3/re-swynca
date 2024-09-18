import {Module} from "@nestjs/common";
import {AuditLogService} from "./audit-log.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {AuditLog} from "../common/database/entities/audit-log.entity";
import {AuditLogController} from "./audit-log.controller";

@Module({
    imports: [TypeOrmModule.forFeature([AuditLog])],
    providers: [AuditLogService],
    controllers: [AuditLogController],
    exports: [AuditLogService]
})
export class AuditLogModule {
}
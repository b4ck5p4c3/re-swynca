import {Module} from "@nestjs/common";
import {AuditLogService} from "./audit-log.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {AuditLog} from "../common/database/entities/audit-log.entity";

@Module({
    imports: [TypeOrmModule.forFeature([AuditLog])],
    providers: [AuditLogService],
    exports: [AuditLogService]
})
export class AuditLogModule {
}
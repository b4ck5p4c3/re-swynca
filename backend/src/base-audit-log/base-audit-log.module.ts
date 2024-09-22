import {Module} from "@nestjs/common";
import {BaseAuditLogService} from "./base-audit-log.service";
import {ConfigModule} from "@nestjs/config";
import {AuditLogModule} from "../audit-log/audit-log.module";
import {BaseTransactionSignerModule} from "../base-transaction-signer/base-transaction-signer.module";

@Module({
    imports: [ConfigModule, AuditLogModule, BaseTransactionSignerModule],
    providers: [BaseAuditLogService]
})
export class BaseAuditLogModule {
}
import {Module} from "@nestjs/common";
import {ApiKeysService} from "./api-keys.service";
import {SessionStorageModule} from "../session-storage/session-storage.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ApiKey} from "../common/database/entities/api-key.entity";

@Module({
    imports: [SessionStorageModule, TypeOrmModule.forFeature([ApiKey])],
    providers: [ApiKeysService],
    exports: [ApiKeysService]
})
export class ApiKeysModule {
}
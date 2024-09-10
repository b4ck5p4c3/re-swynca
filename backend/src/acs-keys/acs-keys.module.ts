import {Module} from "@nestjs/common";
import {ACSKeysController} from "./acs-keys.controller";
import {ACSKeysService} from "./acs-keys.service";
import {MembersModule} from "../members/members.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ACSKey} from "../common/database/entities/acs-key.entity";

@Module({
    imports: [MembersModule, TypeOrmModule.forFeature([ACSKey])],
    controllers: [ACSKeysController],
    providers: [ACSKeysService]
})
export class ACSKeysModule {
}
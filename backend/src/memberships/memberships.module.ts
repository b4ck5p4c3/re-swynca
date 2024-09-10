import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Membership} from "../common/database/entities/membership.entity";
import {MembershipsController} from "./memberships.controller";
import {MembershipsService} from "./memberships.service";

@Module({
    imports: [TypeOrmModule.forFeature([Membership])],
    controllers: [MembershipsController],
    providers: [MembershipsService]
})
export class MembershipsModule {}
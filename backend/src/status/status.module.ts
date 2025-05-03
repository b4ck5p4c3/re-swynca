import {Module} from "@nestjs/common";
import {StatusController} from "./status.controller";
import {StatusService} from "./status.service";
import {MembersService} from "../members/members.service";

@Module({
    imports: [MembersService],
    controllers: [StatusController],
    providers: [StatusService],
})
export class StatusModule {
}
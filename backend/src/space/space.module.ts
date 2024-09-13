import {Module} from "@nestjs/common";
import {MembersModule} from "../members/members.module";
import {SpaceController} from "./space.controller";

@Module({
    imports: [MembersModule],
    controllers: [SpaceController]
})
export class SpaceModule {
}
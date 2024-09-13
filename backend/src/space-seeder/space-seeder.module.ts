import {Module} from "@nestjs/common";
import {SpaceSeederService} from "./space-seeder.service";
import {MembersModule} from "../members/members.module";

@Module({
    imports: [MembersModule],
    providers: [SpaceSeederService]
})
export class SpaceSeederModule {
}
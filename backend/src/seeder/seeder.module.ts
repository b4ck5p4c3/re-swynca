import {Module} from "@nestjs/common";
import {SeederService} from "./seeder.service";
import {MembersModule} from "../members/members.module";

@Module({
    imports: [MembersModule],
    providers: [SeederService]
})
export class SeederModule {
}
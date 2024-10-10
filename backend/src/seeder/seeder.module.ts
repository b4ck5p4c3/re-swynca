import {Module} from "@nestjs/common";
import {SeederService} from "./seeder.service";
import {MembersModule} from "../members/members.module";
import {SwyncaMetadataModule} from "../swynca-metadata/swynca-metadata.module";

@Module({
    imports: [MembersModule, SwyncaMetadataModule],
    providers: [SeederService]
})
export class SeederModule {
}
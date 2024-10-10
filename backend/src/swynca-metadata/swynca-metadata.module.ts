import {Module} from "@nestjs/common";
import {SwyncaMetadataService} from "./swynca-metadata.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {SwyncaMetadata} from "../common/database/entities/swynca-metadata.entity";

@Module({
    imports: [TypeOrmModule.forFeature([SwyncaMetadata])],
    providers: [SwyncaMetadataService],
    exports: [SwyncaMetadataService],
})
export class SwyncaMetadataModule {
}
import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {GitHubMetadata} from "../common/database/entities/github-metadata.entity";
import {GitHubMetadatasService} from "./github-metadatas.service";

@Module({
    imports: [TypeOrmModule.forFeature([GitHubMetadata])],
    providers: [GitHubMetadatasService],
    exports: [GitHubMetadatasService]
})
export class GitHubMetadatasModule {

}
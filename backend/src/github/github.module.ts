import {Module} from "@nestjs/common";
import {GitHubService} from "./github.service";
import {ConfigModule} from "@nestjs/config";
import {HttpModule} from "@nestjs/axios";

@Module({
    imports: [ConfigModule, HttpModule],
    providers: [GitHubService],
    exports: [GitHubService],
})
export class GitHubModule {
}
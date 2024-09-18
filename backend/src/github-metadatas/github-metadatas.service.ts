import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {GitHubMetadata} from "../common/database/entities/github-metadata.entity";
import {Injectable} from "@nestjs/common";
import {DeepPartial} from "typeorm/common/DeepPartial";
import {AuditLogService} from "../audit-log/audit-log.service";

@Injectable()
export class GitHubMetadatasService {
    constructor(@InjectRepository(GitHubMetadata) private githubMetadataRepository: Repository<GitHubMetadata>) {
    }

    async create(githubMetadataData: DeepPartial<GitHubMetadata>): Promise<GitHubMetadata> {
        const githubMetadata = this.githubMetadataRepository.create(githubMetadataData);
        await this.githubMetadataRepository.save(githubMetadata);
        return githubMetadata;
    }

    async update(githubMetadata: GitHubMetadata): Promise<GitHubMetadata> {
        await this.githubMetadataRepository.save(githubMetadata);
        return githubMetadata;
    }

    async remove(githubId: string) {
        await this.githubMetadataRepository.delete(githubId);
    }

    async existsByGithubId(githubId: string) {
        return await this.githubMetadataRepository.existsBy({
            githubId
        });
    }
}
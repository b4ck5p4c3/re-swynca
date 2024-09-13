import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {HttpService} from "@nestjs/axios";

@Injectable()
export class GitHubService {

    private githubToken: string;

    constructor(configService: ConfigService, private httpService: HttpService) {
        this.githubToken = configService.getOrThrow("GITHUB_TOKEN");
    }

    async getIdByUsername(username: string): Promise<string | null> {
        try {
            const response = await this.httpService.axiosRef.get<{ id: string }>(
                `https://api.github.com/users/${encodeURIComponent(username)}`, {
                    auth: {
                        username: this.githubToken,
                        password: ""
                    }
                });

            return response.data.id.toString();
        } catch (e) {
            return null;
        }
    }
}
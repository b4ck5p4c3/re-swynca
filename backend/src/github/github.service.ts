import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class GitHubService {

    private githubToken: string;

    constructor(private configService: ConfigService) {
        this.githubToken = configService.getOrThrow("GITHUB_TOKEN");
    }

    async getIdByUsername(username: string): Promise<string | null> {
        try {
            const response = await (await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
                headers: {
                    "authorization": `Basic ${btoa(`${this.githubToken}:`)}`
                }
            })).json();

            return response.id;
        } catch (e) {
            return null;
        }
    }
}
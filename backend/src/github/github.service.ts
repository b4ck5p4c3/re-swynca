import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {HttpService} from "@nestjs/axios";
import {AxiosError} from "axios";

@Injectable()
export class GitHubService {

    private githubToken: string;

    constructor(configService: ConfigService, private httpService: HttpService) {
        this.githubToken = configService.getOrThrow("GITHUB_TOKEN");
    }

    async getIdByUsername(username: string): Promise<{ id: string, username: string } | null> {
        try {
            const response = await this.httpService.axiosRef.get<{ id: string, login: string }>(
                `https://api.github.com/users/${encodeURIComponent(username)}`, {
                    auth: {
                        username: this.githubToken,
                        password: ""
                    }
                });

            return {
                id: response.data.id.toString(),
                username: response.data.login.toString()
            };
        } catch (e) {
            if (e instanceof AxiosError) {
                if (e.status === 404) {
                    return null;
                }
            }
        }
    }

    async getUsernameById(id: string): Promise<string | null> {
        const response = await this.httpService.axiosRef.get<{ login: string }>(
            `https://api.github.com/user/${encodeURIComponent(id)}`, {
                auth: {
                    username: this.githubToken,
                    password: ""
                }
            });

        return response.data.login.toString();
    }

    async setOrganizationMemberForUser(organization: string, username: string, role: "member" | "owner"): Promise<void> {
        await this.httpService.axiosRef.put(
            `https://api.github.com/orgs/${organization}/memberships/${encodeURIComponent(username)}`, {
                role
            }, {
                auth: {
                    username: this.githubToken,
                    password: ""
                }
            });
    }

    async removeOrganizationMemberForUser(organization: string, username: string): Promise<void> {
        await this.httpService.axiosRef.delete(
            `https://api.github.com/orgs/${organization}/memberships/${encodeURIComponent(username)}`, {
                auth: {
                    username: this.githubToken,
                    password: ""
                }
            });
    }
}
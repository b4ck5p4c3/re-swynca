import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosError } from 'axios'

@Injectable()
export class GitHubService {
  private githubToken: string

  constructor (configService: ConfigService, private httpService: HttpService) {
    this.githubToken = configService.getOrThrow('GITHUB_TOKEN')
  }

  async getIdByUsername (username: string): Promise<null | { id: string, username: string }> {
    try {
      const response = await this.httpService.axiosRef.get<{ id: string, login: string }>(
                `https://api.github.com/users/${encodeURIComponent(username)}`, {
                  auth: {
                    password: '',
                    username: this.githubToken
                  }
                })

      return {
        id: response.data.id.toString(),
        username: response.data.login.toString()
      }
    } catch (error) {
      if (error instanceof AxiosError && error.status === 404) {
        return null
      }
    }
  }

  async getUsernameById (id: string): Promise<null | string> {
    const response = await this.httpService.axiosRef.get<{ login: string }>(
            `https://api.github.com/user/${encodeURIComponent(id)}`, {
              auth: {
                password: '',
                username: this.githubToken
              }
            })

    return response.data.login.toString()
  }

  async removeOrganizationMemberForUser (organization: string, username: string): Promise<void> {
    await this.httpService.axiosRef.delete(
            `https://api.github.com/orgs/${organization}/memberships/${encodeURIComponent(username)}`, {
              auth: {
                password: '',
                username: this.githubToken
              }
            })
  }

  async setOrganizationMemberForUser (organization: string, username: string, role: 'member' | 'owner'): Promise<void> {
    await this.httpService.axiosRef.put(
            `https://api.github.com/orgs/${organization}/memberships/${encodeURIComponent(username)}`, {
              role
            }, {
              auth: {
                password: '',
                username: this.githubToken
              }
            })
  }
}

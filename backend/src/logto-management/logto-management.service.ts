import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface CreateUserData {
  email: string;
  name: string;
  username: string;
}

interface LogtoCreateUserResponse {
  id: string;
}

interface LogtoM2MConfig {
  appId: string;
  appSecret: string;
  endpoint: string;
}

interface LogtoM2MToken {
  expiresAt: number,
  token: string;
}

interface LogtoTokenEndpointResponse {
  access_token: string;
  expires_in: number;
}

interface UpdateUserData {
  email: string;
  name: string;
  username: string;
}

const LOGTO_MANAGEMENT_API_ID = 'https://default.logto.app/api'

export const LOGTO_TELEGRAM_CONNECTOR_TARGET = 'telegram'
export const LOGTO_GITHUB_CONNECTOR_TARGET = 'github'

@Injectable()
export class LogtoManagementService {
  private logtoM2MConfig: LogtoM2MConfig
  private logtoM2MToken: LogtoM2MToken = { expiresAt: 0, token: '' }

  constructor (private configService: ConfigService, private httpService: HttpService) {
    this.logtoM2MConfig = {
      appId: configService.getOrThrow('LOGTO_M2M_APP_ID'),
      appSecret: configService.getOrThrow('LOGTO_M2M_APP_SECRET'),
      endpoint: configService.getOrThrow('LOGTO_M2M_ENDPOINT'),
    }
  }

  async createUser (createUserData: CreateUserData): Promise<string> {
    const response = (await this.httpService.axiosRef.post<LogtoCreateUserResponse>(
            `${this.logtoM2MConfig.endpoint}/api/users`, {
              name: createUserData.name,
              primaryEmail: createUserData.email,
              username: createUserData.username
            }, {
              headers: {
                authorization: `Bearer ${await this.getToken()}`
              }
            })).data

    return response.id
  }

  async deleteUserSocialIdentity (userId: string, target: string): Promise<void> {
    const response = await this.httpService.axiosRef.delete(
            `${this.logtoM2MConfig.endpoint}/api/users/${userId}/identities/${target}`,
            {
              headers: {
                authorization: `Bearer ${await this.getToken()}`
              },
              validateStatus: () => true
            })
    if ((response.status < 200 || response.status > 299) && response.data.code !== 'user.identity_not_exist') {
      throw new Error(`Failed to delete social identity: ${response.data.message}`)
    }
  }

  async fetchToken (): Promise<LogtoM2MToken> {
    const request = new URLSearchParams()
    request.set('grant_type', 'client_credentials')
    request.set('resource', LOGTO_MANAGEMENT_API_ID)
    request.set('scope', 'all')

    const response = (await this.httpService.axiosRef.post<LogtoTokenEndpointResponse>(
            `${this.logtoM2MConfig.endpoint}/oidc/token`, request.toString(), {
              auth: {
                password: this.logtoM2MConfig.appSecret,
                username: this.logtoM2MConfig.appId,
              },
              headers: {
                'content-type': 'application/x-www-form-urlencoded'
              },
            })).data

    const accessToken = response.access_token
    const expiresIn = response.expires_in

    return {
      expiresAt: Date.now() + expiresIn * 1000,
      token: accessToken
    }
  }

  async getToken (): Promise<string> {
    if (this.logtoM2MToken.expiresAt - Date.now() > 60_000) {
      return this.logtoM2MToken.token
    }

    this.logtoM2MToken = await this.fetchToken()

    return this.logtoM2MToken.token
  }

  async updateUser (id: string, data: UpdateUserData): Promise<void> {
    await this.httpService.axiosRef.patch(
            `${this.logtoM2MConfig.endpoint}/api/users/${id}`, {
              name: data.name,
              primaryEmail: data.email,
              username: data.username
            }, {
              headers: {
                authorization: `Bearer ${await this.getToken()}`
              }
            })
  }

  async updateUserSocialIdentity (logtoUserId: string, target: string, targetUserId: string, details: object): Promise<void> {
    await this.httpService.axiosRef.put(
            `${this.logtoM2MConfig.endpoint}/api/users/${logtoUserId}/identities/${target}`, {
              details,
              userId: targetUserId
            }, {
              headers: {
                authorization: `Bearer ${await this.getToken()}`
              }
            })
  }

  async updateUserSuspensionStatus (id: string, isSuspended: boolean): Promise<void> {
    await this.httpService.axiosRef.patch(
            `${this.logtoM2MConfig.endpoint}/api/users/${id}/is-suspended`, {
              isSuspended
            }, {
              headers: {
                authorization: `Bearer ${await this.getToken()}`
              }
            })
  }
}

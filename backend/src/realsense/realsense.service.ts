import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RealSenseService {
  private readonly realSenseApiKey: string
  private readonly realSenseApiUrl: string

  constructor (private configService: ConfigService, private httpService: HttpService) {
    this.realSenseApiUrl = configService.getOrThrow('REALSENSE_API_URL')
    this.realSenseApiKey = configService.getOrThrow('REALSENSE_API_KEY')
  }

  async enrollMember (id: string): Promise<{ status: string; success: boolean, }> {
    const response = await this.httpService.axiosRef.get<{ status: string; success: boolean, }>(
                `${this.realSenseApiUrl}/api/users/${id}`, {
                  headers: {
                    authorization: `Bearer ${this.realSenseApiKey}`
                  },
                  timeout: 15_000 // big timeout for enroll
                })

    return {
      status: response.data.status,
      success: response.data.success
    }
  }

  async getMemberEnrollmentStatus (id: string): Promise<boolean> {
    const response = await this.httpService.axiosRef.get<{ is_enrolled: boolean }>(
                `${this.realSenseApiUrl}/api/users/${id}`, {
                  headers: {
                    authorization: `Bearer ${this.realSenseApiKey}`
                  }
                })

    return response.data.is_enrolled
  }

  async removeMember (id: string): Promise<void> {
    await this.httpService.axiosRef.delete(
                `${this.realSenseApiUrl}/api/users/${id}`, {
                  headers: {
                    authorization: `Bearer ${this.realSenseApiKey}`
                  }
                })
  }
}

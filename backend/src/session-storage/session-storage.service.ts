import { Injectable } from '@nestjs/common'

@Injectable()
export abstract class SessionStorageService {
  abstract add (token: string, userId: string, ttl?: number): Promise<void>
  abstract findByToken (token: string): Promise<null | string>
  abstract revokeAllByUserId (userId: string): Promise<void>
  abstract revokeToken (token: string): Promise<void>
}

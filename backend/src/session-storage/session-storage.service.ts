import {Injectable} from "@nestjs/common";

@Injectable()
export abstract class SessionStorageService {
    abstract add(token: string, userId: string, ttl?: number): Promise<void>;
    abstract findByToken(token: string): Promise<string | null>;
    abstract revokeToken(token: string): Promise<void>;
    abstract revokeAllByUserId(userId: string): Promise<void>;
}
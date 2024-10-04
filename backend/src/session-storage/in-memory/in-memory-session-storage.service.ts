import {SessionStorageService} from "../session-storage.service";
import {Injectable} from "@nestjs/common";

interface SessionData {
    expiresAt?: Date,
    userId: string
}

@Injectable()
export class InMemorySessionStorageService extends SessionStorageService {

    private readonly storage: Record<string, SessionData> = {};
    private readonly userIdMapping: Record<string, Set<string>> = {};

    async add(token: string, userId: string, ttl?: number): Promise<void> {
        this.storage[token] = {
            userId,
            expiresAt: ttl === undefined ? undefined : (new Date(Date.now() + ttl * 1000))
        };
        if (!this.userIdMapping[userId]) {
            this.userIdMapping[userId] = new Set<string>();
        }
        this.userIdMapping[userId].add(token);
    }

    async findByToken(token: string): Promise<string | null> {
        const data = this.storage[token];
        if (!data) {
            return null;
        }
        if (data.expiresAt && data.expiresAt.getTime() < Date.now()) {
            delete this.storage[token];
            this.userIdMapping[data.userId].delete(token);
            return null;
        }
        return data.userId;
    }

    async revokeToken(token: string): Promise<void> {
        const session = this.storage[token];
        if (!session) {
            return;
        }
        this.userIdMapping[session.userId].delete(token);
        delete this.storage[token];
    }

    async revokeAllByUserId(userId: string): Promise<void> {
        for (const session of this.userIdMapping[userId]) {
            delete this.storage[session];
        }
        this.userIdMapping[userId].clear();
    }
}
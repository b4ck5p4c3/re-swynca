import {Injectable} from "@nestjs/common";
import express from "express";
import * as process from "node:process";
import {SessionStorageService} from "../session-storage/session-storage.service";
import {randomBytes} from "crypto";
import {ConfigService} from "@nestjs/config";

export const SESSION_COOKIE_NAME = "session";

@Injectable()
export class AuthService {
    private readonly sessionTtl: number;

    constructor(private sessionStorageService: SessionStorageService, private configService: ConfigService) {
        this.sessionTtl = parseInt(configService.getOrThrow("SESSION_TTL"));
    }

    async createToken(userId: string, ttl?: number): Promise<string> {
        const token = `session_${randomBytes(32).toString("hex")}`;
        await this.sessionStorageService.add(token, userId, ttl ?? this.sessionTtl);
        return token;
    }

    setResponseAuthorizationCookie(response: express.Response, token: string): void {
        response.cookie(SESSION_COOKIE_NAME, token, {
            httpOnly: true, ...(process.env.NODE_ENV === "development"
                ? {sameSite: "none", secure: true} : {secure: true, sameSite: "strict"})
        });
    }

    getHeaderAuthorizationToken(request: express.Request): string | undefined {
        const authorizationHeader = request.headers["authorization"];
        if (!authorizationHeader) {
            return undefined;
        }

        const parts = authorizationHeader.trim().split(" ");
        if (parts.length != 2 || parts[0] != "Bearer") {
            return undefined;
        }

        return parts[1];
    }

    getCookieAuthorizationToken(request: express.Request): string | undefined {
        const cookie = request.cookies[SESSION_COOKIE_NAME];
        if (typeof cookie === "string") {
            return cookie;
        }
        return undefined;
    }

    async validateAndGetUserIdFromToken(token: string): Promise<string | null> {
        return await this.sessionStorageService.findByToken(token);
    }
}
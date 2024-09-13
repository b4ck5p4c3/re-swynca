import {Injectable} from "@nestjs/common";
import express from "express";
import {JwtService} from "@nestjs/jwt";
import * as process from "node:process";

export const SESSION_COOKIE_NAME = "session";

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) {
    }

    async createToken(userId: string, ttl?: number): Promise<string> {
        return await this.jwtService.signAsync({sub: userId}, ttl ? {
            expiresIn: ttl
        } : undefined);
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

    async validateAndGetUserIdFromToken(token: string): Promise<string | undefined> {
        try {
            return (await this.jwtService.verifyAsync<{ sub: string }>(token)).sub;
        } catch (e) {
            return undefined;
        }
    }
}
import {CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable} from "@nestjs/common";
import express from "express";
import {Reflector} from "@nestjs/core";
import {Errors} from "../common/errors";
import {ConfigService} from "@nestjs/config";

const TELEGRAM_BOT_API_SECRET_TOKEN_HEADER = "X-Telegram-Bot-Api-Secret-Token";

@Injectable()
export class TelegramListenerAuthGuard implements CanActivate {

    private readonly token: string;

    constructor(private configService: ConfigService, private reflector: Reflector) {
        this.token = configService.getOrThrow("TELEGRAM_BOT_WEBHOOK_SECRET_TOKEN")
    }

    static getTelegramToken(request: express.Request): string | null {
        if (request.header(TELEGRAM_BOT_API_SECRET_TOKEN_HEADER)) {
            return request.header(TELEGRAM_BOT_API_SECRET_TOKEN_HEADER);
        }
        if (request.header("Authorization")) {
            const authorizationContents = request.header("Authorization");
            const parts = authorizationContents.split(" ");
            if (parts.length !== 2 || parts[0] !== "Basic") {
                return null;
            }
            try {
                const credentials = Buffer.from(parts[1], "base64").toString("utf8");
                return credentials.split(":")[0];
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<express.Request>();
        const token = TelegramListenerAuthGuard.getTelegramToken(request);
        if (token != this.token) {
            throw new HttpException(Errors.NOT_AUTHORIZED, HttpStatus.UNAUTHORIZED);
        }
        return true;
    }
}
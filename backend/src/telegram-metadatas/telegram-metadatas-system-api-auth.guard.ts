import {CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable} from "@nestjs/common";
import express from "express";
import {Reflector} from "@nestjs/core";
import {Errors} from "../common/errors";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class TelegramMetadatasSystemApiAuthGuard implements CanActivate {

    private readonly token: string;

    constructor(private configService: ConfigService, private reflector: Reflector) {
        this.token = configService.getOrThrow("TELEGRAM_METADATAS_SYSTEM_API_SECRET_TOKEN")
    }

    static getTelegramMetadatasSystemAuthToken(request: express.Request): string | null {
        if (request.header("Authorization")) {
            const authorizationContents = request.header("Authorization");
            const parts = authorizationContents.split(" ");
            if (parts.length !== 2 || parts[0] !== "Token") {
                return null;
            }
            return parts[1];
        }
        return null;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<express.Request>();
        const token = TelegramMetadatasSystemApiAuthGuard.getTelegramMetadatasSystemAuthToken(request);
        if (token != this.token) {
            throw new HttpException(Errors.NOT_AUTHORIZED, HttpStatus.UNAUTHORIZED);
        }
        return true;
    }
}
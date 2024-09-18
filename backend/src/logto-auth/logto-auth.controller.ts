import {Controller, Get, Response, Request, Query, HttpException, HttpStatus} from "@nestjs/common";
import {ApiExcludeEndpoint} from "@nestjs/swagger";
import {LogtoAuthService} from "./logto-auth.service";
import express from "express";
import {PATH_METADATA} from "@nestjs/common/constants";
import {ConfigService} from "@nestjs/config";
import {CustomValidationError} from "../common/exceptions";
import {AuthService} from "../auth/auth.service";
import {NoAuth} from "../auth/no-auth.decorator";
import {AuditLogService} from "../audit-log/audit-log.service";

@Controller("logto-auth")
export class LogtoAuthController {

    private readonly redirectUrl: string;
    private readonly baseUrl: string;

    constructor(private logtoAuthService: LogtoAuthService, private configService: ConfigService,
                private authService: AuthService, private auditLogService: AuditLogService) {
        this.baseUrl = this.configService.getOrThrow("BASE_URL");
        const redirectUrl = new URL(this.baseUrl);
        redirectUrl.pathname = `${Reflect.getMetadata(PATH_METADATA, LogtoAuthController)}/${
            Reflect.getMetadata(PATH_METADATA, LogtoAuthController.prototype.callback)}`
        this.redirectUrl = redirectUrl.toString();
    }

    @Get("auth")
    @ApiExcludeEndpoint()
    @NoAuth()
    async auth(@Request() request: express.Request, @Response() response: express.Response): Promise<void> {
        const url = this.logtoAuthService.getAuthUrl(this.redirectUrl);
        response.redirect(url);
    }

    @Get("callback")
    @ApiExcludeEndpoint()
    @NoAuth()
    async callback(@Query("code") code: string, @Response() response: express.Response): Promise<void> {
        if (!code) {
            throw new CustomValidationError("No 'code' query param");
        }

        const logtoId = await this.logtoAuthService.authorizeCode(code, this.redirectUrl);

        const member = await this.logtoAuthService.getMemberFromLogtoId(logtoId);

        if (!member) {
            throw new HttpException(`Member '${logtoId}' not found`, HttpStatus.NOT_FOUND);
        }

        await this.auditLogService.create("logto-authorize", member, undefined);

        const token = await this.authService.createToken(member.id);
        this.authService.setResponseAuthorizationCookie(response, token);
        response.redirect(this.baseUrl);
    }
}
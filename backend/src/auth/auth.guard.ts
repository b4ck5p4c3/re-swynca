import {CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {Observable} from "rxjs";
import {AuthService} from "./auth.service";
import express from "express";
import {Reflector} from "@nestjs/core";
import {NO_AUTH_KEY} from "./no-auth.decorator";
import {Errors} from "../common/errors";

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private authService: AuthService, private reflector: Reflector) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const noAuthRequired = this.reflector.getAllAndOverride<boolean>(NO_AUTH_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (noAuthRequired) {
            return true;
        }

        const request = context.switchToHttp().getRequest<express.Request>();
        const token = this.authService.getHeaderAuthorizationToken(request) ??
            this.authService.getCookieAuthorizationToken(request);
        if (!token) {
            throw new HttpException(Errors.NOT_AUTHORIZED, HttpStatus.UNAUTHORIZED);
        }

        const userId = await this.authService.validateAndGetUserIdFromToken(token);

        if (!userId) {
            throw new HttpException(Errors.NOT_AUTHORIZED, HttpStatus.UNAUTHORIZED);
        }

        request["userId"] = userId;
        return true;
    }
}
import {createParamDecorator, ExecutionContext} from "@nestjs/common";
import express from "express";

export const UserId = createParamDecorator((data: string, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest<express.Request>()["userId"];
});
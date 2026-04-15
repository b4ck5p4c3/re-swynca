import { Controller, Get, HttpException, HttpStatus, Query, Request, Response } from '@nestjs/common'
import { PATH_METADATA } from '@nestjs/common/constants'
import { ConfigService } from '@nestjs/config'
import { ApiExcludeEndpoint } from '@nestjs/swagger'
import express from 'express'

import { AuditLogService } from '../audit-log/audit-log.service'
import { AuthService } from '../auth/auth.service'
import { NoAuth } from '../auth/no-auth.decorator'
import { Errors } from '../common/errors'
import { CustomValidationError } from '../common/exceptions'
import { LogtoAuthService } from './logto-auth.service'

@Controller('logto-auth')
export class LogtoAuthController {
  private readonly baseUrl: string
  private readonly redirectUrl: string

  constructor (private logtoAuthService: LogtoAuthService, private configService: ConfigService,
    private authService: AuthService, private auditLogService: AuditLogService) {
    this.baseUrl = this.configService.getOrThrow('BASE_URL')
    const redirectUrl = new URL(this.baseUrl)
    redirectUrl.pathname = `api/${Reflect.getMetadata(PATH_METADATA, LogtoAuthController)}/${
            Reflect.getMetadata(PATH_METADATA, LogtoAuthController.prototype.callback)}`
    this.redirectUrl = redirectUrl.toString()
  }

  @ApiExcludeEndpoint()
  @Get('auth')
  @NoAuth()
  async auth (@Request() request: express.Request, @Response() response: express.Response): Promise<void> {
    const url = this.logtoAuthService.getAuthUrl(this.redirectUrl)
    response.redirect(url)
  }

  @ApiExcludeEndpoint()
  @Get('callback')
  @NoAuth()
  async callback (@Query('code') code: string, @Response() response: express.Response): Promise<void> {
    if (!code) {
      throw new CustomValidationError("No 'code' query param")
    }

    const logtoId = await this.logtoAuthService.authorizeCode(code, this.redirectUrl)

    const member = await this.logtoAuthService.getMemberFromLogtoId(logtoId)

    if (!member) {
      throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    }

    await this.auditLogService.create('logto-authorize', member)

    const token = await this.authService.createToken(member.id)
    this.authService.setResponseAuthorizationCookie(response, token)
    response.redirect(this.baseUrl)
  }
}

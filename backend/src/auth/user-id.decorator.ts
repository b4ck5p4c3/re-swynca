import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import express from 'express'

export const UserId = createParamDecorator((data: string, context: ExecutionContext) => {
  return context.switchToHttp().getRequest<express.Request>()['userId']
})

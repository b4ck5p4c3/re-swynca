import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common'

import { NoAuth } from '../auth/no-auth.decorator'
import { StatusService } from './status.service'

@Controller()
export class StatusController {
  constructor (private statusService: StatusService) {}

  @Get('health')
  @NoAuth()
  async health (): Promise<string> {
    try {
      await this.statusService.isDatabaseOk()
    } catch {
      throw new HttpException('down', HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return 'ok'
  }
}

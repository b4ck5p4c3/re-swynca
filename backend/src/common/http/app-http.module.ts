import { HttpModule, HttpService } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        maxRedirects: 0,
        timeout: Number.parseInt(configService.getOrThrow('HTTP_TIMEOUT'))
      })
    })
  ]
})
export class AppHttpModule {}

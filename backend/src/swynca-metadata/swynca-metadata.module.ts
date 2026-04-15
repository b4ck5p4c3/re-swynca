import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SwyncaMetadata } from '../common/database/entities/swynca-metadata.entity'
import { SwyncaMetadataService } from './swynca-metadata.service'

@Module({
  exports: [SwyncaMetadataService],
  imports: [TypeOrmModule.forFeature([SwyncaMetadata])],
  providers: [SwyncaMetadataService],
})
export class SwyncaMetadataModule {}

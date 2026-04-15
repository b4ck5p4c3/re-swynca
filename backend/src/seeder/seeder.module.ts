import { Module } from '@nestjs/common'

import { MembersModule } from '../members/members.module'
import { SwyncaMetadataModule } from '../swynca-metadata/swynca-metadata.module'
import { SeederService } from './seeder.service'

@Module({
  imports: [MembersModule, SwyncaMetadataModule],
  providers: [SeederService]
})
export class SeederModule {}

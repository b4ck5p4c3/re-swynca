import { HttpException, HttpStatus } from '@nestjs/common'

import { MembersService } from '../members/members.service'
import { Member } from './database/entities/member.entity'
import { Errors } from './errors'

export async function getValidActor (membersService: MembersService, actorId: string): Promise<Member> {
  const actor = await membersService.findByIdUnfiltered(actorId)
  if (!actor) {
    throw new HttpException(Errors.ACTOR_MEMBER_NOT_FOUND, HttpStatus.INTERNAL_SERVER_ERROR)
  }
  if (actor.status === 'frozen') {
    throw new HttpException(Errors.ACTOR_FROZEN, HttpStatus.INTERNAL_SERVER_ERROR)
  }
  return actor
}

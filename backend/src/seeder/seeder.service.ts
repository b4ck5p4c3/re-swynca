import {Injectable, OnModuleInit} from "@nestjs/common";
import {MembersService, SPACE_MEMBER_ID} from "../members/members.service";
import {MemberStatus} from "../common/database/entities/member.entity";

@Injectable()
export class SeederService implements OnModuleInit {
    constructor(private membersService: MembersService) {
    }

    async onModuleInit(): Promise<void> {
        if (!await this.membersService.existsByIdUnfiltered(SPACE_MEMBER_ID)) {
            await this.membersService.create({
                id: SPACE_MEMBER_ID,
                name: "Space",
                email: "space@space.space",
                status: MemberStatus.FROZEN,
                joinedAt: new Date(0)
            });
        }
    }
}
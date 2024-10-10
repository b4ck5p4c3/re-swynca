import {Injectable, OnModuleInit} from "@nestjs/common";
import {MembersService, SPACE_MEMBER_ID} from "../members/members.service";
import {MemberStatus} from "../common/database/entities/member.entity";
import {LAST_SUBSCRIPTIONS_WITHDRAWAL, SwyncaMetadataService} from "../swynca-metadata/swynca-metadata.service";

@Injectable()
export class SeederService implements OnModuleInit {
    constructor(private membersService: MembersService, private swyncaMetadataService: SwyncaMetadataService) {
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
        if (!await this.swyncaMetadataService.findByKey(LAST_SUBSCRIPTIONS_WITHDRAWAL)) {
            await this.swyncaMetadataService.create({
                key: LAST_SUBSCRIPTIONS_WITHDRAWAL,
                value: "never"
            });
        }
    }
}
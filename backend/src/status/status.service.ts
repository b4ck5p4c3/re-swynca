import {Injectable} from "@nestjs/common";
import {MembersService, SPACE_MEMBER_ID} from "../members/members.service";

@Injectable()
export class StatusService {

    constructor(private membersService: MembersService) {
    }

    async isDatabaseOk(): Promise<void> {
        if (!(await this.membersService.findByIdUnfiltered(SPACE_MEMBER_ID))) {
            throw new Error("SPACE member not found");
        }
    }
}
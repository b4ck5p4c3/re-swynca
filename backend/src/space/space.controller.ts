import {Controller, Get, HttpException, HttpStatus} from "@nestjs/common";
import {ApiCookieAuth, ApiDefaultResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags} from "@nestjs/swagger";
import {MembersService, SPACE_MEMBER_ID} from "../members/members.service";
import {ErrorApiResponse} from "../common/api-responses";
import {MONEY_DECIMAL_PLACES} from "../common/money";
import {Errors} from "../common/errors";

class SpaceBalanceDTO {
    @ApiProperty()
    balance: string;
}

@Controller("space")
@ApiTags("space")
export class SpaceController {

    constructor(private membersService: MembersService) {
    }

    @Get("balance")
    @ApiOperation({
        summary: "Get space balance"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: SpaceBalanceDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async getBalance(): Promise<SpaceBalanceDTO> {
        const spaceMember = await this.membersService.findByIdUnfiltered(SPACE_MEMBER_ID);
        if (!spaceMember) {
            throw new HttpException(Errors.SPACE_MEMBER_NOT_FOUND, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return {
            balance: spaceMember.balance.toFixed(MONEY_DECIMAL_PLACES)
        };
    }
}
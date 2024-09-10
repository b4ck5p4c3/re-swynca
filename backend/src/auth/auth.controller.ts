import {Controller, Get} from "@nestjs/common";
import {UserId} from "./user-id.decorator";
import {ApiCookieAuth, ApiDefaultResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags} from "@nestjs/swagger";
import {ErrorApiResponse} from "../common/api-responses";

class SelfAuthInfoDTO {
    @ApiProperty({format:"uuid"})
    id: string;
}

@Controller("auth")
@ApiTags("auth")
export class AuthController {

    @Get("self")
    @ApiOperation({
        summary: "Get self member auth info"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: SelfAuthInfoDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async getSelf(@UserId() userId: string): Promise<SelfAuthInfoDTO> {
        return {
            id: userId
        };
    }
}
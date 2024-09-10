import {Body, Controller, Delete, Get, Param, Post} from "@nestjs/common";
import {
    ApiBody,
    ApiCookieAuth,
    ApiDefaultResponse, ApiNoContentResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags
} from "@nestjs/swagger";
import {IsNotEmpty, IsUUID} from "class-validator";
import {ErrorApiResponse} from "../common/api-responses";

class MembershipSubscriptionDTO {
    @ApiProperty({format: "uuid"})
    id: string;

    @ApiProperty({format: "uuid"})
    memberId: string;

    @ApiProperty({format: "uuid"})
    membershipId: string;

    @ApiProperty({format: "date-time"})
    subscribedAt: string;

    @ApiProperty({format: "date-time"})
    declinedAt: string;
}

class SubscribeDTO {
    @ApiProperty({format: "uuid"})
    @IsUUID()
    @IsNotEmpty()
    memberId: string;

    @ApiProperty({format: "uuid"})
    @IsUUID()
    @IsNotEmpty()
    membershipId: string;
}

@ApiTags("membership-subscriptions")
@Controller("membership-subscriptions")
export class MembershipSubscriptionsController {
    @Get("member/:memberId")
    @ApiOperation({
        summary: "Get all membership subscriptions for member"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [MembershipSubscriptionDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAllByMemberId(@Param("memberId") memberId: string): Promise<MembershipSubscriptionDTO[]> {
        return [];
    }

    @Get("membership/:membershipId")
    @ApiOperation({
        summary: "Get all membership subscriptions for membership"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: [MembershipSubscriptionDTO]
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async findAllByMembershipId(@Param("membershipId") membershipId: string): Promise<MembershipSubscriptionDTO[]> {
        return [];
    }

    @Post()
    @ApiOperation({
        summary: "Subscribe member to membership"
    })
    @ApiBody({
        type: SubscribeDTO
    })
    @ApiOkResponse({
        description: "Successful response",
        type: MembershipSubscriptionDTO
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async subscribe(@Body() request: SubscribeDTO): Promise<MembershipSubscriptionDTO> {
        throw new Error();
    }

    @Delete(":id")
    @ApiOperation({
        summary: "Unsubscribe member from membership"
    })
    @ApiNoContentResponse({
        description: "Successful response"
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async unsubscribe(@Param() id: string): Promise<void> {

    }
}
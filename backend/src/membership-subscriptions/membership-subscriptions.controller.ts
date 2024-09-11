import {Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post} from "@nestjs/common";
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
import { MembershipSubscriptionsService } from "./membership-subscriptions.service";
import { MembershipSubscription } from "src/common/database/entities/membership-subscription.entity";
import { MembersService } from "src/members/members.service";
import { MembershipsService } from "src/memberships/memberships.service";

class MembershipSubscriptionDTO {
    @ApiProperty({format: "uuid"})
    id: string;

    @ApiProperty({format: "uuid"})
    memberId: string;

    @ApiProperty({format: "uuid"})
    membershipId: string;

    @ApiProperty({format: "date-time"})
    subscribedAt: string;

    @ApiProperty({format: "date-time", required: false})
    declinedAt?: string;
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
    constructor(private membershipSubscriptionsService: MembershipSubscriptionsService, private membersService: MembersService, private membershipService: MembershipsService){
    }

    private static mapToDTO(membershipSubscription: MembershipSubscription): MembershipSubscriptionDTO {
        return {
            id: membershipSubscription.id,
            memberId: membershipSubscription.member.id,
            membershipId: membershipSubscription.membership.id,
            subscribedAt: membershipSubscription.subscribedAt.toISOString(),
            declinedAt: membershipSubscription.declinedAt.toISOString()
        };
    }
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
        return (await this.membershipSubscriptionsService.findAllByMemberId(memberId)).map(MembershipSubscriptionsController.mapToDTO);
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
        return (await this.membershipSubscriptionsService.findAllByMembershipId(membershipId)).map(MembershipSubscriptionsController.mapToDTO);
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
        const {memberId, membershipId} = request;
        const member = await this.membersService.findById(memberId);
        if (!member) {
            throw new HttpException("Member not found", HttpStatus.NOT_FOUND);
        }
        const membership = await this.membershipService.findById(membershipId);
        if (!membership) {
            throw new HttpException("Membership not found", HttpStatus.NOT_FOUND);
        }
        if (await this.membershipSubscriptionsService.checkIfNotDeclinedByMemberIdAndMemberId(memberId, membershipId)) {
            throw new HttpException("Member already subscribed to this membership", HttpStatus.BAD_REQUEST);
        }
 
        return MembershipSubscriptionsController.mapToDTO(await this.membershipSubscriptionsService.subscribe(memberId, membershipId));
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
        const membershipSubscription = await this.membershipSubscriptionsService.findById(id);
        if (!membershipSubscription) {
            throw new HttpException("Membership subscription not found", HttpStatus.NOT_FOUND);
        }
        if (membershipSubscription.declinedAt) {
            throw new HttpException("Membership subscription already declined", HttpStatus.BAD_REQUEST);
        }
        await this.membershipSubscriptionsService.unsubscribe(id);

    }
}
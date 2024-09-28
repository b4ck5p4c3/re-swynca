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
import {MembershipSubscriptionsService} from "./membership-subscriptions.service";
import {MembershipSubscription} from "src/common/database/entities/membership-subscription.entity";
import {MembersService} from "src/members/members.service";
import {MembershipsService} from "src/memberships/memberships.service";
import {AuditLogService} from "../audit-log/audit-log.service";
import {UserId} from "../auth/user-id.decorator";
import {EmptyResponse} from "../common/utils";
import {Errors} from "../common/errors";
import {getValidActor} from "../common/actor-helper";

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
    constructor(private membershipSubscriptionsService: MembershipSubscriptionsService,
                private membersService: MembersService, private membershipService: MembershipsService,
                private auditLogService: AuditLogService) {
    }

    private static mapToDTO(membershipSubscription: MembershipSubscription): MembershipSubscriptionDTO {
        return {
            id: membershipSubscription.id,
            memberId: membershipSubscription.member.id,
            membershipId: membershipSubscription.membership.id,
            subscribedAt: membershipSubscription.subscribedAt.toISOString(),
            declinedAt: membershipSubscription.declinedAt ?
                membershipSubscription.declinedAt.toISOString() : undefined
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
        return (await this.membershipSubscriptionsService.findAllByMemberId(memberId))
            .map(MembershipSubscriptionsController.mapToDTO);
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
    async subscribe(@UserId() actorId: string, @Body() request: SubscribeDTO): Promise<MembershipSubscriptionDTO> {
        const actor = await getValidActor(this.membersService, actorId);
        const {memberId, membershipId} = request;
        const member = await this.membersService.findById(memberId);
        if (!member) {
            throw new HttpException(Errors.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        const membership = await this.membershipService.findById(membershipId);
        if (!membership) {
            throw new HttpException(Errors.MEMBERSHIP_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (!membership.active) {
            throw new HttpException(Errors.MEMBERSHIP_FROZEN, HttpStatus.BAD_REQUEST);
        }

        if (await this.membershipSubscriptionsService.existsByMemberAndMembershipWithNotDeclined(member, membership)) {
            throw new HttpException(Errors.MEMBER_ALREADY_SUBSCRIBED, HttpStatus.BAD_REQUEST);
        }

        const membershipSubscription = await this.membershipSubscriptionsService.create(member, membership);

        await this.auditLogService.create("subscribe-member", actor, {
            memberId: member.id,
            membershipId: membership.id,
            membershipSubscriptionId: membershipSubscription.id
        });

        return MembershipSubscriptionsController.mapToDTO(membershipSubscription);
    }

    @Delete(":id")
    @ApiOperation({
        summary: "Unsubscribe member from membership"
    })
    @ApiOkResponse({
        description: "Successful response",
        type: EmptyResponse
    })
    @ApiCookieAuth()
    @ApiDefaultResponse({
        description: "Erroneous response",
        type: ErrorApiResponse
    })
    async unsubscribe(@UserId() actorId: string, @Param("id") id: string): Promise<EmptyResponse> {
        const actor = await getValidActor(this.membersService, actorId);
        const membershipSubscription = await this.membershipSubscriptionsService.findById(id);
        if (!membershipSubscription) {
            throw new HttpException(Errors.MEMBERSHIP_SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (membershipSubscription.declinedAt) {
            throw new HttpException(Errors.MEMBERSHIP_SUBSCRIPTION_ALREADY_DECLINED, HttpStatus.BAD_REQUEST);
        }
        membershipSubscription.declinedAt = new Date();
        await this.membershipSubscriptionsService.update(membershipSubscription);

        await this.auditLogService.create("unsubscribe-member", actor, {
            membershipSubscriptionId: membershipSubscription.id
        });
        return {};
    }
}
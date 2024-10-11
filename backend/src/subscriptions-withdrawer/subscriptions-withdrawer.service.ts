import {Injectable} from "@nestjs/common";
import {
    LAST_SUBSCRIPTIONS_WITHDRAWAL_METADATA_KEY,
    SwyncaMetadataService
} from "../swynca-metadata/swynca-metadata.service";
import {Cron, CronExpression} from "@nestjs/schedule";
import {MembershipSubscriptionsService} from "../membership-subscriptions/membership-subscriptions.service";
import {MemberTransactionsService} from "../member-transactions/member-transactions.service";
import {AuditLogService} from "../audit-log/audit-log.service";
import {MembersService, SPACE_MEMBER_ID} from "../members/members.service";
import {TransactionType} from "../common/database/entities/common";
import {MemberTransactionWithdrawal} from "../common/database/entities/member-transaction.entity";
import {MONEY_DECIMAL_PLACES} from "../common/money";

@Injectable()
export class SubscriptionsWithdrawerService {
    private withdrawing: boolean = false;

    constructor(private swyncaMetadataService: SwyncaMetadataService,
                private membershipSubscriptionsService: MembershipSubscriptionsService,
                private memberTransactionsService: MemberTransactionsService,
                private membersService: MembersService,
                private auditLogService: AuditLogService) {
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async withdrawSubscriptions(): Promise<void> {
        if (this.withdrawing) {
            return;
        }
        this.withdrawing = true;
        try {
            await this.swyncaMetadataService.transaction(async manager => {
                const lastSubscriptionsWithdrawal = await this.swyncaMetadataService
                    .for(manager).findByKeyLocked(LAST_SUBSCRIPTIONS_WITHDRAWAL_METADATA_KEY);
                const currentTime = new Date();
                const currentAttemptTime = new Date(Date.UTC(currentTime.getUTCFullYear(), currentTime.getUTCMonth())).toISOString();

                if (lastSubscriptionsWithdrawal.value === currentAttemptTime) {
                    return;
                }

                const spaceMember = await this.membersService.for(manager).findByIdUnfiltered(SPACE_MEMBER_ID);
                if (!spaceMember) {
                    return;
                }

                const activeMembershipSubscriptions =
                    await this.membershipSubscriptionsService.for(manager).findAllActive();

                for (const subscription of activeMembershipSubscriptions) {
                    const memberTransaction = await this.memberTransactionsService.for(manager).create({
                        type: TransactionType.WITHDRAWAL,
                        amount: subscription.membership.amount,
                        date: currentTime,
                        comment: subscription.membership.title,
                        target: MemberTransactionWithdrawal.MEMBERSHIP,
                        subject: subscription.member,
                        actor: spaceMember,
                        createdAt: new Date()
                    });
                    await this.membersService.for(manager).atomicallyIncrementBalance(subscription.member, subscription.membership.amount.negated());
                    await this.auditLogService.for(manager).create("create-member-transaction", spaceMember, {
                        id: memberTransaction.id,
                        type: memberTransaction.type,
                        amount: memberTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
                        comment: memberTransaction.comment,
                        date: memberTransaction.date.toISOString(),
                        source: memberTransaction.source,
                        target: memberTransaction.target,
                        subjectId: subscription.member.id
                    });
                }

                lastSubscriptionsWithdrawal.value = currentAttemptTime;
                await this.swyncaMetadataService.for(manager).update(lastSubscriptionsWithdrawal);

                await this.auditLogService.for(manager).create("subscriptions-withdrawal", spaceMember, undefined);
            });
        } finally {
            this.withdrawing = false;
        }
    }
}
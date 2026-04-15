import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { AuditLogService } from '../audit-log/audit-log.service'
import { TransactionType } from '../common/database/entities/common'
import { MemberTransactionWithdrawal } from '../common/database/entities/member-transaction.entity'
import { MONEY_DECIMAL_PLACES } from '../common/money'
import { MemberTransactionsService } from '../member-transactions/member-transactions.service'
import { MembersService, SPACE_MEMBER_ID } from '../members/members.service'
import { MembershipSubscriptionsService } from '../membership-subscriptions/membership-subscriptions.service'
import {
  LAST_SUBSCRIPTIONS_WITHDRAWAL_METADATA_KEY,
  SwyncaMetadataService
} from '../swynca-metadata/swynca-metadata.service'

@Injectable()
export class SubscriptionsWithdrawerService {
  private withdrawing: boolean = false

  constructor (private swyncaMetadataService: SwyncaMetadataService,
    private membershipSubscriptionsService: MembershipSubscriptionsService,
    private memberTransactionsService: MemberTransactionsService,
    private membersService: MembersService,
    private auditLogService: AuditLogService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async withdrawSubscriptions (): Promise<void> {
    if (this.withdrawing) {
      return
    }
    this.withdrawing = true
    try {
      await this.swyncaMetadataService.transaction(async manager => {
        const lastSubscriptionsWithdrawal = await this.swyncaMetadataService
          .for(manager).findByKeyLocked(LAST_SUBSCRIPTIONS_WITHDRAWAL_METADATA_KEY)
        const currentTime = new Date()
        const currentAttemptTime = new Date(Date.UTC(currentTime.getUTCFullYear(), currentTime.getUTCMonth())).toISOString()

        if (lastSubscriptionsWithdrawal.value === currentAttemptTime) {
          return
        }

        const spaceMember = await this.membersService.for(manager).findByIdUnfiltered(SPACE_MEMBER_ID)
        if (!spaceMember) {
          return
        }

        const activeMembershipSubscriptions =
                    await this.membershipSubscriptionsService.for(manager).findAllActive()

        for (const subscription of activeMembershipSubscriptions) {
          const memberTransaction = await this.memberTransactionsService.for(manager).create({
            actor: spaceMember,
            amount: subscription.membership.amount,
            comment: subscription.membership.title,
            createdAt: new Date(),
            date: currentTime,
            subject: subscription.member,
            target: MemberTransactionWithdrawal.MEMBERSHIP,
            type: TransactionType.WITHDRAWAL
          })
          await this.membersService.for(manager).atomicallyIncrementBalance(subscription.member, subscription.membership.amount.negated())
          await this.auditLogService.for(manager).create('create-member-transaction', spaceMember, {
            amount: memberTransaction.amount.toFixed(MONEY_DECIMAL_PLACES),
            comment: memberTransaction.comment,
            date: memberTransaction.date.toISOString(),
            id: memberTransaction.id,
            source: memberTransaction.source,
            subjectId: subscription.member.id,
            target: memberTransaction.target,
            type: memberTransaction.type
          })
        }

        lastSubscriptionsWithdrawal.value = currentAttemptTime
        await this.swyncaMetadataService.for(manager).update(lastSubscriptionsWithdrawal)

        await this.auditLogService.for(manager).create('subscriptions-withdrawal', spaceMember)
      })
    } finally {
      this.withdrawing = false
    }
  }
}

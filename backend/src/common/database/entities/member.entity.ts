import {Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {LogtoBinding} from "./logto-binding.entity";
import {ACSKey} from "./acs-key.entity";
import {SpaceTransaction} from "./space-transaction.entity";
import {MemberTransaction} from "./member-transaction.entity";
import {MembershipSubscription} from "./membership-subscription.entity";
import {TelegramMetadata} from "./telegram-metadata.entity";
import {GitHubMetadata} from "./github-metadata.entity";
import {MONEY_DECIMAL_PLACES, MONEY_PRECISION} from "../../money";
import {DecimalTransformer} from "../transformers/decimal.transformer";
import Decimal from "decimal.js";
import {AuditLog} from "./audit-log.entity";
import {ApiKey} from "./api-key.entity";

export enum MemberStatus {
    ACTIVE = "active",
    FROZEN = "frozen"
}

@Entity()
export class Member {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("text")
    name: string;

    @Column("text", {unique: true})
    email: string;

    @Column({type: "enum", enum: MemberStatus, default: MemberStatus.ACTIVE})
    status: MemberStatus;

    @Column("timestamp without time zone")
    joinedAt: Date;

    @OneToMany(() => ACSKey, acsKey => acsKey.member)
    acsKeys: ACSKey[];

    @OneToMany(() => SpaceTransaction, spaceTransaction => spaceTransaction.actor)
    actedSpaceTransactions: SpaceTransaction[];

    @OneToMany(() => MemberTransaction, memberTransaction => memberTransaction.actor)
    actedMemberTransactions: MemberTransaction[];

    @OneToMany(() => MemberTransaction, memberTransaction => memberTransaction.subject)
    subjectedMemberTransactions: MemberTransaction[];

    @OneToOne(() => LogtoBinding, externalAuthenticationLogto =>
        externalAuthenticationLogto.member, {nullable: true})
    externalAuthenticationLogto?: LogtoBinding;

    @Column("decimal", {precision: MONEY_PRECISION, scale: MONEY_DECIMAL_PLACES, default: "0.0", transformer: new DecimalTransformer()})
    balance: Decimal;

    @OneToMany(() => MembershipSubscription, membershipSubscription => membershipSubscription.member)
    subscriptions: MembershipSubscription[];

    @OneToOne(() => TelegramMetadata, telegramMetadata => telegramMetadata.member, {nullable: true})
    telegramMetadata?: TelegramMetadata;

    @OneToOne(() => GitHubMetadata, githubMetadata => githubMetadata.member, {nullable: true})
    githubMetadata?: GitHubMetadata;

    @OneToMany(() => AuditLog, auditLog => auditLog.actor)
    auditLogs: AuditLog[];

    @OneToMany(() => ApiKey, apiKey => apiKey.member)
    apiKeys: ApiKey[];
}
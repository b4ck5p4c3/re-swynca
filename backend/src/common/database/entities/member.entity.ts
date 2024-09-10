import {Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {ExternalAuthenticationLogto} from "./external-authentication-logto.entity";
import {ACSKey} from "./acs-key.entity";
import {Balance} from "./balance.entity";
import {SpaceTransaction} from "./space-transaction.entity";
import {MemberTransaction} from "./member-transaction.entity";
import {MembershipSubscription} from "./membership-subscription.entity";
import {TelegramMetadata} from "./telegram-metadata.entity";
import {GitHubMetadata} from "./github-metadata.entity";

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

    @OneToOne(() => ExternalAuthenticationLogto, externalAuthenticationLogto =>
        externalAuthenticationLogto.member, {nullable: true})
    externalAuthenticationLogto?: ExternalAuthenticationLogto;

    @OneToOne(() => Balance, balance =>
        balance.member)
    balance: Balance;

    @OneToMany(() => MembershipSubscription, membershipSubscription => membershipSubscription.member)
    subscriptions: MembershipSubscription[];

    @OneToOne(() => TelegramMetadata, telegramMetadata => telegramMetadata.member, {nullable: true})
    telegramMetadata?: TelegramMetadata;

    @OneToOne(() => GitHubMetadata, githubMetadata => githubMetadata.member, {nullable: true})
    githubMetadata?: GitHubMetadata;
}
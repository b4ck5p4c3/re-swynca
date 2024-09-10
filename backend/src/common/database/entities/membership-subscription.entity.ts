import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Membership} from "./membership.entity";
import {Member} from "./member.entity";

@Entity()
export class MembershipSubscription {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("timestamp without time zone")
    subscribedAt: Date;

    @Column("timestamp without time zone", {nullable: true})
    declinedAt: Date;

    @ManyToOne(() => Membership, membership => membership.subscriptions)
    membership: Membership;

    @ManyToOne(() => Member, member => member.subscriptions)
    member: Member;
}
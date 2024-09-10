import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import Decimal from "decimal.js";
import {MembershipSubscription} from "./membership-subscription.entity";
import {DecimalTransformer} from "../transformers/decimal.transformer";
import {MONEY_DECIMAL_PLACES, MONEY_PRECISION} from "../../money";

@Entity()
export class Membership {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("text")
    title: string;

    @Column("decimal", {precision: MONEY_PRECISION, scale: MONEY_DECIMAL_PLACES, default: "0.0", transformer: new DecimalTransformer()})
    amount: Decimal;

    @Column("boolean")
    active: boolean;

    @OneToMany(() => MembershipSubscription, membershipSubscription => membershipSubscription.membership)
    subscriptions: MembershipSubscription[];
}
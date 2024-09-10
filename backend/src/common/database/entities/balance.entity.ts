import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import Decimal from "decimal.js";
import {DecimalTransformer} from "../transformers/decimal.transformer";
import {Member} from "./member.entity";
import {MONEY_DECIMAL_PLACES, MONEY_PRECISION} from "../../money";

@Entity()
export class Balance {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("decimal", {precision: MONEY_PRECISION, scale: MONEY_DECIMAL_PLACES, default: "0.0", transformer: new DecimalTransformer()})
    balance: Decimal;

    @OneToOne(() => Member, member => member.balance)
    @JoinColumn()
    member: Member;
}
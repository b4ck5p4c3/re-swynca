import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {TransactionType} from "./common";
import {DecimalTransformer} from "../transformers/decimal.transformer";
import Decimal from "decimal.js";
import {Member} from "./member.entity";
import {MONEY_DECIMAL_PLACES, MONEY_PRECISION} from "../../money";

export enum MemberTransactionWithdrawal {
    MAGIC = "magic",
    MEMBERSHIP = "membership"
}

export enum MemberTransactionDeposit {
    MAGIC = "magic",
    DONATE = "donate",
    TOPUP = "topup"
}

@Entity()
export class MemberTransaction {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "enum",
        enum: TransactionType
    })
    type: TransactionType;

    @Column("decimal", {precision: MONEY_PRECISION, scale: MONEY_DECIMAL_PLACES, default: "0.0", transformer: new DecimalTransformer()})
    amount: Decimal;

    @Column("text", { nullable: true })
    comment?: string;

    @Column("timestamp without time zone")
    date: Date;

    @Column({
        type: "enum",
        enum: MemberTransactionDeposit,
        nullable: true,
    })
    source?: MemberTransactionDeposit;

    @Column({
        type: "enum",
        enum: MemberTransactionWithdrawal,
        nullable: true,
    })
    target?: MemberTransactionWithdrawal;

    @ManyToOne(() => Member, member => member.actedMemberTransactions)
    actor: Member;

    @ManyToOne(() => Member, member => member.subjectedMemberTransactions)
    subject: Member;

    @CreateDateColumn({type: "timestamp without time zone"})
    createdAt: Date;
}
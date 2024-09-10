import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {TransactionType} from "./common";
import Decimal from "decimal.js";
import {Member} from "./member.entity";
import {DecimalTransformer} from "../transformers/decimal.transformer";
import {MONEY_DECIMAL_PLACES, MONEY_PRECISION} from "../../money";

export enum SpaceTransactionWithdrawal {
    MAGIC = "magic",
    BASIC = "basic",
    PURCHASES = "purchases"
}

export enum SpaceTransactionDeposit {
    MAGIC = "magic",
    DONATE = "donate",
    TOPUP = "topup"
}

@Entity()
export class SpaceTransaction {
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
        enum: SpaceTransactionDeposit,
        nullable: true,
    })
    source?: SpaceTransactionDeposit;

    @Column({
        type: "enum",
        enum: SpaceTransactionWithdrawal,
        nullable: true,
    })
    target?: SpaceTransactionWithdrawal;

    @ManyToOne(() => Member, member => member.actedSpaceTransactions)
    actor: Member;

    @CreateDateColumn({type: "timestamp without time zone"})
    createdAt: Date;
}
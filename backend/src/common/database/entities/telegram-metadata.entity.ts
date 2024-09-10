import {Column, Entity, JoinColumn, OneToOne, PrimaryColumn} from "typeorm";
import {Member} from "./member.entity";

@Entity()
export class TelegramMetadata {
    @PrimaryColumn("text")
    telegramId: string;

    @Column("text", { nullable: true })
    telegramName?: string;

    @OneToOne(() => Member, member => member.telegramMetadata)
    @JoinColumn()
    member: Member;
}
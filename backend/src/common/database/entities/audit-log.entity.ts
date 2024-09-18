import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Member} from "./member.entity";

@Entity()
export class AuditLog {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("timestamp without time zone")
    createdAt: Date;

    @Column("text")
    action: string;

    @Column("jsonb", { nullable: true })
    metadata?: object;

    @ManyToOne(() => Member, member => member.auditLogs)
    actor: Member;

    @Column("text", { nullable: true })
    nearTransactionHash: string;
}
import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Member} from "./member.entity";

@Entity()
export class MAC {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("text")
    mac: string;

    @Column("text")
    description: string;

    @ManyToOne(() => Member, member => member.macs)
    member: Member;
}
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Member} from "./member.entity";

@Entity()
export class ApiKey {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("text", {unique: true})
    key: string;

    @ManyToOne(() => Member, member => member.apiKeys)
    member: Member;
}
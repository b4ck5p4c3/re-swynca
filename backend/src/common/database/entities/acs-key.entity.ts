import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Member} from "./member.entity";

export enum ACSKeyType {
    PAN = "pan",
    UID = "uid"
}

@Entity()
export class ACSKey {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "enum",
        enum: ACSKeyType
    })
    type: ACSKeyType;

    @Column("text", { unique: true })
    key: string;

    @Column("text")
    name: string;

    @ManyToOne(() => Member, member => member.acsKeys)
    member: Member;
}
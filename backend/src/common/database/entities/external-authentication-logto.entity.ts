import {Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn} from "typeorm";
import {Member} from "./member.entity";

@Entity()
export class ExternalAuthenticationLogto {
    @PrimaryColumn("text")
    logtoId: string;

    @OneToOne(() => Member, member => member.externalAuthenticationLogto)
    @JoinColumn()
    member: Member;
}
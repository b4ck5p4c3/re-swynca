import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity()
export class SwyncaMetadata {
    @PrimaryColumn("text")
    key: string;

    @Column("text")
    value: string;
}
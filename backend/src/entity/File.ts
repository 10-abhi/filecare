import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class File {
    @PrimaryColumn()
    fileid: string

    @Column()
    name: string

    @ManyToOne(() => User, (user) => user.files, { onDelete: "CASCADE" })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updateAt: Date;

    @Column({
        type: "timestamp",
        nullable: true
    })
    lastViewedTime: Date;

    @Column()
    size : string

    @Column()
    mimeType : string

    @Column()
    lastModifiedTime : Date;

}
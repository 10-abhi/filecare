import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class File {
    @PrimaryGeneratedColumn()
    fileid: string

    @Column()
    name: string

    @ManyToOne(() => User, (user) => user.files, { onDelete: "CASCADE" })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({
        type: "timestamp",
        nullable: true
    })
    lastViewedAt: Date;
}
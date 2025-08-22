import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@Entity()
@Index(['userId'])
@Index(["lastViewedTime"])
@Index(["lastModifiedTime"])
@Index(["userId", "lastViewedTime"])
export class File {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ unique: true })
    fileid: string

    @Column()
    name: string

    @ManyToOne(() => User, (user) => user.files, { onDelete: "CASCADE" })
    @JoinColumn({name:"userId"})
    user: User;

    @Column()
    userId: string

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({type:"timestamp" , nullable : true})
    lastViewedTime: Date;

    @Column()
    size: string

    @Column()
    mimeType: string

    @Column({type : "timestamp" , nullable:true})
    lastModifiedTime: Date;

    @Column({ default: false })
    isOwnedByUser: boolean;

    @Column({ default: false })
    canDelete: boolean;

    @Column({ default: false })
    canTrash: boolean;

    @Column({ nullable: true })
    ownerEmail: string;

    @Column({ default: false })
    isShared: boolean;

}
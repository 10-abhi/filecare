import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { File } from "./File"

@Entity()
export class User {

    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ nullable: true })
    name: string

    @Column({ unique: true, nullable: true })
    email: string

    @Column({ unique: true })
    googleUserID: string

    @Column()
    accessToken: string;

    @Column()
    refreshToken: string;

    @Column({  type:'timestamp' ,nullable:true})
    accessTokenExpiresAt : Date

    @Column()
    sessionToken: string;

    @OneToMany(() => File, (file) => file.user)
    files: File[];

    @Column({ type: "timestamp", nullable: true })
    lastScanTime: Date

    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
}

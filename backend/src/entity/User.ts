import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { File } from "./File"

@Entity()
export class User {

    @PrimaryGeneratedColumn("uuid")
    id: number

    @Column()
    name: string

    @Column({unique:true})
    email:string

    @Column()
    googleUserID : string

    @Column()
    accessToken: string;

    @Column()
    refreshToken: string;

    @Column()
    sessionToken : string;

    @OneToMany(()=>File , (file)=>file.user)
    files : File[];

}

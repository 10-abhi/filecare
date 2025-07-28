import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { File } from "./entity/File"
// import * as dotenv from "dotenv"

// dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: true,
    logging: true,
    entities: [User , File],
    migrations: [],
    subscribers: [],
})

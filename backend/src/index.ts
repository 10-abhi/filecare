import { AppDataSource } from "./data-source"
import express from "express"
import cors from "cors"
import auther from "./routes/auth"
import router from "./routes/drive"
import cookieParser from "cookie-parser"

const app = express();
app.use(cors(
    {
        origin:"http://localhost:3000"
    }
));
app.use(cookieParser());
app.use(express.json());

AppDataSource.initialize()
.then(()=>{
    console.log("DB connected");
    app.use("/auth", auther);
    app.use("/drive" , router);

    app.listen(4000 , ()=>{
        console.log("Server running at http://localhost:4000");
    })
})
.catch((error)=>{
    console.log("Error connecting to the db", error);
});

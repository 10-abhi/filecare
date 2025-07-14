import express from "express";
import dotenv from"dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("API is running");
})
import auther from "./routes/auth";
app.use("/auth" , auther);

const PORT = process.env.PORT || 4000;
app.listen(PORT , ()=>{
    console.log(`API running at http://localhost:${PORT}`)
})
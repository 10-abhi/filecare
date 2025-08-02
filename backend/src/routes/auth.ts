import { Router } from "express";
import { google } from "googleapis";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { File } from "../entity/File";
import { v4 as uuidv4 } from "uuid";

const auther = Router();

export const oauth2client = new google.auth.OAuth2({
    client_id: process.env.google_client_id,
    client_secret: process.env.google_client_secret,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
})
export const userRepo = AppDataSource.getRepository(User);
export const fileRepo = AppDataSource.getRepository(File);
//redirect to google login
auther.get("/google", (req, res) => {
    const scopes = [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const authUrl = oauth2client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent",
    });
    res.redirect(authUrl);
});

//callback
auther.get("/google/callback", async (req, res) => {
    try {
        const code = req.query.code as string;
        const { tokens } = await oauth2client.getToken(code);
        oauth2client.setCredentials(tokens);
        const oauth2 = google.oauth2({
            auth: oauth2client, version: "v2"
        });
        const { data: userinfo } = await oauth2.userinfo.get();
        if (!userinfo.email || !userinfo.name || !userinfo.id || !tokens.access_token || !tokens.refresh_token) {
            return res.status(400).json({
                error: "Missing Google User ID || access token || refresh token"
            })
        }
        const sessionToken = uuidv4();
        await userRepo.upsert({
            googleUserID: userinfo.id,
            name: userinfo.name,
            email: userinfo.email,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            sessionToken:sessionToken,
            accessTokenExpiresAt : new Date(tokens.expiry_date||Date.now())
        },
            ['googleUserID']
        );

        // await prismaDB.user.upsert({
        //     where: {
        //         googleUserID: userinfo.id,
        //     },
        //     update: {
        //         name: userinfo.name,
        //         email: userinfo.email,
        //         accessToken: tokens.access_token,
        //         refreshToken: tokens.refresh_token
        //     },
        //     create: {
        //         googleUserID: userinfo.id,
        //         name: userinfo.id,
        //         email: userinfo.email,
        //         accessToken: tokens.access_token!,
        //         refreshToken: tokens.refresh_token!,
        //     }
        // });

        // console.log("user info", userinfo);
        // console.log("Tokens", tokens);
        // After successful authentication and getting user info:
        res.cookie("user_session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24,
            // domain:process.env.COOKIE_DOMAIN (if frontend and backend are on diff subdomains)
        })
        return res.redirect("http://localhost:3000/auth/success");
    } catch (error) {
        console.error("Oauth error : ", error);
        res.status(500).send("Google authentication failed");
    }
});

    auther.get("/me" , async(req,res)=>{
        const sessionToken = req.cookies["user_session"];
        if(!sessionToken)return res.status(401).json({
            error : "Unauthenticated"
        })
        const user = await userRepo.findOne({where : {sessionToken}});

        if(!user)return res.status(401).json({
            error : "Invalid Session"
        })
        return res.json({
            id : user.id,
            name : user.name,
            email: user.email,
            googleUserID : user.googleUserID
        });
    })

export default auther;
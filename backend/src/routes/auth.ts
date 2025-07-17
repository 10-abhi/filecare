import { Router } from "express";
import { google } from "googleapis";
import { prismaDB } from "../lib/prisma";

const auther = Router();

export const oath2client = new google.auth.OAuth2({
    client_id: process.env.google_client_id,
    client_secret: process.env.google_client_secret,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
})

//redirect to google login
auther.get("/google", (req, res) => {
    const scopes = [
        "https://www.googleapis.com/auth/drive.metadata.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const authUrl = oath2client.generateAuthUrl({
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
        const { tokens } = await oath2client.getToken(code);
        oath2client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: oath2client, version: "v2"
        });
        const { data: userinfo } = await oauth2.userinfo.get();
    if(!userinfo.id || !tokens.access_token  || !tokens.refresh_token){
          return res.status(400).json({
            error : "Missing Google User ID || access token || refresh token"
          })
       }
        await prismaDB.user.upsert({
            where: {
                googleUserID: userinfo.id,
            },
            update: {
                name: userinfo.name,
                email: userinfo.email,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token
            },
            create: {
                googleUserID: userinfo.id,
                name: userinfo.id,
                email: userinfo.email,
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token!,
            }
        });
         
        // console.log("user info", userinfo);
        // console.log("Tokens", tokens);
        res.send("Google Drive connected succ!");
    } catch (error) {
      console.error("Oauth error : ", error);
      res.status(500).send("Google authentication failed");
    }
});

export default auther;
import { Router } from "express";
import { google } from "googleapis";
import { prismaDB } from "../lib/prisma";

const auther = Router();

const oath2client = new google.auth.OAuth2({
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

export default auther;
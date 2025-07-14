import { Router } from "express";
import { prismaDB } from "../lib/prisma";
import { google } from "googleapis";

const router = Router();

router.get("/scan", async (req, res) => {
    try {
        const email = req.query.email as string;
        if (!email) {
            return res.status(400).json({
                "message": "email not provided"
            })
        }

        const user = await prismaDB.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user)
            return res.status(404).json({
                error: "User Not Found"
            })
        const oAuth2Client = new google.auth.OAuth2();
        oAuth2Client.setCredentials({
            access_token: user.accessToken,
            refresh_token: user.refreshToken
        });
        const drive = google.drive({ version: "v3", auth: oAuth2Client });
        const response = await drive.files.list({
            pageSize: 100,
            fields: "files(id, name, mimeType, modifiedTime, viewedByMeTime, size)",
            q: "trashed = false",
        });
        const files = response.data.files ?? [];
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const oldFiles = files.filter(file => {
            return file.modifiedTime && new Date(file.modifiedTime) < thirtyDaysAgo
        });

        for (const file of files) {
            if (file) {
                await prismaDB.file.upsert({
                    where: { fileid: file.id! },
                    update: {},
                    create: {
                        fileid: file.id!,
                        name: file.name || "Untitled",
                        size: file.size?.toString() || "0",
                        mimeType: file.mimeType || "unknown",
                        lastModifiedTime: file.modifiedTime || "",
                        lastViewedTime: file.viewedByMeTime || "",
                        userId: user.id
                    }
                })
            }
        }
        return res.json({
            message : "Scan completed" , total : oldFiles.length
        });
    } catch (error) {
        return res.status(500).json({error : "Drive scan Failed"});
    }
})

export default router;
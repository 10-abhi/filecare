import { Router } from "express";
import { prismaDB } from "../lib/prisma";
import { google } from "googleapis";
import { file } from "googleapis/build/src/apis/file";
import { error } from "console";
import { ids } from "googleapis/build/src/apis/ids";

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
            message: "Scan completed", total: oldFiles.length
        });
    } catch (error) {
        return res.status(500).json({ error: "Drive scan Failed" });
    }
})

router.get("/unused", async (req, res) => {
    const email = req.query.email as string;
    const user = await prismaDB.user.findUnique({
        where: {
            email: email
        }
    })
    if (!user) return res.status(404).json({
        error: "User not found "
    });
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    const unusedFiles = await prismaDB.file.findMany({
        where: {
            userId: user.id,
            lastViewedTime:{
                lt: cutoffDate.toISOString()
            },
        },
    });
    return res.json({unusedFiles});
});

router.delete("/delete", async(req,res)=>{
    try {
        const {email , fileIds} = req.body;
        if(!email || !fileIds || !Array.isArray(fileIds)){
         return res.json({
            error : "No proper data provided"
         })
        }
        const user = await prismaDB.user.findUnique({
            where:{email},
        })
        const oath2client = new google.auth.OAuth2();
        oath2client.setCredentials({
            refresh_token:user?.refreshToken,
            access_token : user?.accessToken
        });
        const drive = google.drive({
            version:"v2",
            auth:oath2client
        })
        const deletedFiles : string[] = [];
        const failedFiles : string[] = [];
        for(const fileId of fileIds){
            try{
                await drive.files.delete({fileId});
                deletedFiles.push(fileId);

                await prismaDB.file.delete({
                    where : {fileid : fileId}
                })
            }catch( error : any){
                console.error(`Failed to delete ${fileId}:`, error.message);
            }
        }

    } catch (error) {
        
    }
})

export default router;
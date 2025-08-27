import { Router } from "express";
import { google } from "googleapis";
import { oauth2client } from "./auth";
import { LessThan } from "typeorm";
import { fileRepo , userRepo } from "./auth";

const router = Router();

router.get("/scan", async (req, res) => {
    try {
        const email = req.query.email as string;
        if (!email) {
            return res.status(400).json({
                "message": "email not provided"
            });
        }

        const user = await userRepo.findOne({
            where: { email }
        });

        if (!user)
            return res.status(404).json({
                error: "User Not Found"
            });

        oauth2client.setCredentials({
            access_token: user.accessToken,
            refresh_token: user.refreshToken
        });

        const drive = google.drive({ version: "v3", auth: oauth2client });
        const response = await drive.files.list({
            pageSize: 100,
            fields: "files(id, name, mimeType, modifiedTime, viewedByMeTime, size , owners(emailAddress) , permissions)",
            q: "trashed = false",
        });

        const files = response.data.files ?? [];
        // console.log("All files in scan :", files);

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const oldFiles = files.filter(file => {
            return file.modifiedTime && new Date(file.modifiedTime) < thirtyDaysAgo;
        });
        // console.log("Old files in scan:", oldFiles);

        for (const file of files) {
            if (file) {
                const ownerEmail = file.owners?.[0]?.emailAddress || null;
                const isOwnedByUser = ownerEmail === email;
                let canDelete = false;
                let canTrash = false;
                let isShared = false;
                if(file.permissions){
                    for(const perm of file.permissions){
                        if(perm.role !== "owner")isShared = true;
                        if(perm?.permissionDetails){
                            canDelete = perm.permissionDetails.some((p:any)=>p?.inheritedFrom == null && p?.role == "owner");
                        }
                    }
                }
                await fileRepo.upsert(
                    {
                        fileid: file.id!,
                        name: file.name || "Untitled",
                        size: file.size?.toString() || "0",
                        mimeType: file.mimeType || "unknown",
                        lastModifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
                        lastViewedTime: file.viewedByMeTime ? new Date(file.viewedByMeTime) : null,
                        user: user,
                        userId: user.id,
                        ownerEmail ,
                        isOwnedByUser,
                        canDelete,
                        canTrash,
                        isShared
                    },
                    ['fileid']
                );
            }
        }

        user.lastScanTime = new Date();
        await userRepo.save(user);

        return res.json({
            message: "Scan completed",
            total: oldFiles.length
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Drive scan Failed" });
    }
});

router.get("/unused", async (req, res) => {
    const email = req.query.email as string;

    const user = await userRepo.findOne({ where: { email } });

    if (!user) return res.status(404).json({ error: "User not found " });

    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

    const unusedFiles = await fileRepo.find({
        where: [
            { userId: user.id, lastViewedTime: LessThan(cutoffDate) },
            { userId: user.id, lastViewedTime: null }
        ]
    });
    // console.log("Unused files:", unusedFiles);

    return res.json({ unusedFiles });
});

router.delete("/delete", async (req, res) => {
    try {
        const { email, fileIds } = req.body;

        if (!email || !fileIds || !Array.isArray(fileIds)) {
            return res.json({ error: "No proper data provided" });
        }

        const user = await userRepo.findOne({ where: { email } });

        if (!user) {
            return res.json({ message: "User Not Found" });
        }

        oauth2client.setCredentials({
            refresh_token: user.refreshToken,
            access_token: user.accessToken
        });

        //refresh token if needed
        try {
            const { credentials } = await oauth2client.refreshAccessToken();
            if (credentials.access_token) {
                user.accessToken = credentials.access_token;
                if (credentials.expiry_date) {
                    user.accessTokenExpiresAt = new Date(credentials.expiry_date);
                }
                await userRepo.save(user);
                oauth2client.setCredentials(credentials);
            }
        } catch (refreshError) {
            console.log("Token refresh failed, continuing with existing token:", refreshError);
        }

        const drive = google.drive({ version: "v3", auth: oauth2client });
        const deletedFiles: string[] = [];
        const failedFiles: string[] = [];

        for (const fileId of fileIds) {
            try {
                await drive.files.delete({
                    fileId: fileId,
                });
                console.log(`Successfully Deleted file ${fileId}`);
                deletedFiles.push(fileId);

                await fileRepo.delete({ fileid: fileId });

            } catch (error: any) {
                console.error(`Failed to delete ${fileId}:`, error.message);
                failedFiles.push(fileId);
            }
        }

        return res.json({ success: true, deletedFiles, failedFiles });

    } catch (error) {
        return res.status(500).json({ error: error });
    }
});


router.post("/trash", async (req, res) => {
    try {
        const { email, fileIds } = req.body;

        if (!email || !fileIds || !Array.isArray(fileIds)) {
            return res.json({ error: "No proper data provided" });
        }

        const user = await userRepo.findOne({ where: { email } });

        if (!user) {
            return res.json({ message: "User Not Found" });
        }

        oauth2client.setCredentials({
            refresh_token: user.refreshToken,
            access_token: user.accessToken
        });

        // Refresh token if needed
        try {
            const { credentials } = await oauth2client.refreshAccessToken();
            if (credentials.access_token) {
                user.accessToken = credentials.access_token;
                if (credentials.expiry_date) {
                    user.accessTokenExpiresAt = new Date(credentials.expiry_date);
                }
                await userRepo.save(user);
                oauth2client.setCredentials(credentials);
            }
        } catch (refreshError) {
            console.log("Token refresh failed, continuing with existing token:", refreshError);
        }

        const drive = google.drive({ version: "v3", auth: oauth2client });
        const trashedFile: string[] = [];
        const failedFiles: string[] = [];

        for (const fileId of fileIds) {
            try {
                await drive.files.update({
                    fileId: fileId,
                    requestBody :{
                        trashed : true
                    }
                });
                console.log(`Successfully Trashed file ${fileId}`);
                trashedFile.push(fileId);

                // Remove from our database
                await fileRepo.delete({ fileid: fileId });

            } catch (error: any) {
                console.error(`Failed to Trash ${fileId}:`, error.message);
                failedFiles.push(fileId);
            }
        }

        return res.json({ success: true, trashedFile, failedFiles });

    } catch (error) {
        return res.status(500).json({ error: error });
    }
});

router.get("/stats", async (req, res) => {
    try {
        const email = req.query.email as string;

        if (!email) {
            return res.status(400).json({ error: "Email not provided" });
        }
        const user = await userRepo.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // console.log("user.id type and value:", typeof user.id, user.id);

        const totalFiles = await fileRepo.count({ where: { userId: user.id } });
        // console.log("stats totalFiles count:", totalFiles);
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

        const unusedFilesCount = await fileRepo.count({
            where: [
                { userId: user.id, lastViewedTime: LessThan(cutoffDate) },
                { userId: user.id, lastViewedTime: null }
            ]
        });
        // console.log("stats unusedFilesCount:", unusedFilesCount);

        const files = await fileRepo.find({
            where: { userId: user.id },
            select: { size: true }
        });
        // console.log("stats files for size:", files);
        const totalSize = files.reduce((acc, file) => acc + (parseInt(file.size) || 0), 0);

        const unusedFiles = await fileRepo.find({
            where: [
                { userId: user.id, lastViewedTime: LessThan(cutoffDate) },
                { userId: user.id, lastViewedTime: null }
            ],
            select: { size: true }
        });
        console.log("Unused files for size in stats:", unusedFiles);
        const unusedSize = unusedFiles.reduce((acc, file) => acc + (parseInt(file.size) || 0), 0);

        return res.json({
            totalFiles,
            unusedFiles: unusedFilesCount,
            totalSize,
            unusedSize,
            lastScanTime: user.lastScanTime,
        });

    } catch (error) {
        console.error("Error fetching stats:", error);
        return res.status(500).json({ error: "Failed to fetch stats" });
    }
});

//remove files from user's view if not owner
router.post("/remove", async (req, res) => {
    try {
        const { email, fileIds } = req.body;

        if (!email || !fileIds || !Array.isArray(fileIds)) {
            return res.status(400).json({ error: "Email and fileIds array are required" });
        }

        const user = await userRepo.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        oauth2client.setCredentials({
            refresh_token: user.refreshToken,
            access_token: user.accessToken
        });

        try {
            const { credentials } = await oauth2client.refreshAccessToken();
            if (credentials.access_token) {
                user.accessToken = credentials.access_token;
                if (credentials.expiry_date) {
                    user.accessTokenExpiresAt = new Date(credentials.expiry_date);
                }
                await userRepo.save(user);
                oauth2client.setCredentials(credentials);
            }
        } catch (refreshError) {
            console.log("Token refresh failed, continuing with existing token:", refreshError);
        }

        const drive = google.drive({ version: "v3", auth: oauth2client });
        const removedFiles: string[] = [];
        const failedFiles: string[] = [];

        for (const fileId of fileIds) {
            try {
                const dbFile = await fileRepo.findOne({ 
                    where: { fileid: fileId, userId: user.id } 
                });

                if (!dbFile) {
                    failedFiles.push(fileId);
                    continue;
                }

                if (dbFile.isOwnedByUser) {
                    // ff user owns the file they should use delete or trash instead
                    failedFiles.push(fileId);
                    console.log(`Cannot remove owned file ${fileId}, use delete/trash instead`);
                    continue;
                }

                // for shared files, remove users permission/
                const permissions = await drive.permissions.list({
                    fileId: fileId,
                    fields: "permissions(id,emailAddress,role)"
                });

                const userPermission = permissions.data.permissions?.find(
                    perm => perm.emailAddress === email
                );

                if (userPermission && userPermission.id) {
                    await drive.permissions.delete({
                        fileId: fileId,
                        permissionId: userPermission.id
                    });
                }

                await fileRepo.delete({ fileid: fileId, userId: user.id });
                
                // console.log(`Successfully removed file ${fileId} from user's view`);
                removedFiles.push(fileId);

            } catch (error: any) {
                // console.error(`Failed to remove ${fileId}:`, error.message);
                failedFiles.push(fileId);
            }
        }

        return res.json({ 
            success: true, 
            removedFiles, 
            failedFiles,
            message: `Removed ${removedFiles.length} files from your view`
        });

    } catch (error) {
        console.error("Error in remove route:", error);
        return res.status(500).json({ error: "Failed to remove files" });
    }
});

//get shared(not owned by user) file route
router.get("/shared", async (req, res) => {
    try {
        const email = req.query.email as string;

        if (!email) {
            return res.status(400).json({ error: "Email parameter is required" });
        }

        const user = await userRepo.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        //files that are shared (not owned by user)
        const sharedFiles = await fileRepo.find({
            where: { 
                userId: user.id, 
                isOwnedByUser: false 
            },
            order: { lastModifiedTime: 'DESC' }
        });

        return res.json({ sharedFiles });

    } catch (error) {
        console.error("Error getting shared files:", error);
        return res.status(500).json({ error: "Failed to get shared files" });
    }
});
// get large files route , files over specified size
router.get("/large", async (req, res) => {
    try {
        const email = req.query.email as string;
        const minSize = parseInt(req.query.minSize as string) || 100 * 1024 * 1024; // Default 100MB

        if (!email) {
            return res.status(400).json({ error: "Email parameter is required" });
        }

        const user = await userRepo.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const allFiles = await fileRepo.find({
            where: { userId: user.id },
            order: { size: 'DESC' }
        });

        const largeFiles = allFiles.filter(file => {
            const fileSize = parseInt(file.size) || 0;
            return fileSize >= minSize;
        });

        const totalLargeSize = largeFiles.reduce((acc, file) => acc + (parseInt(file.size) || 0), 0);

        return res.json({ 
            largeFiles,
            count: largeFiles.length,
            totalSize: totalLargeSize,
            minSize: minSize
        });

    } catch (error) {
        console.error("Error getting large files:", error);
        return res.status(500).json({ error: "Failed to get large files" });
    }
});

export default router;
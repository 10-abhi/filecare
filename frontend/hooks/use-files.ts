"use client"

import { useState, useCallback } from "react"

interface File {
  fileid: string
  name: string
  size: string
  mimeType: string
  lastModifiedTime: string
  lastViewedTime: string
}

interface Stats {
  totalFiles: number
  unusedFiles: number
  totalSize: string
  potentialSavings: string
}

export function useFiles(userEmail: string) {
  const [files, setFiles] = useState<File[]>([])
  const [unusedFiles, setUnusedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    unusedFiles: 0,
    totalSize: "0 B",
    potentialSavings: "0 B",
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const calculateStats = useCallback((allFiles: File[], unused: File[]) => {
    const totalSize = allFiles.reduce((acc, file) => acc + Number.parseInt(file.size || "0"), 0)
    const potentialSavings = unused.reduce((acc, file) => acc + Number.parseInt(file.size || "0"), 0)

    setStats({
      totalFiles: allFiles.length,
      unusedFiles: unused.length,
      totalSize: formatFileSize(totalSize),
      potentialSavings: formatFileSize(potentialSavings),
    })
  }, [])

  const scanFiles = useCallback(async () => {
    if (!userEmail) return

    setScanning(true)
    setLoading(true)

    try {
      // Scan all files
      const scanResponse = await fetch(`http://localhost:4000/drive/scan?email=${encodeURIComponent(userEmail)}`)
      const scanData = await scanResponse.json()

      if (!scanResponse.ok) {
        throw new Error(scanData.error || "Failed to scan files")
      }

      // Get unused files
      const unusedResponse = await fetch(`http://localhost:4000/drive/unused?email=${encodeURIComponent(userEmail)}`)
      const unusedData = await unusedResponse.json()

      if (!unusedResponse.ok) {
        throw new Error(unusedData.error || "Failed to get unused files")
      }

      setFiles(scanData.files || [])
      setUnusedFiles(unusedData.unusedFiles || [])
      calculateStats(scanData.files || [], unusedData.unusedFiles || [])
    } catch (error) {
      console.error("Error scanning files:", error)
      alert("Failed to scan files. Please try again.")
    } finally {
      setScanning(false)
      setLoading(false)
    }
  }, [userEmail, calculateStats])

  const deleteFiles = useCallback(
    async (fileIds: string[]) => {
      if (!userEmail || fileIds.length === 0) return

      setDeleting(true)

      try {
        const response = await fetch("http://localhost:4000/drive/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            fileIds: fileIds,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to delete files")
        }

        // Remove deleted files from state
        const deletedIds = data.deletedFiles || []
        setFiles((prev) => prev.filter((file) => !deletedIds.includes(file.fileid)))
        setUnusedFiles((prev) => prev.filter((file) => !deletedIds.includes(file.fileid)))

        // Recalculate stats
        const updatedFiles = files.filter((file) => !deletedIds.includes(file.fileid))
        const updatedUnused = unusedFiles.filter((file) => !deletedIds.includes(file.fileid))
        calculateStats(updatedFiles, updatedUnused)

        alert(
          `Successfully deleted ${deletedIds.length} files${data.failedFiles?.length ? `, ${data.failedFiles.length} failed` : ""}`,
        )
      } catch (error) {
        console.error("Error deleting files:", error)
        alert("Failed to delete files. Please try again.")
      } finally {
        setDeleting(false)
      }
    },
    [userEmail, files, unusedFiles, calculateStats],
  )

  return {
    files,
    unusedFiles,
    loading,
    scanning,
    deleting,
    stats,
    scanFiles,
    deleteFiles,
  }
}

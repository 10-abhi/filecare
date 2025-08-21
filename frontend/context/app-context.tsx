"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import type {
  File,
  Stats,
  DeleteResult,
  UnusedFilesResponse,
  StatsResponse,
  ScanResponse,
  DeleteResponse,
} from "@/types"

interface AppContextType {
  files: File[]
  unusedFiles: File[]
  stats: Stats
  loading: boolean
  scanning: boolean
  deleting: boolean
  lastScanTime: string | null
  hasData: boolean
  scanFiles: () => Promise<void>
  deleteFiles: (fileIds: string[]) => Promise<DeleteResult>
  refreshData: () => Promise<void>
  loadCachedData: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [unusedFiles, setUnusedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    unusedFiles: 0,
    totalSize: "0 B",
    potentialSavings: "0 B",
  })

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const calculateStats = useCallback((allFiles: File[], unused: File[]): void => {
    const totalSize = allFiles.reduce((acc, file) => acc + Number.parseInt(file.size || "0"), 0)
    const potentialSavings = unused.reduce((acc, file) => acc + Number.parseInt(file.size || "0"), 0)

    setStats({
      totalFiles: allFiles.length,
      unusedFiles: unused.length,
      totalSize: formatFileSize(totalSize),
      potentialSavings: formatFileSize(potentialSavings),
    })
  }, [])

  // Load stats fron backend
  const loadStats = useCallback(async (): Promise<void> => {
    if (!user?.email || statsLoading) return

    setStatsLoading(true)
    try {
      const response = await fetch(`http://localhost:4000/drive/stats?email=${encodeURIComponent(user.email)}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data: StatsResponse = await response.json()
        setStats({
          totalFiles: data.totalFiles,
          unusedFiles: data.unusedFiles,
          totalSize: formatFileSize(data.totalSize),
          potentialSavings: formatFileSize(data.unusedSize),
        })

        if (data.lastScanTime) {
          setLastScanTime(data.lastScanTime)
        }
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }, [user?.email, statsLoading])

  // Load cached data
  const loadCachedData = useCallback(async (): Promise<void> => {
    if (!user?.email || loading) return

    setLoading(true)
    try {
      // Load unused files
      const unusedResponse = await fetch(`http://localhost:4000/drive/unused?email=${encodeURIComponent(user.email)}`, {
        credentials: "include",
      })

      if (unusedResponse.ok) {
        const unusedData: UnusedFilesResponse = await unusedResponse.json()
        const unusedFilesList = unusedData.unusedFiles || []

        //date strings to Date objects
        const processedUnusedFiles = unusedFilesList.map((file) => ({
          ...file,
          lastModifiedTime: file.lastModifiedTime ? new Date(file.lastModifiedTime) : null,
          lastViewedTime: file.lastViewedTime ? new Date(file.lastViewedTime) : null,
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.updatedAt),
        }))

        setUnusedFiles(processedUnusedFiles)
        setFiles(processedUnusedFiles)
        setHasData(processedUnusedFiles.length > 0)

        // Calculate stats with the unused files
        calculateStats(processedUnusedFiles, processedUnusedFiles)
      }

      // Load stats from your /stats endpoint
      await loadStats()
    } catch (error) {
      console.error("Error loading cached data:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.email, loading, calculateStats, loadStats])

  const scanFiles = async (): Promise<void> => {
    if (!user?.email) {
      throw new Error("User not authenticated")
    }

    setScanning(true)
    setLoading(true)

    try {
      // Scan files
      const scanResponse = await fetch(`http://localhost:4000/drive/scan?email=${encodeURIComponent(user.email)}`, {
        credentials: "include",
      })

      if (!scanResponse.ok) {
        const errorData = await scanResponse.json()
        throw new Error(errorData.error || errorData.message || "Failed to scan files")
      }

      const scanData: ScanResponse = await scanResponse.json()
      console.log("Scan completed:", scanData)

      const unusedResponse = await fetch(`http://localhost:4000/drive/unused?email=${encodeURIComponent(user.email)}`, {
        credentials: "include",
      })

      if (unusedResponse.ok) {
        const unusedData: UnusedFilesResponse = await unusedResponse.json()
        const unusedFilesList = unusedData.unusedFiles || []

        //date strings to date objects
        const processedUnusedFiles = unusedFilesList.map((file) => ({
          ...file,
          lastModifiedTime: file.lastModifiedTime ? new Date(file.lastModifiedTime) : null,
          lastViewedTime: file.lastViewedTime ? new Date(file.lastViewedTime) : null,
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.updatedAt),
        }))

        setUnusedFiles(processedUnusedFiles)
        setFiles(processedUnusedFiles)
        calculateStats(processedUnusedFiles, processedUnusedFiles)
      }

      // Load updated stats
      await loadStats()
      setHasData(true)

      const scanTime = new Date().toISOString()
      setLastScanTime(scanTime)
      localStorage.setItem("lastScanTime", scanTime)
    } catch (error) {
      console.error("Error scanning files:", error)
      throw error
    } finally {
      setScanning(false)
      setLoading(false)
    }
  }

  const deleteFiles = async (fileIds: string[]): Promise<DeleteResult> => {
    if (!user?.email || fileIds.length === 0) {
      throw new Error("Invalid parameters for file deletion")
    }

    setDeleting(true)

    try {
      const response = await fetch("http://localhost:4000/drive/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: user.email,
          fileIds: fileIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete files")
      }

      const data: DeleteResponse = await response.json()

      // Remove deleted files from state
      const deletedIds = data.deletedFiles || []
      const updatedFiles = files.filter((file) => !deletedIds.includes(file.fileid))
      const updatedUnused = unusedFiles.filter((file) => !deletedIds.includes(file.fileid))

      setFiles(updatedFiles)
      setUnusedFiles(updatedUnused)
      calculateStats(updatedFiles, updatedUnused)

      // Reload stats
      await loadStats()

      return {
        deletedCount: deletedIds.length,
        failedCount: data.failedFiles?.length || 0,
      }
    } catch (error) {
      console.error("Error deleting files:", error)
      throw error
    } finally {
      setDeleting(false)
    }
  }

  const refreshData = async (): Promise<void> => {
    if (isAuthenticated) {
      await loadCachedData()
    }
  }

  // Load cached data on mount and when user changes - only once
  useEffect(() => {
    if (isAuthenticated && user && !hasData && !loading) {
      loadCachedData()
    } else if (!isAuthenticated) {
      // Clear data when user logs out
      setFiles([])
      setUnusedFiles([])
      setHasData(false)
      setLastScanTime(null)
      setStats({
        totalFiles: 0,
        unusedFiles: 0,
        totalSize: "0 B",
        potentialSavings: "0 B",
      })
    }
  }, [isAuthenticated, user?.email, hasData])

  const value: AppContextType = {
    files,
    unusedFiles,
    stats,
    loading,
    scanning,
    deleting,
    lastScanTime,
    hasData,
    scanFiles,
    deleteFiles,
    refreshData,
    loadCachedData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

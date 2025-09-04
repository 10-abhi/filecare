"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import { apiRequest, API_CONFIG } from "@/lib/api-config"
import type {
  File,
  Stats,
  DeleteResult,
  UnusedFilesResponse,
  StatsResponse,
  ScanResponse,
  DeleteResponse,
  RemoveResponse,
  SharedFilesResponse,
  LargeFilesResponse,
} from "@/types"

interface AppContextType {
  files: File[]
  unusedFiles: File[]
  sharedFiles: File[]
  largeFiles: File[]
  stats: Stats
  loading: boolean
  scanning: boolean
  deleting: boolean
  removing: boolean
  lastScanTime: string | null
  hasData: boolean
  scanFiles: () => Promise<void>
  deleteFiles: (fileIds: string[]) => Promise<DeleteResult>
  removeFiles: (fileIds: string[]) => Promise<DeleteResult>
  loadSharedFiles: () => Promise<void>
  loadLargeFiles: (minSize?: number) => Promise<void>
  refreshData: () => Promise<void>
  loadCachedData: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [unusedFiles, setUnusedFiles] = useState<File[]>([])
  const [sharedFiles, setSharedFiles] = useState<File[]>([])
  const [largeFiles, setLargeFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    unusedFiles: 0,
    totalSize: "0 B",
    unusedSize: 0,
    potentialSavings: "0 B",
    sharedFilesCount: 0,
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
      unusedSize: potentialSavings,
      potentialSavings: formatFileSize(potentialSavings),
      sharedFilesCount: 0,
    })
  }, [])

  // Load stats fron backend
  const loadStats = useCallback(async (): Promise<void> => {
    if (!user?.email || statsLoading) return

    setStatsLoading(true)
    try {
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.DRIVE.STATS}?email=${encodeURIComponent(user.email)}`)

      if (response.ok) {
        const data: StatsResponse = await response.json()
        setStats({
          totalFiles: data.totalFiles,
          unusedFiles: data.unusedFiles,
          totalSize: formatFileSize(data.totalSize),
          unusedSize: data.unusedSize,
          potentialSavings: formatFileSize(data.unusedSize),
          sharedFilesCount: data.sharedFilesCount || 0,
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
      const unusedResponse = await apiRequest(`${API_CONFIG.ENDPOINTS.DRIVE.UNUSED}?email=${encodeURIComponent(user.email)}`)

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
          // adding default values for new permission fields if not present
          isOwnedByUser: file.isOwnedByUser ?? false,
          canDelete: file.canDelete ?? false,
          canTrash: file.canTrash ?? false,
          ownerEmail: file.ownerEmail ?? '',
          isShared: file.isShared ?? false,
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
      const scanResponse = await apiRequest(`${API_CONFIG.ENDPOINTS.DRIVE.SCAN}?email=${encodeURIComponent(user.email)}`)

      if (!scanResponse.ok) {
        const errorData = await scanResponse.json()
        throw new Error(errorData.error || errorData.message || "Failed to scan files")
      }

      const scanData: ScanResponse = await scanResponse.json()
      console.log("Scan completed:", scanData)

      const unusedResponse = await apiRequest(`${API_CONFIG.ENDPOINTS.DRIVE.UNUSED}?email=${encodeURIComponent(user.email)}`)

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
          // adding default values for new permission fields if not present
          isOwnedByUser: file.isOwnedByUser ?? false,
          canDelete: file.canDelete ?? false,
          canTrash: file.canTrash ?? false,
          ownerEmail: file.ownerEmail ?? '',
          isShared: file.isShared ?? false,
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
      const response = await apiRequest(API_CONFIG.ENDPOINTS.DRIVE.DELETE, {
        method: "DELETE",
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

  // Remove files (for shared files that user doesn't own)
  const removeFiles = async (fileIds: string[]): Promise<DeleteResult> => {
    if (!user?.email || fileIds.length === 0) {
      throw new Error("Invalid parameters for file removal")
    }

    setRemoving(true)

    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.DRIVE.REMOVE, {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          fileIds: fileIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove files")
      }

      const data: RemoveResponse = await response.json()

      // Remove files from all relevant state arrays
      const removedIds = data.removedFiles || []
      const updatedFiles = files.filter((file) => !removedIds.includes(file.fileid))
      const updatedUnused = unusedFiles.filter((file) => !removedIds.includes(file.fileid))
      const updatedShared = sharedFiles.filter((file) => !removedIds.includes(file.fileid))

      setFiles(updatedFiles)
      setUnusedFiles(updatedUnused)
      setSharedFiles(updatedShared)
      calculateStats(updatedFiles, updatedUnused)

      // Reload stats
      await loadStats()

      return {
        deletedCount: removedIds.length,
        failedCount: data.failedFiles?.length || 0,
      }
    } catch (error) {
      console.error("Error removing files:", error)
      throw error
    } finally {
      setRemoving(false)
    }
  }

  // Load shared files
  const loadSharedFiles = async (): Promise<void> => {
    if (!user?.email) {
      throw new Error("User not authenticated")
    }

    try {
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.DRIVE.SHARED}?email=${encodeURIComponent(user.email)}`)

      if (response.ok) {
        const data: SharedFilesResponse = await response.json()
        const processedSharedFiles = (data.sharedFiles || []).map((file) => ({
          ...file,
          lastModifiedTime: file.lastModifiedTime ? new Date(file.lastModifiedTime) : null,
          lastViewedTime: file.lastViewedTime ? new Date(file.lastViewedTime) : null,
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.updatedAt),
        }))

        setSharedFiles(processedSharedFiles)
      }
    } catch (error) {
      console.error("Error loading shared files:", error)
      throw error
    }
  }

  // Load large files
  const loadLargeFiles = async (minSize: number = 100 * 1024 * 1024): Promise<void> => {
    if (!user?.email) {
      throw new Error("User not authenticated")
    }

    try {
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.DRIVE.LARGE}?email=${encodeURIComponent(user.email)}&minSize=${minSize}`)

      if (response.ok) {
        const data: LargeFilesResponse = await response.json()
        const processedLargeFiles = (data.largeFiles || []).map((file) => ({
          ...file,
          lastModifiedTime: file.lastModifiedTime ? new Date(file.lastModifiedTime) : null,
          lastViewedTime: file.lastViewedTime ? new Date(file.lastViewedTime) : null,
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.updatedAt),
        }))

        setLargeFiles(processedLargeFiles)
      }
    } catch (error) {
      console.error("Error loading large files:", error)
      throw error
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
      setSharedFiles([])
      setLargeFiles([])
      setHasData(false)
      setLastScanTime(null)
      setStats({
        totalFiles: 0,
        unusedFiles: 0,
        totalSize: "0 B",
        unusedSize: 0,
        potentialSavings: "0 B",
        sharedFilesCount: 0,
      })
    }
  }, [isAuthenticated, user?.email, hasData])

  const value: AppContextType = {
    files,
    unusedFiles,
    sharedFiles,
    largeFiles,
    stats,
    loading,
    scanning,
    deleting,
    removing,
    lastScanTime,
    hasData,
    scanFiles,
    deleteFiles,
    removeFiles,
    loadSharedFiles,
    loadLargeFiles,
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

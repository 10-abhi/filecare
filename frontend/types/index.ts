export interface User {
  id: string
  email: string
  name: string
  googleUserID: string
}

export interface File {
  id: string
  fileid: string
  name: string
  size: string
  mimeType: string
  lastModifiedTime: Date | null
  lastViewedTime: Date | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Stats {
  totalFiles: number
  unusedFiles: number
  totalSize: string
  potentialSavings: string
}

export interface DeleteResult {
  deletedCount: number
  failedCount: number
}

export interface ApiResponse<T> {
  success?: boolean
  error?: string
  message?: string
  data?: T
}

export interface UnusedFilesResponse {
  unusedFiles: File[]
}

export interface StatsResponse {
  totalFiles: number
  unusedFiles: number
  totalSize: number
  unusedSize: number
  lastScanTime: string | null
}

export interface ScanResponse {
  message: string
  total: number
}

export interface DeleteResponse {
  success: boolean
  deletedFiles: string[]
  failedFiles: string[]
}

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
  isOwnedByUser: boolean
  canDelete: boolean
  canTrash: boolean
  ownerEmail: string
  isShared: boolean
}

export interface Stats {
  totalFiles: number
  unusedFiles: number
  totalSize: string | number
  unusedSize: string | number
  potentialSavings: string
  sharedFilesCount?: number
  lastScanTime?: string | null
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
  sharedFilesCount?: number
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

export interface RemoveResponse {
  success: boolean
  removedFiles: string[]
  failedFiles: string[]
  message: string
}

export interface FileDetailsResponse {
  file: {
    id: string
    name: string
    mimeType: string
    size: string
    createdTime: string
    modifiedTime: string
    viewedByMeTime: string
    owners: Array<{ emailAddress: string }>
    permissions: Array<{ id: string, emailAddress: string, role: string }>
    webViewLink: string
    iconLink: string
    thumbnailLink: string
  }
  dbInfo: File
}

export interface SharedFilesResponse {
  sharedFiles: File[]
}

export interface LargeFilesResponse {
  largeFiles: File[]
  count: number
  totalSize: number
  minSize: number
}

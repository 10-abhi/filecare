"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "@/lib/date-fns"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import type { File } from "@/types"

interface FileListProps {
  files: File[]
  selectedFiles: string[]
  onSelectionChange: (selected: string[]) => void
  loading: boolean
  getFileIcon: (mimeType: string) => React.ReactNode
}

export function FileList({ files, selectedFiles, onSelectionChange, loading, getFileIcon }: FileListProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  const formatFileSize = (bytes: string): string => {
    const size = Number.parseInt(bytes)
    if (size === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(size) / Math.log(k))
    return Number.parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const toggleFileSelection = (fileId: string): void => {
    const newSelection = selectedFiles.includes(fileId)
      ? selectedFiles.filter((id) => id !== fileId)
      : [...selectedFiles, fileId]
    onSelectionChange(newSelection)
  }

  const toggleSelectAll = (): void => {
    if (selectedFiles.length === files.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(files.map((f) => f.fileid))
    }
  }

  const toggleExpanded = (fileId: string): void => {
    const newExpanded = new Set(expandedFiles)
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId)
    } else {
      newExpanded.add(fileId)
    }
    setExpandedFiles(newExpanded)
  }

  const formatDate = (date: Date | null): string => {
    if (!date) return "Never"
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-400" />
        <span className="ml-2 text-sm sm:text-base text-gray-400">Loading files...</span>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-gray-400">
        <p className="text-sm sm:text-base">No files found. Try scanning your drive first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Select All Header */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg border border-gray-800">
        <Checkbox
          checked={selectedFiles.length === files.length && files.length > 0}
          onCheckedChange={toggleSelectAll}
          className="border-gray-600"
        />
        <span className="text-xs sm:text-sm text-gray-400">
          {selectedFiles.length > 0
            ? `${selectedFiles.length} of ${files.length} selected`
            : `Select all ${files.length} files`}
        </span>
      </div>

      {/* File List */}
      <div className="space-y-2 max-h-64 sm:max-h-96 lg:max-h-[500px] overflow-y-auto">
        {files.map((file) => (
          <Card key={file.id} className="bg-white/5 border-gray-800 hover:bg-white/10 transition-all duration-200">
            <CardContent className="p-2 sm:p-3 lg:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Checkbox
                  checked={selectedFiles.includes(file.fileid)}
                  onCheckedChange={() => toggleFileSelection(file.fileid)}
                  className="border-gray-600 flex-shrink-0"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(file.id)}
                  className="p-1 h-auto flex-shrink-0"
                >
                  {expandedFiles.has(file.id) ? (
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </Button>

                <div className="text-blue-400 flex-shrink-0">{getFileIcon(file.mimeType)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <h3 className="font-medium text-white truncate text-xs sm:text-sm lg:text-base">{file.name}</h3>
                    <Badge variant="secondary" className="text-xs w-fit">
                      {file.mimeType.split("/")[0]}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-400">
                    <span>{formatFileSize(file.size)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Modified {formatDate(file.lastModifiedTime)}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedFiles.has(file.id) && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800 space-y-2 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <span className="text-gray-400">File ID:</span>
                      <p className="text-white font-mono text-xs break-all">{file.fileid}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">MIME Type:</span>
                      <p className="text-white break-all">{file.mimeType}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Last Viewed:</span>
                      <p className="text-white">{formatDate(file.lastViewedTime)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Size:</span>
                      <p className="text-white">{formatFileSize(file.size)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <p className="text-white">{formatDate(file.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Updated:</span>
                      <p className="text-white">{formatDate(file.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

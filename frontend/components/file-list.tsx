"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "@/lib/date-fns"
import { 
  ChevronDown, 
  ChevronRight, 
  Loader2, 
  Trash2, 
  UserX, 
  ExternalLink,
  AlertTriangle 
} from "lucide-react"
import { useApp } from "@/context/app-context"
import { toast } from "sonner"
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
  const [fileActions, setFileActions] = useState<Record<string, boolean>>({})
  const { removeFiles, deleteFiles } = useApp()

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

  // Confirmation dialog for remove/delete actions
  const showConfirmDialog = (action: 'remove' | 'delete', fileName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const message = action === 'remove' 
        ? `Are you sure you want to remove "${fileName}" from your view? This will not delete the original file.`
        : `Are you sure you want to permanently delete "${fileName}"? This action cannot be undone.`;
      
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  }

  // File action handlers
  const handleRemove = async (file: File) => {
    const confirmed = await showConfirmDialog('remove', file.name);
    if (!confirmed) return;

    const actionKey = `remove-${file.fileid}`
    setFileActions(prev => ({ ...prev, [actionKey]: true }))
    
    try {
      await removeFiles([file.fileid])
      toast.success(`Removed ${file.name} from your view`)
    } catch (error) {
      toast.error(`Failed to remove ${file.name}`)
      console.error('Remove error:', error)
    } finally {
      setFileActions(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const handleDelete = async (file: File) => {
    const confirmed = await showConfirmDialog('delete', file.name);
    if (!confirmed) return;

    const actionKey = `delete-${file.fileid}`
    setFileActions(prev => ({ ...prev, [actionKey]: true }))
    
    try {
      await deleteFiles([file.fileid])
      toast.success(`Deleted ${file.name}`)
    } catch (error) {
      toast.error(`Failed to delete ${file.name}`)
      console.error('Delete error:', error)
    } finally {
      setFileActions(prev => ({ ...prev, [actionKey]: false }))
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
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs w-fit">
                        {file.mimeType.split("/")[0]}
                      </Badge>
                      {file.isOwnedByUser && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          Owner
                        </Badge>
                      )}
                      {file.isShared && (
                        <Badge variant="secondary" className="text-xs bg-blue-600">
                          Shared
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-400">
                    <span>{formatFileSize(file.size)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Modified {formatDate(file.lastModifiedTime)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                  {file.isOwnedByUser ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(file)}
                      disabled={fileActions[`delete-${file.fileid}`]}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      {fileActions[`delete-${file.fileid}`] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(file)}
                      disabled={fileActions[`remove-${file.fileid}`]}
                      className="text-xs px-2 py-1 h-auto text-orange-400 hover:text-orange-300"
                    >
                      {fileActions[`remove-${file.fileid}`] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserX className="w-3 h-3" />
                      )}
                    </Button>
                  )}
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
                    {/* <div>
                      <span className="text-gray-400">Added to DB:</span>
                      <p className="text-white">{formatDate(file.createdAt)}</p>
                    </div> */}
                    <div>
                      <span className="text-gray-400">File Modified:</span>
                      <p className="text-white">{formatDate(file.lastModifiedTime)}</p>
                    </div>
                    
                    {/* Permission Information */}
                    <div className="sm:col-span-2">
                      <span className="text-gray-400">Owner:</span>
                      <p className="text-white truncate">
                        {file.isOwnedByUser ? "You" : file.ownerEmail || "Unknown"}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Permissions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {file.isOwnedByUser && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          Owner
                        </Badge>
                      )}
                      {file.isShared && (
                        <Badge variant="secondary" className="text-xs bg-blue-600">
                          Shared
                        </Badge>
                      )}
                      {file.canDelete && (
                        <Badge variant="destructive" className="text-xs bg-red-600">
                          Can Delete
                        </Badge>
                      )}
                      {file.canTrash && !file.canDelete && (
                        <Badge variant="outline" className="text-xs bg-orange-600">
                          Can Trash
                        </Badge>
                      )}
                      {!file.canDelete && !file.canTrash && (
                        <Badge variant="outline" className="text-xs bg-gray-600">
                          Read Only
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                    {file.isOwnedByUser ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(file)}
                        disabled={fileActions[`delete-${file.fileid}`]}
                        className="flex items-center gap-1 text-xs"
                      >
                        {fileActions[`delete-${file.fileid}`] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Delete
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemove(file)}
                        disabled={fileActions[`remove-${file.fileid}`]}
                        className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
                      >
                        {fileActions[`remove-${file.fileid}`] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserX className="w-3 h-3" />
                        )}
                        Remove from View
                      </Button>
                    )}
                  </div>
                  
                  {/* Warning for files that can't be deleted */}
                  {!file.canDelete && !file.canTrash && !file.isOwnedByUser && (
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <p className="text-yellow-400 text-xs">
                          This file cannot be deleted because you don&apos;t have sufficient permissions.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!file.isOwnedByUser && (
                    <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <p className="text-blue-400 text-xs">
                          This file is shared with you by {file.ownerEmail}. You can remove it from your view but not delete it.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

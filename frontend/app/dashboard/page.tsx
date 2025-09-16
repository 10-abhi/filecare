"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Search,
  Trash2,
  RefreshCw,
  FileText,
  ImageIcon,
  Video,
  Music,
  Archive,
  AlertTriangle,
  Loader2,
  Home,
  BarChart3,
  LogOut,
  Clock,
  Menu,
  Database,
  ArrowLeft,
  UserX,
} from "lucide-react"
import { FileList } from "@/components/file-list"
import { StatsCards } from "@/components/stats-cards"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/context/auth-context"
import { useApp } from "@/context/app-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "@/lib/date-fns"
import type { File } from "@/types"

import { AdvancedFileManager } from "@/components/advanced-file-manager"
import { useRouter } from "next/navigation"

type ActiveTab = "overview" | "unused" | "all" | "advanced"

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { user, logout } = useAuth()
  const router = useRouter()
  const {
    files,
    unusedFiles,
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
  } = useApp()

  
  const handleLogout = (): void => {
    logout()
    toast.success("Logged out successfully", {
      description: "You have been logged out of your account.",
    })
  }

  const handleScan = async (): Promise<void> => {
    try {
      await scanFiles()
      toast.success("Scan completed successfully!", {
        description: `Found ${stats.totalFiles} files, ${stats.unusedFiles} unused files.`,
      })
    } catch (error) {
      toast.error("Scan failed", {
        description: error instanceof Error ? error.message : "Failed to scan files. Please try again.",
      })
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (selectedFiles.length === 0) {
      toast.error("No files selected", {
        description: "Please select files to delete.",
      })
      return
    }

    // Filter to only include owned files for deletion
    const selectedFileObjects = filteredFiles.filter(file => selectedFiles.includes(file.fileid))
    const ownedFilesToDelete = selectedFileObjects.filter(file => file.isOwnedByUser).map(file => file.fileid)
    
    if (ownedFilesToDelete.length === 0) {
      toast.error("No owned files selected", {
        description: "You can only delete files you own.",
      })
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${ownedFilesToDelete.length} files? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const result = await deleteFiles(ownedFilesToDelete)
      // Remove deleted files from selection
      setSelectedFiles(prev => prev.filter(id => !ownedFilesToDelete.includes(id)))
      toast.success("Files deleted successfully!", {
        description: `Deleted ${result.deletedCount} files${result.failedCount > 0 ? `, ${result.failedCount} failed` : ""}.`,
      })
    } catch (error) {
      toast.error("Delete failed", {
        description: error instanceof Error ? error.message : "Failed to delete files. Please try again.",
      })
    }
  }

  const handleRemove = async (): Promise<void> => {
    if (selectedFiles.length === 0) {
      toast.error("No files selected", {
        description: "Please select files to remove.",
      })
      return
    }

    // Filter to only include shared files for removal
    const selectedFileObjects = filteredFiles.filter(file => selectedFiles.includes(file.fileid))
    const sharedFilesToRemove = selectedFileObjects.filter(file => !file.isOwnedByUser).map(file => file.fileid)
    
    if (sharedFilesToRemove.length === 0) {
      toast.error("No shared files selected", {
        description: "You can only remove files shared with you.",
      })
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${sharedFilesToRemove.length} files from your view? This will not delete the original files.`
    );
    
    if (!confirmed) return;

    try {
      const result = await removeFiles(sharedFilesToRemove)
      // Remove files from selection
      setSelectedFiles(prev => prev.filter(id => !sharedFilesToRemove.includes(id)))
      toast.success("Files removed successfully!", {
        description: `Removed ${result.deletedCount} files from your view${result.failedCount > 0 ? `, ${result.failedCount} failed` : ""}.`,
      })
    } catch (error) {
      toast.error("Remove failed", {
        description: error instanceof Error ? error.message : "Failed to remove files. Please try again.",
      })
    }
  }

  const filteredFiles: File[] = (() => {
    let baseFiles: File[] = [];
    
    switch (activeTab) {
      case "unused":
        baseFiles = unusedFiles;
        break;
      case "all":
        baseFiles = files;
        break;
      case "overview":
      default:
        baseFiles = unusedFiles; 
        break;
    }
    
    return baseFiles.filter((file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  })();

  const getFileIcon = (mimeType: string): React.ReactNode => {
    if (mimeType.includes("image")) return <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
    if (mimeType.includes("video")) return <Video className="w-3 h-3 sm:w-4 sm:h-4" />
    if (mimeType.includes("audio")) return <Music className="w-3 h-3 sm:w-4 sm:h-4" />
    if (mimeType.includes("zip") || mimeType.includes("archive")) return <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
    return <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
  }

  //sidebar content component
  const SidebarContent = (): React.ReactElement => (
    <div className="h-full flex flex-col">
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6 lg:mb-8">
          <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-sm sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-300 transition-all cursor-pointer"
          >
            DriveClean
          </button>
        </div>

        {/* Navigation */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            className="w-full justify-start text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10 text-gray-300 hover:text-white hover:bg-white/10"
            onClick={() => {
              router.push('/')
              setSidebarOpen(false)
            }}
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="mb-3 sm:mb-4 lg:mb-6 p-2 sm:p-3 bg-white/5 rounded-lg border border-gray-800">
            <div className="text-xs text-gray-400">Signed in as</div>
            <div className="text-xs sm:text-sm lg:text-base text-white font-medium truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        )}

        <nav className="space-y-1">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            className={`w-full justify-start text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10 ${
              activeTab === "overview" 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => {
              setActiveTab("overview")
              setSidebarOpen(false)
            }}
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === "unused" ? "default" : "ghost"}
            className={`w-full justify-start text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10 ${
              activeTab === "unused" 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => {
              setActiveTab("unused")
              setSidebarOpen(false)
            }}
          >
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Unused Files
            {unusedFiles.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {unusedFiles.length}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "all" ? "default" : "ghost"}
            className={`w-full justify-start text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10 ${
              activeTab === "all" 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => {
              setActiveTab("all")
              setSidebarOpen(false)
            }}
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            All Files
            {files.length > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{files.length}</span>
            )}
          </Button>
          <Button
            variant={activeTab === "advanced" ? "default" : "ghost"}
            className={`w-full justify-start text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10 ${
              activeTab === "advanced" 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => {
              setActiveTab("advanced")
              setSidebarOpen(false)
            }}
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Advanced Tools
          </Button>
        </nav>
      </div>

      <div className="mt-auto p-3 sm:p-4 lg:p-6 space-y-2">
        {hasData && (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Database className="w-3 h-3" />
            {files.length} files cached
          </div>
        )}
        {lastScanTime && (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last scan: {formatDistanceToNow(new Date(lastScanTime), { addSuffix: true })}
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10 text-gray-300 hover:text-red-400 hover:bg-red-600/20"
          onClick={handleLogout}
        >
          <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:bg-black/50 lg:backdrop-blur-xl lg:border-r lg:border-gray-800 lg:z-40 lg:block">
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className="lg:ml-64 relative z-10">
          {/* Header */}
          <header className="p-3 sm:p-4 lg:p-6 border-b border-gray-800 bg-black/20 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
                      <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Drive Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-400 mt-1">
                    {hasData ? "Manage and clean your Google Drive files" : "Connect your Google Drive to get started"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleScan}
                  disabled={scanning}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm px-3 sm:px-4"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Scanning...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{hasData ? "Rescan Drive" : "Scan Drive"}</span>
                      <span className="sm:hidden">{hasData ? "Rescan" : "Scan"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
            {/* Welcome Message for First Time Users */}
            {!hasData && (
              <div className="text-center py-12 px-4">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">Welcome to DriveClean</h2>
                  <p className="text-gray-400 mb-6">
                    Get started by scanning your Google Drive to analyze your files and discover optimization opportunities.
                  </p>
                  <Button
                    onClick={handleScan}
                    disabled={scanning}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scanning Your Drive...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Start Drive Scan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

                {/* Dashboard Content */}
                {hasData && (
                  <>
                    {/* Stats Cards */}
                    <StatsCards stats={stats} />

                    {/* Search and Actions */}
                    <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
              <CardHeader className="pb-3 lg:pb-4">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <span className="text-base sm:text-lg lg:text-xl">
                    {activeTab === "overview" && "Drive Overview"}
                    {activeTab === "unused" && "Unused Files"}
                    {activeTab === "all" && "All Files"}
                    {activeTab === "advanced" && "Advanced Tools"}
                  </span>
                  {selectedFiles.length > 0 && (() => {
                    const selectedFileObjects = filteredFiles.filter(file => selectedFiles.includes(file.fileid))
                    const ownedFiles = selectedFileObjects.filter(file => file.isOwnedByUser)
                    const sharedFiles = selectedFileObjects.filter(file => !file.isOwnedByUser)
                    
                    return (
                      <div className="flex gap-2">
                        {ownedFiles.length > 0 && (
                          <Button
                            onClick={handleDelete}
                            disabled={deleting}
                            variant="destructive"
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm px-3 sm:px-4"
                          >
                            {deleting ? (
                              <>
                                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                                <span className="hidden sm:inline">Deleting...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Delete {ownedFiles.length}</span>
                                <span className="sm:hidden">Delete {ownedFiles.length}</span>
                              </>
                            )}
                          </Button>
                        )}
                        
                        {sharedFiles.length > 0 && (
                          <Button
                            onClick={handleRemove}
                            disabled={removing}
                            variant="outline"
                            size="sm"
                            className="text-orange-400 hover:text-orange-300 border-orange-500/40 hover:bg-orange-500/10 text-xs sm:text-sm px-3 sm:px-4"
                          >
                            {removing ? (
                              <>
                                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                                <span className="hidden sm:inline">Removing...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Remove {sharedFiles.length}</span>
                                <span className="sm:hidden">Remove {sharedFiles.length}</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {activeTab === "advanced" ? (
                  <AdvancedFileManager />
                ) : (
                  <>
                    {hasData && (
                      <div className="flex items-center gap-2 sm:gap-4 mb-4 lg:mb-6">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                          <Input
                            placeholder="Search files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 sm:pl-10 bg-white/5 border-gray-700 text-white placeholder-gray-400 text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10"
                          />
                        </div>
                      </div>
                    )}

                    {/* File List */}
                    {hasData ? (
                      filteredFiles.length > 0 ? (
                        <FileList
                          files={filteredFiles}
                          selectedFiles={selectedFiles}
                          onSelectionChange={setSelectedFiles}
                          loading={loading}
                          getFileIcon={getFileIcon}
                        />
                      ) : (
                        <div className="text-center text-gray-400 py-8 lg:py-12">
                          <p className="text-xs sm:text-sm lg:text-base">No files match your search criteria.</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center text-gray-400 py-8 lg:py-12">
                        <div className="space-y-3 lg:space-y-4">
                          <Database className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto text-gray-600" />
                          <div>
                            <p className="text-xs sm:text-sm lg:text-base mb-2">No files found in your drive.</p>
                            <p className="text-xs text-gray-500 mb-4">
                              Click &quot;Scan Drive&quot; to analyze your Google Drive and find files to clean up.
                            </p>
                          </div>
                          <Button
                            onClick={handleScan}
                            disabled={scanning}
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            {scanning ? (
                              <>
                                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                                Scanning...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                Scan Drive
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
                  </>
                )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HardDrive, TrendingUp, Share2, AlertTriangle } from "lucide-react"
import type { Stats } from "@/types"

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalSizeBytes = typeof stats.totalSize === 'string' ? 
    parseInt(stats.totalSize) || 0 : stats.totalSize || 0
  
  const unusedSizeBytes = typeof stats.unusedSize === 'string' ? 
    parseInt(stats.unusedSize) || 0 : stats.unusedSize || 0

  const usagePercentage = totalSizeBytes > 0 ? 
    Math.round((unusedSizeBytes / totalSizeBytes) * 100) : 0

  const storageUsedGB = Math.round((totalSizeBytes / (1024 * 1024 * 1024)) * 100) / 100
  const availableSpaceGB = Math.round((unusedSizeBytes / (1024 * 1024 * 1024)) * 100) / 100

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {/* Your Storage Usage */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-100">Your Storage</CardTitle>
          <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-white">
            {formatBytes(totalSizeBytes)}
          </div>
          <p className="text-xs text-blue-200 mt-1">
            {stats.totalFiles.toLocaleString()} owned files
          </p>
          <div className="mt-2 h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, storageUsedGB / 15 * 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-blue-300">
            {storageUsedGB}GB used of 15GB
          </div>
        </CardContent>
      </Card>

      {/* Unused Files */}
      <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-red-100">Unused Files</CardTitle>
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-white">
            {stats.unusedFiles.toLocaleString()}
          </div>
          <p className="text-xs text-red-200 mt-1">
            {formatBytes(unusedSizeBytes)} can be deleted
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-xs text-red-300 font-medium">
              {usagePercentage}% of used storage
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shared Files */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-purple-100">Shared Files</CardTitle>
          <Share2 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-white">
            {(stats.sharedFilesCount || 0).toLocaleString()}
          </div>
          <p className="text-xs text-purple-200 mt-1">
            Not using your storage
          </p>
          <div className="mt-2 text-xs text-purple-300">
            Can be removed from view
          </div>
        </CardContent>
      </Card>

      {/* Potential Savings */}
      <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-100">Potential Savings</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-white">
            {formatBytes(unusedSizeBytes)}
          </div>
          <p className="text-xs text-green-200 mt-1">
            By deleting unused files
          </p>
          <div className="mt-2 text-xs text-green-300">
            {availableSpaceGB}GB space to reclaim
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

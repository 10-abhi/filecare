"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HardDrive, Trash2, TrendingUp } from "lucide-react"
import type { Stats } from "@/types"

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/20 backdrop-blur-sm hover:scale-105 transition-transform duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-100">Total Files</CardTitle>
          <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-white">{stats.totalFiles.toLocaleString()}</div>
          <p className="text-xs text-blue-200 mt-1">Files in your drive</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/20 backdrop-blur-sm hover:scale-105 transition-transform duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-red-100">Unused Files</CardTitle>
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-white">{stats.unusedFiles.toLocaleString()}</div>
          <p className="text-xs text-red-200 mt-1">Not accessed in 1+ year</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/20 backdrop-blur-sm hover:scale-105 transition-transform duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-100">Total Size</CardTitle>
          <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-white">{stats.totalSize}</div>
          <p className="text-xs text-green-200 mt-1">Storage used</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-500/20 backdrop-blur-sm hover:scale-105 transition-transform duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-purple-100">Potential Savings</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-white">{stats.potentialSavings}</div>
          <p className="text-xs text-purple-200 mt-1">Space you can reclaim</p>
        </CardContent>
      </Card>
    </div>
  )
}

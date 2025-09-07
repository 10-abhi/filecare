"use client"

import type React from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  allowUnauthenticated?: boolean
}

export function ProtectedRoute({ 
  children, 
  redirectTo = "/", 
  allowUnauthenticated = false 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      // If user is not authenticated and this route doesn't allow unauthenticated access
      if (!isAuthenticated && !allowUnauthenticated) {
        router.push(redirectTo)
      }
      // If user is authenticated and trying to access home page, redirect to dashboard
      else if (isAuthenticated && pathname === "/" && !allowUnauthenticated) {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, isLoading, router, redirectTo, allowUnauthenticated, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // For routes that allow unauthenticated access, always show content
  if (allowUnauthenticated) {
    return <>{children}</>
  }

  // For protected routes, only show if authenticated
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

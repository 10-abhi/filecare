"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export default function AuthSuccess() {
  const router = useRouter()
  const { checkAuthStatus, isAuthenticated } = useAuth()
  const [countdown, setCountdown] = useState(3)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check authentication status when page loads
    const verifyAuth = async (): Promise<void> => {
      try {
        setChecking(true)
        await checkAuthStatus()
      } catch (error) {
        console.error("Error verifying authentication:", error)
        router.push("/auth/error?message=Authentication verification failed")
      } finally {
        setChecking(false)
      }
    }

    verifyAuth()
  }, [checkAuthStatus, router])

  useEffect(() => {
    if (isAuthenticated && !checking) {
      // Start countdown and redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            if (window.opener) {
              window.close()
            } else {
              router.push("/dashboard")
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isAuthenticated, checking, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Authentication Successful!</h1>
            <p className="text-gray-300">Your Google Drive has been connected successfully.</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {checking
                ? "Verifying authentication..."
                : isAuthenticated
                  ? window.opener
                    ? `Closing window in ${countdown} seconds...`
                    : `Redirecting to dashboard in ${countdown} seconds...`
                  : "Authentication failed"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

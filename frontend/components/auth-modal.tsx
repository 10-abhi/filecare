"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { checkAuthStatus, isAuthenticated } = useAuth()
  const router = useRouter()
  const popupRef = useRef<Window | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      console.log("User authenticated, closing modal and redirecting...")
      setIsLoading(false)
      onSuccess()
      onClose()

      // Close popup if still open
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }

      //success toast
      toast.success("Authentication Successful!", {
        description: "Welcome! Redirecting to dashboard...",
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    }
  }, [isAuthenticated, isOpen, onSuccess, onClose, router])

  // Cleanup function
  const cleanup = (): void => {
    console.log("Cleaning up auth modal...")

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Close popup
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
      popupRef.current = null
    }

    setIsLoading(false)
  }

  // Cleanup on unmount or when modal closes
  useEffect(() => {
    if (!isOpen) {
      cleanup()
    }

    return cleanup
  }, [isOpen])

  if (!isOpen) return null

  const handleGoogleAuth = (): void => {
    console.log("Starting Google authentication...")
    setIsLoading(true)
    setError("")

    // Cleanup any existing popup/listeners
    cleanup()

    // Open Google OAuth in a popup
    const popup = window.open(
      buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.GOOGLE),
      "googleAuth",
      "width=500,height=600,scrollbars=yes,resizable=yes,left=" +
        (window.screen.width / 2 - 250) +
        ",top=" +
        (window.screen.height / 2 - 300),
    )

    if (!popup) {
      setError("Failed to open authentication popup. Please check your popup blocker.")
      setIsLoading(false)
      return
    }

    popupRef.current = popup

    // Monitor popup URL changes to detect success page
    intervalRef.current = setInterval(async () => {
      try {
        // Check if popup is closed
        if (popup.closed) {
          console.log("Popup was closed, checking authentication status...")
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }

          // Check if user is now authenticated
          await checkAuthStatus()

          // Small delay to ensure state is updated
          setTimeout(() => {
            if (!isAuthenticated) {
              setError("Authentication was cancelled or failed")
              setIsLoading(false)
            }
          }, 1000)
          return
        }

        // Check if popup has navigated to success page
        try {
          const popupUrl = popup.location.href
          if (popupUrl.includes("/auth/success")) {
            console.log("Success page detected, checking authentication...")
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }

            // Close the popup
            popup.close()

            // Check authentication status
            await checkAuthStatus()
          }
        } catch (e) {
          // cross-origin error is expected when popup is on different domain
          // this is normal during the OAuth flow
        }
      } catch (error) {
        console.error("Error monitoring popup:", error)
      }
    }, 1000)

    // Set timeout for authentication
    timeoutRef.current = setTimeout(() => {
      if (popupRef.current && !popupRef.current.closed) {
        console.log("Authentication timed out")
        cleanup()
        setError("Authentication timed out. Please try again.")
        toast.error("Authentication Timeout", {
          description: "Please try again.",
        })
      }
    }, 300000) 
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm sm:max-w-md bg-gray-900 border-gray-800 shadow-2xl">
        <CardHeader className="relative pb-4 sm:pb-6">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-400 hover:text-white p-1"
            onClick={() => {
              cleanup()
              onClose()
            }}
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-center text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent pr-8">
            Connect Your Drive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <p className="text-sm sm:text-base text-gray-300 px-2">
              Securely connect your Google Drive to start cleaning up unused files and reclaim storage space.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <Button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {isLoading && (
              <div className="text-center text-xs sm:text-sm text-gray-400 px-2">
                <p>A popup window has opened for authentication.</p>
                <p>Please complete the login process in the popup window.</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-400 px-2">
                By connecting, you agree to our secure access to your Google Drive metadata only.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-3 sm:pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                <span>Read-only access to file metadata</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                <span>No access to file contents</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                <span>Secure OAuth 2.0 authentication</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Home } from "lucide-react"
import { toast } from "sonner"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const errorMessage = searchParams.get("message") || "Authentication failed"

  useEffect(() => {
    toast.error("Authentication Failed", {
      description: errorMessage,
    })

    if (window.opener) {
      try {
        window.opener.postMessage(
          {
            type: "AUTH_ERROR",
            message: errorMessage,
          },
          window.location.origin,
        )
        // Close popup after a short delay to ensure message is sent
        setTimeout(() => window.close(), 500)
      } catch (error) {
        console.error("Failed to send message to opener:", error)
      }
    }
  }, [errorMessage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Authentication Failed</h1>
            <p className="text-gray-300">{errorMessage}</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full border-gray-700 hover:border-white text-white bg-transparent"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-600 rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mt-4">Loading...</h1>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}

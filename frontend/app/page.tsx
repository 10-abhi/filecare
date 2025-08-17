"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Shield, Zap, Trash2, BarChart3, Sparkles } from "lucide-react"
import Link from "next/link"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  console.log("Homepage render:", { isAuthenticated, user, isLoading, showAuthModal })

  //handle authentication success
  const handleAuthSuccess = () => {
    console.log("Auth success callback triggered")
    setShowAuthModal(false)
    //the redirect will be handled by the AuthModal
  }

  const handleAuthClick = () => {
    if (isAuthenticated) {
      console.log("User already authenticated, redirecting to dashboard")
      router.push("/dashboard")
    } else {
      console.log("Opening auth modal")
      setShowAuthModal(true)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-gray-400">Loading DriveClean...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/*navigation*/}
      <nav className="relative z-10 flex justify-between items-center p-4 sm:p-6 md:p-8">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3 h-3 sm:w-5 sm:h-5" />
          </div>
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            DriveClean
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && user && (
            <div className="text-xs sm:text-sm text-gray-300 hidden sm:block max-w-32 sm:max-w-none truncate">
              Welcome, <span className="text-blue-400">{user.name}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 bg-transparent text-xs sm:text-sm px-3 sm:px-4"
            onClick={handleAuthClick}
          >
            {isAuthenticated ? "Dashboard" : "Sign In"}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] sm:min-h-[80vh] px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Clean Your Drive
              </span>
              <br />
              <span className="text-white">Like Never Before</span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
              Automatically detect and remove unused files from your Google Drive. Reclaim space with AI-powered cleanup
              suggestions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
              onClick={handleAuthClick}
            >
              {isAuthenticated ? "Go to Dashboard" : "Connect Google Drive"}
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-gray-700 hover:border-white text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transition-all duration-300 hover:bg-white/10 bg-transparent"
              asChild
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 max-w-4xl mx-auto px-4">
          {[
            { icon: Shield, label: "Secure", value: "100%" },
            { icon: Zap, label: "Fast Cleanup", value: "<5min" },
            { icon: BarChart3, label: "Space Saved", value: "10GB+" },
          ].map((stat, index) => (
            <Card
              key={index}
              className="bg-white/5 border-gray-800 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-blue-400" />
                <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm sm:text-base text-gray-400">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Everything you need to keep your Google Drive organized and optimized
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Trash2,
                title: "Smart Cleanup",
                description: "Automatically identify and remove files that haven't been accessed in over a year",
              },
              {
                icon: BarChart3,
                title: "Usage Analytics",
                description: "Get detailed insights about your storage usage and file access patterns",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data stays private. We only access what's necessary for cleanup",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Scan thousands of files in seconds with our optimized algorithms",
              },
              {
                icon: Sparkles,
                title: "AI-Powered",
                description: "Machine learning helps identify the best files to remove safely",
              },
              {
                icon: ArrowRight,
                title: "Easy to Use",
                description: "Simple interface that makes drive cleanup effortless and intuitive",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 border-gray-800 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 group"
              >
                <CardContent className="p-4 sm:p-6">
                  <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 text-blue-400 group-hover:text-purple-400 transition-colors duration-300" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/20 backdrop-blur-sm">
            <CardContent className="p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white">
                Ready to Clean Your Drive?
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Join thousands of users who have already reclaimed their storage space
              </p>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
                onClick={handleAuthClick}
              >
                Get Started Now
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          console.log("Closing auth modal")
          setShowAuthModal(false)
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

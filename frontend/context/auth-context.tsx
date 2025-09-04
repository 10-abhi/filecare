"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { apiRequest, API_CONFIG } from "@/lib/api-config"
import type { User } from "@/types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userData: User) => void
  logout: () => void
  checkAuthStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)

  const checkAuthStatus = async (): Promise<void> => {
    // prevent multiple simultaneous auth checks
    if (isCheckingAuth) return

    setIsCheckingAuth(true)
    try {
      console.log("Checking authentication status...")
      const response = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.ME)

      if (response.ok) {
        const userData: User = await response.json()
        console.log("User authenticated:", userData)
        setUser(userData)
      } else {
        console.log("User not authenticated")
        setUser(null)
        localStorage.removeItem("lastScanTime")
        localStorage.removeItem("fileCache")
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
      setIsCheckingAuth(false)
    }
  }

  const login = (userData: User): void => {
    console.log("Logging in user:", userData)
    setUser(userData)
  }

  const logout = async (): Promise<void> => {
    console.log("Logging out user")
    try {
      setUser(null)
      localStorage.removeItem("lastScanTime")
      localStorage.removeItem("fileCache")

      // Redirect to home page
      window.location.href = "/"
    } catch (error) {
      console.error("Error during logout:", error)
      setUser(null)
      localStorage.removeItem("lastScanTime")
      localStorage.removeItem("fileCache")
    }
  }

  // check auth status on mount only
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

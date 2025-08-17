import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { AppProvider } from "@/context/app-context"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DriveClean - Smart Google Drive Cleanup",
  description: "Automatically detect and remove unused files from your Google Drive",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
          <AuthProvider>
            <AppProvider>
              {children}
              <Toaster />
            </AppProvider>
          </AuthProvider>
      </body>
    </html>
  )
}

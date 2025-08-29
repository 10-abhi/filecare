import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { AppProvider } from "@/context/app-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DriveClean - Smart Google Drive Cleanup",
  description: "Automatically detect and remove unused files from your Google Drive to free up storage space",
  keywords: ["Google Drive", "cleanup", "storage", "files", "unused files", "drive management"],
  authors: [{ name: "DriveClean Team" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "DriveClean - Smart Google Drive Cleanup",
    description: "Automatically detect and remove unused files from your Google Drive",
    type: "website",
    locale: "en_US",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <AppProvider>
              <div className="min-h-full">
                {children}
              </div>
              <Toaster 
                position="top-right"
                expand={false}
                richColors
                closeButton
                toastOptions={{
                  style: {
                    background: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                  },
                }}
              />
            </AppProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

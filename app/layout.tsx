"use client"

import type React from "react"
import dynamic from "next/dynamic"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { CursorGlow } from "@/components/ui/cursor-glow"
import { Analytics } from "@vercel/analytics/react"
import { Footer } from "@/components/layout/footer"
import { MobileFooter } from "@/components/mobile/mobile-footer"
import { MobileNavigation } from "@/components/mobile/mobile-navigation"
import { useMobile } from "@/hooks/use-mobile"
// Import the UserProvider
import { UserProvider } from "@/contexts/user-context"

const WalletProviderComponent = dynamic(
  () => import("../components/WalletProvider").then((mod) => mod.WalletProvider),
  { ssr: false },
)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isMobile = useMobile()

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="Gamerholic - Create with AI, Compete to Win" />
        <meta name="theme-color" content="#0A0A0A" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <WalletProviderComponent>
            <UserProvider>
              <CursorGlow />

              {children}
              <Analytics />
              {/* <SpeedInsights /> */}
              {!isMobile && (
                <>
                  <Footer />
                </>
              )}
              {isMobile && (
                <>
                  <MobileFooter />
                  <MobileNavigation />
                </>
              )}
            </UserProvider>
          </WalletProviderComponent>
        </ThemeProvider>
      </body>
    </html>
  )
}


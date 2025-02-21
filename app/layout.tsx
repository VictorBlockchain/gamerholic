"use client"
import type { Metadata } from "next"
import { Exo_2 } from "next/font/google"
import "./globals.css"
import { Footer } from "@/components/footer"
import { DarkThemeProvider } from "@/components/dark-theme-provider"
import { BottomNav } from "@/components/bottom-nav"
import dynamic from "next/dynamic"
import type React from "react" // Import React
import { useEffect } from "react"
import {Toaster} from "@/components/ui/toaster"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
// import { initializePlatformWalletOnLoad } from "@/lib/platformWallet"

const WalletProviderComponent = dynamic(
  () => import("../components/WalletProvider").then((mod) => mod.WalletProvider),
  { ssr: false },
)

const exo2 = Exo_2({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "Gamerholic",
//   description: "I Win For A Living - The Ultimate Crypto Gaming Platform",
//   viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // initializePlatformWalletOnLoad().catch(console.error)
  }, [])

  
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <link rel="icon" href="/favicon.ico" />
      <body className={`${exo2.className} pb-16 sm:pb-0`}>
        <DarkThemeProvider>
          <WalletProviderComponent>
            {children}
            <Analytics />
            <SpeedInsights />
            <Toaster />
            <Footer />
            <BottomNav />
          </WalletProviderComponent>
        </DarkThemeProvider>
      </body>
    </html>
  )
}


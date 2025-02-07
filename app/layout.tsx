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
// import { initializePlatformWalletOnLoad } from "@/lib/platformWallet"
import { supabase } from "@/lib/supabase"

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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // handle sign in event
      } else if (event === "SIGNED_OUT") {
        // handle sign out event
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <link rel="icon" href="/favicon.ico" />
      <body className={`${exo2.className} pb-16 sm:pb-0`}>
        <DarkThemeProvider>
          <WalletProviderComponent>
            {children}
            <Footer />
            <BottomNav />
          </WalletProviderComponent>
        </DarkThemeProvider>
      </body>
    </html>
  )
}


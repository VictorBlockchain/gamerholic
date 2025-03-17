"use client"

import { useEffect, useState, useRef } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageBackground } from "@/components/layout/page-background"
import { NewsTicker } from "@/components/ui/news-ticker"
import { AccessibilityMenu } from "@/components/ui/accessibility-improvements"
import { useMobile } from "@/hooks/use-mobile"
import {HomeDesktop} from "@/components/desktop/home/Home"
import {HomeMobile} from "@/components/mobile/home/Home"
import { MobileHeader } from "@/components/mobile/mobile-header"
import {MobileFooter} from "@/components/mobile/mobile-footer"

export default function Home() {
  
  const isMobile = useMobile()
    // News ticker items
    const newsItems = [
      { id: 1, text: "New Tournament: Cyber Showdown with $10,000 prize pool", link: "/tournaments" },
      { id: 2, text: "AI Game Creation tools updated with new features", link: "#" },
      { id: 3, text: "Join our Discord community to connect with other players", link: "#" },
      { id: 4, text: "Weekly challenge: Create a racing game and win prizes", link: "#" },
      { id: 5, text: "Maintenance scheduled for tomorrow - 2 hours downtime", link: "#" },
    ]
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      
      <PageBackground />
      {isMobile ? <MobileHeader /> : <Header /> }

      
      {/* News Ticker */}
      {!isMobile && (
            <NewsTicker
            items={newsItems}
            className="bg-black/50 backdrop-blur-md py-2 border-b border-[#222] text-sm"
            itemClassName="text-gray-300"
          />
      )}
        
        {isMobile ? <HomeMobile /> : <HomeDesktop />}
      
      
      {/* Accessibility Menu */}
      <AccessibilityMenu />

      {/* Footer */}
      {/* {isMobile ? <MobileFooter /> : <Footer /> } */}
    </div>
  )
}


"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageBackground } from "@/components/layout/page-background"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, ChevronRight, Code, Gamepad2, Globe, HeartHandshake, Layers, Trophy, Users, Zap } from "lucide-react"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { useMobile } from "@/hooks/use-mobile"
import {AboutDesktop} from "@/components/desktop/about/About"
import {AboutMobile} from "@/components/mobile/about/About"

export default function AboutPage() {
  const isMobile = useMobile()
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PageBackground />
        {isMobile ? <MobileHeader /> : <Header /> }
        {isMobile ? <AboutMobile /> : <AboutDesktop /> }
    </div>
  )
}


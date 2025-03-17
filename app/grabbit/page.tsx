"use client"

import { Header } from "@/components/layout/header"
import DesktopGrabbit from "@/components/desktop/grabbit/Grabbit"
import MobileGrabbit from "@/components/mobile/grabbit/Grabbit"
import { useMobile } from "@/hooks/use-mobile"
import { PageBackground } from "@/components/layout/page-background"
import { CursorGlow } from "@/components/ui/cursor-glow"
import { FloatingElements } from "@/components/ui/floating-elements"

export default function GrabbitPage() {
  const isMobile = useMobile()

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative">
      <PageBackground />
      <div className="absolute inset-0 pointer-events-none">
        <FloatingElements count={isMobile ? 3 : 8} />
      </div>
      {!isMobile && <CursorGlow />}
      <Header />
      {isMobile ? <MobileGrabbit /> : <DesktopGrabbit />}
    </div>
  )
}


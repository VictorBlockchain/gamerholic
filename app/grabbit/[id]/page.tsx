"use client"

import { Header } from "@/components/layout/header"
import DesktopGrabbitGame from "@/components/desktop/grabbit/GrabbitGame"
import MobileGrabbitGame from "@/components/mobile/grabbit/GrabbitGame"
import { useMobile } from "@/hooks/use-mobile"
import { useParams } from "next/navigation"
import { PageBackground } from "@/components/layout/page-background"
import { CursorGlow } from "@/components/ui/cursor-glow"
import { FloatingElements } from "@/components/ui/floating-elements"

export default function GrabbitGamePage() {
  const isMobile = useMobile()
  const params = useParams()
  const gameId = params.id as string

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative">
      <PageBackground />
      <div className="absolute inset-0 pointer-events-none">
        <FloatingElements count={isMobile ? 3 : 8} />
      </div>
      {!isMobile && <CursorGlow />}
      <Header />
      {isMobile ? <MobileGrabbitGame gameId={gameId} /> : <DesktopGrabbitGame gameId={gameId} />}
    </div>
  )
}


"use client"

import { ShopDesktop } from "@/components/desktop/shop/Shop"
import { ShopMobile } from "@/components/mobile/shop/Shop"
import { useMobile } from "@/hooks/use-mobile"
import { PageBackground } from "@/components/layout/page-background"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { Header } from "@/components/layout/header"

export default function ShopPage() {
  const isMobile = useMobile()
  
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <PageBackground />
          {isMobile ? <MobileHeader /> : <Header /> }
          {isMobile ? <ShopMobile /> : <ShopDesktop /> }
        </div>
    )
}


"use client"

import { Header } from "@/components/layout/header"
import { PageBackground } from "@/components/layout/page-background"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { useMobile } from "@/hooks/use-mobile"
import {AgreementDesktop} from "@/components/desktop/agreement/Agreement"
import {AgreementMobile} from "@/components/mobile/agreement/Agreement"

export default function AgreementPage() {
  const isMobile = useMobile()
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PageBackground />
        {isMobile ? <MobileHeader /> : <Header /> }
        {isMobile ? <AgreementMobile /> : <AgreementDesktop /> }
    </div>
  )
}


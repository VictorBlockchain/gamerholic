"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageBackground } from "@/components/layout/page-background"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Brain, ChevronRight, Edit, ExternalLink, Gamepad2, Trophy, Users } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { ProfileDesktop } from "@/components/desktop/profile/Profile"
import { ProfileMobile } from "@/components/mobile/profile/Profile"
import { MobileHeader } from "@/components/mobile/mobile-header"


export default function ProfilePage() {
    
    const isMobile = useMobile()
  
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PageBackground />
        {isMobile ? <MobileHeader /> : <Header /> }
        {isMobile ? <ProfileMobile /> : <ProfileDesktop /> }
      </div>
  )
}
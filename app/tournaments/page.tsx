"use client"
import { useState, useEffect } from "react"
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
import { TournamentsDesktop } from "@/components/desktop/tournaments/Tournaments"
import { TournamentsMobile } from "@/components/mobile/tournaments/Tournaments"
import { MobileHeader } from "@/components/mobile/mobile-header"
import {getTournaments} from "@/lib/service-tourmanent"
import {getTeams} from "@/lib/service-team"

export default function TournamentPage() {
    
    const isMobile = useMobile()
    const [tournaments, setTournaments] = useState([])
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(false)
    
    useEffect(() => {
      fetchTournaments()
      fetchTeams()
    }, [])
  
    const fetchTournaments = async () => {
      setLoading(true)
      try {
        const data:any = await getTournaments()
        if (data) {
          setTournaments(data)
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchTeams = async () => {
      setLoading(true)
      try {
        const data:any = await getTeams()
        if (data) {
          setTeams(data)
        }
      } catch (error) {
        console.error("Error fetching teams:", error)
      } finally {
        setLoading(false)
      }
    }
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PageBackground />
        {isMobile ? <MobileHeader /> : <Header /> }
        {isMobile ? <TournamentsMobile tournaments={tournaments} teams={teams} isLoading={loading} /> : <TournamentsDesktop tournaments={tournaments} teams={teams} isLoading={loading} /> }
      </div>
  )
}
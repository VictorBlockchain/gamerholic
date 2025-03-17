"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Flame } from "lucide-react"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { cn } from "@/lib/utils"

interface TeamInfo {
  name: string
  logo?: string
  score?: number
}

interface MobileMatchCardProps {
  team1: TeamInfo
  team2: TeamInfo
  status: "LIVE" | "UPCOMING" | "COMPLETED"
  game: string
  time: string
  viewers?: number
  className?: string
  onClick?: () => void
}

export function MobileMatchCard({
  team1,
  team2,
  status,
  game,
  time,
  viewers,
  className,
  onClick,
}: MobileMatchCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "LIVE":
        return "bg-[#00FFA9] text-black"
      case "UPCOMING":
        return "bg-[#FFD600] text-black"
      case "COMPLETED":
        return "bg-[#333] text-white"
    }
  }

  return (
    <Card
      className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden", className)}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge className={getStatusColor()}>{status}</Badge>
          {status === "LIVE" && viewers && (
            <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10">
              <Flame className="w-3 h-3 mr-1 text-[#FF007A]" /> {viewers.toLocaleString()} Watching
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={team1.logo || "/placeholder.svg?height=40&width=40"} alt={team1.name} />
              <AvatarFallback className="bg-[#222]">{team1.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-bold">{team1.name}</h3>
              {team1.score !== undefined && <p className="text-xl font-bold text-[#00FFA9]">{team1.score}</p>}
            </div>
          </div>

          <div className="text-sm text-gray-400">VS</div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <h3 className="text-sm font-bold">{team2.name}</h3>
              {team2.score !== undefined && <p className="text-xl font-bold text-[#FF007A]">{team2.score}</p>}
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={team2.logo || "/placeholder.svg?height=40&width=40"} alt={team2.name} />
              <AvatarFallback className="bg-[#222]">{team2.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {game} • {time}
          </span>

          {status === "LIVE" ? (
            <ButtonPressEffect>
              <Button className="h-7 text-xs rounded-full bg-[#00FFA9] hover:bg-[#00D48F] text-black">Watch Now</Button>
            </ButtonPressEffect>
          ) : status === "UPCOMING" ? (
            <ButtonPressEffect>
              <Button className="h-7 text-xs rounded-full bg-[#333] hover:bg-[#444]">Reminder</Button>
            </ButtonPressEffect>
          ) : (
            <ButtonPressEffect>
              <Button className="h-7 text-xs rounded-full bg-[#333] hover:bg-[#444]">Highlights</Button>
            </ButtonPressEffect>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


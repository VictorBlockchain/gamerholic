"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Users } from "lucide-react"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { cn } from "@/lib/utils"

interface PlayerStats {
  kd?: string
  winRate?: string
  tournaments?: number
}

interface MobilePlayerCardProps {
  name: string
  avatar: string
  role: string
  team: string
  stats: PlayerStats
  className?: string
  onClick?: () => void
}

export function MobilePlayerCard({ name, avatar, role, team, stats, className, onClick }: MobilePlayerCardProps) {
  return (
    <Card
      className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden", className)}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12 border-2 border-[#00FFA9]">
            <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
            <AvatarFallback className="bg-[#222]">{name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-base font-bold">{name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#00FFA9]">{role}</p>
              <span className="text-xs text-gray-400">•</span>
              <p className="text-xs text-gray-400">{team}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {stats.kd && (
            <div className="bg-black/30 rounded-lg p-2 text-center">
              <p className="text-sm font-bold">{stats.kd}</p>
              <p className="text-[10px] text-gray-400">K/D RATIO</p>
            </div>
          )}

          {stats.winRate && (
            <div className="bg-black/30 rounded-lg p-2 text-center">
              <p className="text-sm font-bold">{stats.winRate}</p>
              <p className="text-[10px] text-gray-400">WIN RATE</p>
            </div>
          )}

          {stats.tournaments !== undefined && (
            <div className="bg-black/30 rounded-lg p-2 text-center">
              <p className="text-sm font-bold">{stats.tournaments}</p>
              <p className="text-[10px] text-gray-400">TOURNAMENTS</p>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <ButtonPressEffect>
            <Button className="h-8 text-xs rounded-full bg-[#333] hover:bg-[#444]">
              <Trophy className="w-3 h-3 mr-1" /> Stats
            </Button>
          </ButtonPressEffect>

          <ButtonPressEffect>
            <Button className="h-8 text-xs rounded-full bg-[#00FFA9] hover:bg-[#00D48F] text-black">
              <Users className="w-3 h-3 mr-1" /> Follow
            </Button>
          </ButtonPressEffect>
        </div>
      </CardContent>
    </Card>
  )
}


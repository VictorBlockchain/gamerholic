"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Users } from "lucide-react"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { cn } from "@/lib/utils"

interface MobileTeamCardProps {
  name: string
  logo: string
  members: number
  wins: number
  rank: number
  game: string
  className?: string
  onClick?: () => void
}

export function MobileTeamCard({ name, logo, members, wins, rank, game, className, onClick }: MobileTeamCardProps) {
  return (
    <Card
      className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden", className)}
      onClick={onClick}
    >
      <div className="flex gap-4 p-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <Image
            src={logo || "/placeholder.svg"}
            alt={name}
            width={64}
            height={64}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-base font-bold">{name}</h3>
              <p className="text-xs text-gray-400">{game}</p>
            </div>
            {rank <= 3 && (
              <Badge
                className={
                  rank === 1
                    ? "bg-[#FFD600] text-black"
                    : rank === 2
                      ? "bg-[#C0C0C0] text-black"
                      : "bg-[#CD7F32] text-black"
                }
              >
                #{rank}
              </Badge>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center text-xs text-gray-400">
                <Users className="w-3 h-3 mr-1" />
                <span>{members}</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Trophy className="w-3 h-3 mr-1" />
                <span>{wins} Wins</span>
              </div>
            </div>

            <ButtonPressEffect>
              <Button className="h-7 text-xs rounded-full bg-[#333] hover:bg-[#444]">View</Button>
            </ButtonPressEffect>
          </div>
        </div>
      </div>
    </Card>
  )
}


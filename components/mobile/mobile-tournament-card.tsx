"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Clock } from "lucide-react"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { cn } from "@/lib/utils"

interface MobileTournamentCardProps {
  title: string
  game: string
  image: string
  status: "LIVE" | "REGISTERING" | "UPCOMING" | "COMPLETED"
  statusColor: string
  prize: string
  players: string
  timeLeft: string
  viewers?: number
  className?: string
  onClick?: () => void
}

export function MobileTournamentCard({
  title,
  game,
  image,
  status,
  statusColor,
  prize,
  players,
  timeLeft,
  viewers,
  className,
  onClick,
}: MobileTournamentCardProps) {
  return (
    <Card
      className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden", className)}
      onClick={onClick}
    >
      <div className="relative">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          width={400}
          height={200}
          className="w-full h-40 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <div className="absolute top-3 right-3">
          <Badge className={`${statusColor} text-black text-xs`}>{status}</Badge>
        </div>
        {status === "LIVE" && viewers && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10 text-xs">
              <Flame className="w-3 h-3 mr-1 text-[#FF007A]" /> {viewers.toLocaleString()} Watching
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-sm text-gray-400 mb-3">
          {game} • {players}
        </p>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">PRIZE POOL</p>
            <p className="text-base font-bold text-[#FFD600]">{prize}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              <span>{timeLeft}</span>
            </div>
            <ButtonPressEffect>
              <Button
                className={`rounded-full px-4 py-1 h-8 ${
                  status === "LIVE"
                    ? "bg-[#00FFA9] hover:bg-[#00D48F] text-black"
                    : status === "REGISTERING"
                      ? "bg-[#FF007A] hover:bg-[#D60067] text-white"
                      : "bg-[#333] hover:bg-[#444] text-white"
                }`}
              >
                {status === "LIVE"
                  ? "Join Now"
                  : status === "REGISTERING"
                    ? "Register"
                    : status === "UPCOMING"
                      ? "Reminder"
                      : "Results"}
              </Button>
            </ButtonPressEffect>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


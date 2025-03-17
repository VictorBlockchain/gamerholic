"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Download, Users, Clock, Gamepad2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface GameSpec {
  icon: React.ReactNode
  label: string
  value: string
}

interface GameDetailCardProps {
  title: string
  description: string
  image: string
  category: string
  rating: number
  players: string
  playTime?: string
  specs?: GameSpec[]
  price?: string
  isFree?: boolean
  isInstalled?: boolean
  className?: string
  onPlay?: () => void
  onInstall?: () => void
}

export function GameDetailCard({
  title,
  description,
  image,
  category,
  rating,
  players,
  playTime,
  specs,
  price,
  isFree,
  isInstalled,
  className,
  onPlay,
  onInstall,
}: GameDetailCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden", className)}>
      <div className="relative h-48">
        <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <div className="absolute top-3 left-3">
          <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10">{category}</Badge>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star className="w-3 h-3 text-[#FFD600]" />
          <span className="text-xs">{rating.toFixed(1)}</span>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400">{description}</p>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg">
            <Users className="w-3 h-3 text-gray-400" />
            <span className="text-xs">{players}</span>
          </div>

          {playTime && (
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs">{playTime}</span>
            </div>
          )}

          {isFree ? (
            <Badge className="bg-[#00FFA9] text-black">Free</Badge>
          ) : price ? (
            <Badge className="bg-[#FFD600] text-black">{price}</Badge>
          ) : null}
        </div>

        {specs && specs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#222]">
            <h4 className="text-xs text-gray-400 uppercase">System Requirements</h4>
            <div className="grid grid-cols-2 gap-2">
              {specs.map((spec, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {spec.icon}
                  <div>
                    <span className="text-gray-400">{spec.label}: </span>
                    <span>{spec.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          {isInstalled ? (
            <Button
              className="w-full bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full"
              onClick={onPlay}
            >
              <Gamepad2 className="mr-2 h-4 w-4" /> Play Now
            </Button>
          ) : (
            <Button
              className="w-full bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full"
              onClick={onInstall}
            >
              <Download className="mr-2 h-4 w-4" /> {isFree ? "Install" : "Buy & Install"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


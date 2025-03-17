"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Play } from "lucide-react"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { cn } from "@/lib/utils"

interface MobileGameCardProps {
  title: string
  image: string
  category: string
  players: string
  rating: number
  isNew?: boolean
  className?: string
  onClick?: () => void
}

export function MobileGameCard({
  title,
  image,
  category,
  players,
  rating,
  isNew,
  className,
  onClick,
}: MobileGameCardProps) {
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

        {isNew && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-[#FF007A] text-white text-xs">NEW</Badge>
          </div>
        )}

        <div className="absolute bottom-3 left-3">
          <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10">
            <Star className="w-3 h-3 mr-1 text-[#FFD600]" /> {rating.toFixed(1)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm text-gray-400">
              {category} • {players} players
            </p>
          </div>
        </div>

        <ButtonPressEffect>
          <Button className="w-full bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full">
            <Play className="w-4 h-4 mr-2" /> Play Now
          </Button>
        </ButtonPressEffect>
      </CardContent>
    </Card>
  )
}


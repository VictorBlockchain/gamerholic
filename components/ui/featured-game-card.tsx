"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Star, Users } from "lucide-react"
import Link from 'next/link';
interface FeaturedGameCardProps {
  title: string
  description: string
  image: string
  creator: string
  rating: number
  players: string
  tags?: string[]
  className?: string
  onPlay?: () => void
}

export function FeaturedGameCard({
  title,
  description,
  image,
  creator,
  rating,
  players,
  tags = [],
  className,
  onPlay,
}: FeaturedGameCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden", className)}>
      <div className="relative">
        <div className="aspect-video overflow-hidden">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            width={600}
            height={338}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {/* <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10"> */}
            {/* <Brain className="w-3 h-3 mr-1 text-[#00FFA9]" />
            AI CREATED
          </Badge> */}

          {tags.map((tag, index) => (
            <Badge key={index} className="bg-black/50 backdrop-blur-sm text-white border-white/10">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star className="w-3 h-3 text-[#FFD600]" />
          <span className="text-xs">{rating.toFixed(1)}</span>
        </div>
      </div>

      <CardContent className="p-6">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">{description}</p>

        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-xs text-gray-400">CREATOR</p>
            <p className="text-sm">{creator}</p>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{players}</span>
          </div>
        </div>
        
        <Link href="/grabbit">
          <Button onClick={onPlay} className="w-full bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
            Play Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}


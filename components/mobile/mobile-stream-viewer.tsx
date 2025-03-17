"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Play,
  Pause,
  Volume2,
  VolumeIcon as VolumeMute,
  Maximize,
  Flame,
  Heart,
  MessageSquare,
  Share2,
} from "lucide-react"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { cn } from "@/lib/utils"

interface MobileStreamViewerProps {
  title: string
  streamer: string
  game: string
  viewers: number
  thumbnail: string
  live?: boolean
  className?: string
}

export function MobileStreamViewer({
  title,
  streamer,
  game,
  viewers,
  thumbnail,
  live = false,
  className,
}: MobileStreamViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const toggleLike = () => {
    setIsLiked(!isLiked)
  }

  return (
    <Card className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden", className)}>
      <div className="relative">
        <Image
          src={thumbnail || "/placeholder.svg"}
          alt={title}
          width={500}
          height={300}
          className="w-full aspect-video object-cover"
        />

        {/* Overlay for video controls */}
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-3">
          {/* Top controls */}
          <div className="flex justify-between">
            {live && <Badge className="bg-[#FF007A] text-white">LIVE</Badge>}

            <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10">
              <Flame className="w-3 h-3 mr-1 text-[#FF007A]" /> {viewers.toLocaleString()}
            </Badge>
          </div>

          {/* Center play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <ButtonPressEffect>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
            </ButtonPressEffect>
          </div>

          {/* Bottom controls */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeMute className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="text-lg font-bold mb-1">{title}</h3>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`/placeholder.svg?height=24&width=24&text=${streamer.charAt(0)}`} alt={streamer} />
              <AvatarFallback className="bg-[#222] text-xs">{streamer.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{streamer}</span>
          </div>
          <span className="text-xs text-gray-400">{game}</span>
        </div>

        <div className="flex justify-between">
          <div className="flex gap-2">
            <ButtonPressEffect>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 rounded-full px-3",
                  isLiked ? "bg-[#FF007A]/20 text-[#FF007A]" : "bg-[#222] hover:bg-[#333]",
                )}
                onClick={toggleLike}
              >
                <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-[#FF007A]")} />
                <span className="text-xs">12.5k</span>
              </Button>
            </ButtonPressEffect>

            <ButtonPressEffect>
              <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 bg-[#222] hover:bg-[#333]">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span className="text-xs">Chat</span>
              </Button>
            </ButtonPressEffect>
          </div>

          <ButtonPressEffect>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#222] hover:bg-[#333]">
              <Share2 className="h-4 w-4" />
            </Button>
          </ButtonPressEffect>
        </div>
      </CardContent>
    </Card>
  )
}


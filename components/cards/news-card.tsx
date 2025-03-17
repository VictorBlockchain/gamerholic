"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface NewsCardProps {
  title: string
  excerpt: string
  image: string
  category: string
  date: string
  readTime?: string
  className?: string
  onReadMore?: () => void
}

export function NewsCard({ title, excerpt, image, category, date, readTime, className, onReadMore }: NewsCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden", className)}>
      <div className="relative">
        <div className="aspect-[16/9] relative">
          <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
        </div>
        <div className="absolute top-3 left-3">
          <Badge
            className={cn(
              category === "Update"
                ? "bg-[#00FFA9] text-black"
                : category === "Event"
                  ? "bg-[#FF007A] text-white"
                  : category === "Tournament"
                    ? "bg-[#FFD600] text-black"
                    : "bg-black/50 backdrop-blur-sm text-white border-white/10",
            )}
          >
            {category}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span>{date}</span>
          {readTime && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{readTime}</span>
              </div>
            </>
          )}
        </div>

        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{excerpt}</p>

        {onReadMore && (
          <Button
            variant="ghost"
            className="p-0 h-auto text-[#00FFA9] hover:text-[#00D48F] hover:bg-transparent"
            onClick={onReadMore}
          >
            Read More <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}


import type React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface HeroCardProps {
  title: string
  description?: string
  image: string
  badge?: {
    text: string
    color?: string
  }
  actions?: React.ReactNode
  overlay?: boolean
  className?: string
  imageClassName?: string
}

export function HeroCard({
  title,
  description,
  image,
  badge,
  actions,
  overlay = true,
  className,
  imageClassName,
}: HeroCardProps) {
  return (
    <div className={cn("relative rounded-3xl overflow-hidden group", className)}>
      <Image
        src={image || "/placeholder.svg"}
        alt={title}
        width={800}
        height={500}
        className={cn(
          "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
          imageClassName,
        )}
      />
      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        {badge && (
          <Badge className={cn("self-start mb-2", badge.color || "bg-[#00FFA9] text-black")}>{badge.text}</Badge>
        )}
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        {description && <p className="text-gray-300 mb-4">{description}</p>}
        {actions}
      </div>
    </div>
  )
}


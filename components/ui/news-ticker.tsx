"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

interface NewsItem {
  id: string | number
  text: string
  link?: string
}

interface NewsTickerProps {
  items: NewsItem[]
  speed?: number
  pauseOnHover?: boolean
  className?: string
  itemClassName?: string
}

export function NewsTicker({ items, speed = 30, pauseOnHover = true, className, itemClassName }: NewsTickerProps) {
  const [isPaused, setIsPaused] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tickerRef.current || items.length === 0) return

    const ticker = tickerRef.current
    const tickerContent = ticker.querySelector(".ticker-content") as HTMLElement

    if (!tickerContent) return

    // Clone the content to create a seamless loop
    const clone = tickerContent.cloneNode(true) as HTMLElement
    ticker.appendChild(clone)

    let animationId: number
    let startTime: number
    let position = 0

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp

      if (!isPaused) {
        // Calculate how far to move based on elapsed time and speed
        const elapsed = timestamp - startTime
        position = (position - (elapsed * speed) / 1000) % tickerContent.offsetWidth

        // Apply the transform
        tickerContent.style.transform = `translateX(${position}px)`
        clone.style.transform = `translateX(${position + tickerContent.offsetWidth}px)`

        // Reset startTime for next frame
        startTime = timestamp
      } else {
        startTime = timestamp
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [items, speed, isPaused])

  return (
    <div
      ref={tickerRef}
      className={cn("relative overflow-hidden whitespace-nowrap", className)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div className="ticker-content inline-block">
        {items.map((item) => (
          <span key={item.id} className={cn("inline-flex items-center mx-4", itemClassName)}>
            {item.link ? (
              <a href={item.link} className="hover:text-[#00FFA9] transition-colors">
                {item.text}
              </a>
            ) : (
              item.text
            )}
            <ChevronRight className="ml-2 h-4 w-4 text-[#00FFA9]" />
          </span>
        ))}
      </div>
    </div>
  )
}


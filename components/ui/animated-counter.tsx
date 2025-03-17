"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedCounterProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  formatFn?: (value: number) => string
  startOnView?: boolean
}

export function AnimatedCounter({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
  className,
  formatFn,
  startOnView = true,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const counterRef = useRef<HTMLDivElement>(null)

  const formatValue = (value: number) => {
    if (formatFn) return formatFn(value)
    return value.toString()
  }

  useEffect(() => {
    if (hasAnimated) return

    const startAnimation = () => {
      const startTime = Date.now()
      const startValue = 0

      const updateCount = () => {
        const now = Date.now()
        const elapsedTime = now - startTime

        if (elapsedTime < duration) {
          const progress = elapsedTime / duration
          // Use easeOutQuart easing function for a more natural feel
          const easeProgress = 1 - Math.pow(1 - progress, 4)
          const currentValue = Math.floor(startValue + easeProgress * (end - startValue))
          setCount(currentValue)
          requestAnimationFrame(updateCount)
        } else {
          setCount(end)
          setHasAnimated(true)
        }
      }

      requestAnimationFrame(updateCount)
    }

    if (startOnView) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            startAnimation()
            observer.disconnect()
          }
        },
        { threshold: 0.1 },
      )

      if (counterRef.current) {
        observer.observe(counterRef.current)
      }

      return () => observer.disconnect()
    } else {
      startAnimation()
    }
  }, [end, duration, hasAnimated, startOnView])

  return (
    <div ref={counterRef} className={cn("tabular-nums", className)}>
      {prefix}
      {formatValue(count)}
      {suffix}
    </div>
  )
}


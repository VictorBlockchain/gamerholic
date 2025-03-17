"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  targetDate: Date | string
  onComplete?: () => void
  className?: string
}

export function CountdownTimer({ targetDate, onComplete, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate

    const calculateTimeLeft = () => {
      const difference = +target - +new Date()

      if (difference <= 0) {
        setIsComplete(true)
        onComplete?.()
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onComplete])

  return (
    <div className={cn("flex justify-center gap-4", className)}>
      {timeLeft.days > 0 && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center mb-2">
            <span className="text-3xl font-bold text-[#00FFA9]">{timeLeft.days}</span>
          </div>
          <span className="text-xs text-gray-400">DAYS</span>
        </div>
      )}
      <div className="text-center">
        <div className="w-16 h-16 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center mb-2">
          <span className="text-3xl font-bold text-[#00FFA9]">{timeLeft.hours.toString().padStart(2, "0")}</span>
        </div>
        <span className="text-xs text-gray-400">HOURS</span>
      </div>
      <div className="text-center">
        <div className="w-16 h-16 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center mb-2">
          <span className="text-3xl font-bold text-[#00FFA9]">{timeLeft.minutes.toString().padStart(2, "0")}</span>
        </div>
        <span className="text-xs text-gray-400">MINUTES</span>
      </div>
      <div className="text-center">
        <div className="w-16 h-16 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center mb-2">
          <span className="text-3xl font-bold text-[#00FFA9]">{timeLeft.seconds.toString().padStart(2, "0")}</span>
        </div>
        <span className="text-xs text-gray-400">SECONDS</span>
      </div>
    </div>
  )
}


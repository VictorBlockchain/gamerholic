"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNotificationProps {
  type: "tournament" | "friend" | "achievement" | "system"
  title: string
  message: string
  time: string
  icon: React.ReactNode
  iconBg: string
  className?: string
  action?: () => void
}

export function MobileNotification({
  type,
  title,
  message,
  time,
  icon,
  iconBg,
  className,
  action,
}: MobileNotificationProps) {
  return (
    <Card
      className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden", className)}
      onClick={action}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-xs text-gray-400">{message}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 mb-1">{time}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


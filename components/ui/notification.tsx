"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NotificationProps {
  title: string
  description?: string
  icon?: React.ReactNode
  variant?: "success" | "error" | "warning" | "info"
  duration?: number
  onClose?: () => void
  className?: string
}

export function Notification({
  title,
  description,
  icon,
  variant = "info",
  duration = 5000,
  onClose,
  className,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  const variantStyles = {
    success: {
      gradientFrom: "from-[#00FFA9]",
      gradientTo: "to-[#00C3FF]",
      bgColor: "bg-[#00FFA9]/20",
      textColor: "text-[#00FFA9]",
    },
    error: {
      gradientFrom: "from-[#FF007A]",
      gradientTo: "to-[#FF6B00]",
      bgColor: "bg-[#FF007A]/20",
      textColor: "text-[#FF007A]",
    },
    warning: {
      gradientFrom: "from-[#FFD600]",
      gradientTo: "to-[#FF6B00]",
      bgColor: "bg-[#FFD600]/20",
      textColor: "text-[#FFD600]",
    },
    info: {
      gradientFrom: "from-[#00C3FF]",
      gradientTo: "to-[#00FFA9]",
      bgColor: "bg-[#00C3FF]/20",
      textColor: "text-[#00C3FF]",
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "max-w-sm w-full bg-[#111] border border-[#333] rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-top-5",
        className,
      )}
    >
      <div className="relative">
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r ${styles.gradientFrom} ${styles.gradientTo} opacity-30 rounded-xl blur-sm`}
        ></div>
        <div className="relative p-4">
          <div className="flex items-start gap-4">
            {icon && (
              <div
                className={`w-10 h-10 rounded-full ${styles.bgColor} flex items-center justify-center flex-shrink-0`}
              >
                {icon}
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium text-white mb-1">{title}</h4>
              {description && <p className="text-sm text-gray-400">{description}</p>}
            </div>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => {
                setIsVisible(false)
                onClose?.()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


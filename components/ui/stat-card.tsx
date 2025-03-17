import type React from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  description?: string
  trend?: {
    value: string
    positive?: boolean
  }
  className?: string
}

export function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
  return (
    <div
      className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden p-6", className)}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-gray-400">{title}</h3>
        {icon && icon}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {trend && (
        <p className={cn("text-sm", trend.positive ? "text-[#00FFA9]" : "text-[#FF007A]")}>
          {trend.positive ? "+" : ""}
          {trend.value}
        </p>
      )}
      {description && <p className="text-sm text-gray-400 mt-2">{description}</p>}
    </div>
  )
}


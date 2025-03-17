import type React from "react"
import { cn } from "@/lib/utils"

interface TimelineItemProps {
  title: string
  description?: string
  timestamp?: string
  icon?: React.ReactNode
  status?: "completed" | "current" | "upcoming"
  children?: React.ReactNode
  className?: string
}

export function TimelineItem({
  title,
  description,
  timestamp,
  icon,
  status = "upcoming",
  children,
  className,
}: TimelineItemProps) {
  const statusStyles = {
    completed: {
      dotBg: "bg-[#00FFA9]/20",
      dotBorder: "border-[#00FFA9]",
      dotInner: "bg-[#00FFA9]",
    },
    current: {
      dotBg: "bg-[#FF007A]/20",
      dotBorder: "border-[#FF007A]",
      dotInner: "bg-[#FF007A]",
    },
    upcoming: {
      dotBg: "bg-[#222]",
      dotBorder: "border-[#333]",
      dotInner: "bg-[#555]",
    },
  }

  const styles = statusStyles[status]

  return (
    <div className={cn("relative pl-8 pb-8", className)}>
      <div className="absolute top-0 left-0 h-full w-px bg-[#333]"></div>
      <div
        className={`absolute top-0 left-0 w-6 h-6 rounded-full ${styles.dotBg} border ${styles.dotBorder} flex items-center justify-center -translate-x-1/2`}
      >
        {icon || <div className={`w-2 h-2 rounded-full ${styles.dotInner}`}></div>}
      </div>
      <div className="bg-black/30 rounded-lg border border-[#333] p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-white">{title}</h4>
          {status === "completed" && (
            <div className="bg-[#00FFA9] text-black text-xs font-medium px-2 py-0.5 rounded-full">Completed</div>
          )}
          {status === "current" && (
            <div className="bg-[#FF007A] text-white text-xs font-medium px-2 py-0.5 rounded-full">In Progress</div>
          )}
          {status === "upcoming" && (
            <div className="bg-[#222] text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">Upcoming</div>
          )}
        </div>
        {description && <p className="text-sm text-gray-400 mb-2">{description}</p>}
        {children}
        {timestamp && (
          <div className="text-xs text-gray-500 flex items-center mt-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {timestamp}
          </div>
        )}
      </div>
    </div>
  )
}

interface TimelineProps {
  children: React.ReactNode
  className?: string
}

export function Timeline({ children, className }: TimelineProps) {
  return <div className={cn("space-y-0", className)}>{children}</div>
}


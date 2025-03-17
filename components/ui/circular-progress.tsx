import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  labelClassName?: string
  className?: string
  color?: string
  backgroundColor?: string
}

export function CircularProgress({
  value,
  max = 100,
  size = 100,
  strokeWidth = 8,
  showLabel = true,
  labelClassName,
  className,
  color = "#00FFA9",
  backgroundColor = "#222",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / max) * circumference

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="transition-all duration-300 ease-in-out"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-300 ease-in-out"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-sm font-medium", labelClassName)}>{Math.round((value / max) * 100)}%</span>
        </div>
      )}
    </div>
  )
}


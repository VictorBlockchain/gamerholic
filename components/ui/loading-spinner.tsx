import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  color?: string
  className?: string
}

export function LoadingSpinner({ size = "md", color = "#00FFA9", className }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-solid border-current border-e-transparent",
        sizeMap[size],
        className,
      )}
      style={{ color }}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}


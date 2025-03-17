import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface GlowingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string
  hoverScale?: boolean
  pulseGlow?: boolean
  className?: string
  glowClassName?: string
}

export const GlowingButton = forwardRef<HTMLButtonElement, GlowingButtonProps>(
  (
    {
      children,
      glowColor = "from-[#00FFA9] to-[#00C3FF]",
      hoverScale = true,
      pulseGlow = false,
      className,
      glowClassName,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="relative group">
        <div
          className={cn(
            "absolute -inset-0.5 bg-gradient-to-r opacity-70 group-hover:opacity-100 rounded-full blur-sm transition duration-200",
            pulseGlow && "animate-pulse",
            glowColor,
            glowClassName,
          )}
        ></div>
        <button
          ref={ref}
          className={cn(
            "relative bg-[#111] hover:bg-[#222] border border-[#333] text-white rounded-full px-4 py-2 transition-all",
            hoverScale && "group-hover:scale-[1.02]",
            className,
          )}
          {...props}
        >
          {children}
        </button>
      </div>
    )
  },
)

GlowingButton.displayName = "GlowingButton"


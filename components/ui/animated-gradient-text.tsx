"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

interface AnimatedGradientTextProps {
  text: string
  className?: string
  gradientColors?: string[]
}

export function AnimatedGradientText({
  text,
  className,
  gradientColors = ["#00FFA9", "#00C3FF", "#FF007A"],
}: AnimatedGradientTextProps) {
  const textRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!textRef.current) return

    const element = textRef.current

    // Only run animation on client-side
    if (typeof window === "undefined") return

    // Create gradient
    const gradientId = `gradient-${Math.random().toString(36).substring(2, 9)}`
    const svgNS = "http://www.w3.org/2000/svg"
    const svg = document.createElementNS(svgNS, "svg")
    svg.setAttribute("style", "position: absolute; width: 0; height: 0")

    const defs = document.createElementNS(svgNS, "defs")
    const linearGradient = document.createElementNS(svgNS, "linearGradient")
    linearGradient.setAttribute("id", gradientId)
    linearGradient.setAttribute("x1", "0%")
    linearGradient.setAttribute("y1", "0%")
    linearGradient.setAttribute("x2", "100%")
    linearGradient.setAttribute("y2", "0%")

    gradientColors.forEach((color, index) => {
      const stop = document.createElementNS(svgNS, "stop")
      stop.setAttribute("offset", `${(index / (gradientColors.length - 1)) * 100}%`)
      stop.setAttribute("stop-color", color)
      linearGradient.appendChild(stop)
    })

    defs.appendChild(linearGradient)
    svg.appendChild(defs)
    document.body.appendChild(svg)

    // Apply gradient
    element.style.backgroundImage = `linear-gradient(90deg, ${gradientColors.join(", ")})`
    element.style.backgroundSize = "200% 100%"
    element.style.backgroundClip = "text"
    element.style.color = "transparent"
    element.style.WebkitBackgroundClip = "text"
    element.style.WebkitTextFillColor = "transparent"

    // Animate gradient
    let position = 0
    const animateGradient = () => {
      position = (position + 1) % 200
      element.style.backgroundPosition = `${position}% 50%`
      requestAnimationFrame(animateGradient)
    }

    const animationId = requestAnimationFrame(animateGradient)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      if (document.body.contains(svg)) {
        document.body.removeChild(svg)
      }
    }
  }, [gradientColors])

  return (
    <h1 ref={textRef} className={cn("transition-all duration-300", className)}>
      {text}
    </h1>
  )
}


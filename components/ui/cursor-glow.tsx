"use client"

import { useEffect, useState } from "react"

interface CursorGlowProps {
  color?: string
  size?: number
  blur?: number
  opacity?: number
  delay?: number
}

export function CursorGlow({
  color = "#00FFA9",
  size = 400,
  blur = 100,
  opacity = 0.15,
  delay = 0.1,
}: CursorGlowProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return

    let timeoutId: NodeJS.Timeout

    const handleMouseMove = (e: MouseEvent) => {
      clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        setPosition({ x: e.clientX, y: e.clientY })
        setIsVisible(true)
      }, delay * 1000)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    document.body.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.body.removeEventListener("mouseleave", handleMouseLeave)
      clearTimeout(timeoutId)
    }
  }, [delay])

  if (typeof window === "undefined") return null

  return (
    <div
      className="fixed pointer-events-none z-50 transition-opacity duration-500"
      style={{
        left: position.x - size / 2,
        top: position.y - size / 2,
        width: size,
        height: size,
        opacity: isVisible ? opacity : 0,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        transform: "translate3d(0, 0, 0)",
        willChange: "left, top",
      }}
    />
  )
}


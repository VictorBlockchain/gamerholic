"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface FloatingElement {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  blur: number
  color: string
}

interface FloatingElementsProps {
  count?: number
  className?: string
  colors?: string[]
  minSize?: number
  maxSize?: number
  minSpeed?: number
  maxSpeed?: number
}

export function FloatingElements({
  count = 10,
  className,
  colors = ["#00FFA9", "#00C3FF", "#FF007A"],
  minSize = 5,
  maxSize = 20,
  minSpeed = 0.2,
  maxSpeed = 1,
}: FloatingElementsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const elementsRef = useRef<FloatingElement[]>([])
  const animationRef = useRef<number>()

  // Initialize elements
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const { width, height } = container.getBoundingClientRect()

    // Create elements
    elementsRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: minSize + Math.random() * (maxSize - minSize),
      speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
      opacity: 0.1 + Math.random() * 0.3,
      blur: 2 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))

    // Create DOM elements
    elementsRef.current.forEach((element) => {
      const el = document.createElement("div")
      el.id = `floating-element-${element.id}`
      el.style.position = "absolute"
      el.style.width = `${element.size}px`
      el.style.height = `${element.size}px`
      el.style.borderRadius = "50%"
      el.style.backgroundColor = element.color
      el.style.opacity = element.opacity.toString()
      el.style.filter = `blur(${element.blur}px)`
      el.style.left = `${element.x}px`
      el.style.top = `${element.y}px`
      el.style.pointerEvents = "none"
      container.appendChild(el)
    })

    // Animation function
    const animate = () => {
      elementsRef.current.forEach((element) => {
        const el = document.getElementById(`floating-element-${element.id}`)
        if (!el) return

        // Update position
        element.y -= element.speed

        // Reset position if out of bounds
        if (element.y < -element.size) {
          element.y = height + element.size
          element.x = Math.random() * width
        }

        // Apply position
        el.style.transform = `translate(${element.x}px, ${element.y}px)`
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      elementsRef.current.forEach((element) => {
        const el = document.getElementById(`floating-element-${element.id}`)
        if (el && container.contains(el)) {
          container.removeChild(el)
        }
      })
    }
  }, [count, colors, minSize, maxSize, minSpeed, maxSpeed])

  return <div ref={containerRef} className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)} />
}


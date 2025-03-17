"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MicroInteractionsProps {
  children: ReactNode
  delay?: number
  duration?: number
  type?: "fade" | "scale" | "slide" | "bounce"
  className?: string
}

export function MicroInteractions({
  children,
  delay = 0,
  duration = 0.3,
  type = "fade",
  className = "",
}: MicroInteractionsProps) {
  const getAnimationVariants = () => {
    switch (type) {
      case "scale":
        return {
          hidden: { scale: 0.9, opacity: 0 },
          visible: { scale: 1, opacity: 1 },
        }
      case "slide":
        return {
          hidden: { y: 20, opacity: 0 },
          visible: { y: 0, opacity: 1 },
        }
      case "bounce":
        return {
          hidden: { y: 20, opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 15,
            },
          },
        }
      case "fade":
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={getAnimationVariants()}
      transition={{ duration, delay }}
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}

interface ButtonPressEffectProps {
  children: ReactNode
  className?: string
}

export function ButtonPressEffect({ children, className = "" }: ButtonPressEffectProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

interface HoverGlowProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function HoverGlow({ children, className, glowColor = "rgba(0, 255, 169, 0.3)" }: HoverGlowProps) {
  return (
    <div className={cn("relative group", className)}>
      <div
        className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg blur-md"
        style={{ background: glowColor }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

interface PulseEffectProps {
  children: React.ReactNode
  className?: string
  pulseColor?: string
  pulseSize?: number
  pulseSpeed?: number
}

export function PulseEffect({
  children,
  className,
  pulseColor = "rgba(0, 255, 169, 0.3)",
  pulseSize = 1.1,
  pulseSpeed = 2,
}: PulseEffectProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          animation: `pulse ${pulseSpeed}s infinite alternate`,
          background: pulseColor,
          filter: "blur(8px)",
        }}
      />
      <div className="relative">{children}</div>
      <style jsx global>{`
        @keyframes pulse {
          0% {
            opacity: 0.3;
            transform: scale(1);
          }
          100% {
            opacity: 0.6;
            transform: scale(${pulseSize});
          }
        }
      `}</style>
    </div>
  )
}


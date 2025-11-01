'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface GamingBadgeProps {
  children: React.ReactNode
  variant?: 'victory' | 'power' | 'danger' | 'mystic' | 'cosmic' | 'neon' | 'shadow'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  glowing?: boolean
  pulse?: boolean
  className?: string
}

const variantStyles = {
  victory: {
    bg: 'bg-gradient-to-r from-amber-500/20 to-orange-600/20',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/30'
  },
  power: {
    bg: 'bg-gradient-to-r from-purple-500/20 to-pink-600/20',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/30'
  },
  danger: {
    bg: 'bg-gradient-to-r from-red-500/20 to-pink-600/20',
    border: 'border-red-500/40',
    text: 'text-red-400',
    glow: 'shadow-red-500/30'
  },
  mystic: {
    bg: 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20',
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/30'
  },
  cosmic: {
    bg: 'bg-gradient-to-r from-violet-500/20 to-fuchsia-600/20',
    border: 'border-violet-500/40',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/30'
  },
  neon: {
    bg: 'bg-gradient-to-r from-green-500/20 to-emerald-600/20',
    border: 'border-green-500/40',
    text: 'text-green-400',
    glow: 'shadow-green-500/30'
  },
  shadow: {
    bg: 'bg-gradient-to-r from-gray-500/20 to-gray-600/20',
    border: 'border-gray-500/40',
    text: 'text-gray-400',
    glow: 'shadow-gray-500/30'
  }
}

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base'
}

export function GamingBadge({
  children,
  variant = 'victory',
  size = 'md',
  animated = false,
  glowing = false,
  pulse = false,
  className
}: GamingBadgeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  return (
    <div className="relative inline-block">
      {/* Glow effect */}
      {glowing && (
        <div 
          className={cn(
            "absolute inset-0 rounded-full blur-md transition-all duration-300 -z-10",
            variantStyle.glow,
            isHovered ? "opacity-100 scale-110" : "opacity-50 scale-100"
          )}
        />
      )}

      <Badge
        variant="outline"
        className={cn(
          "relative overflow-hidden border font-medium transition-all duration-300",
          "hover:scale-105 active:scale-95",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
          variantStyle.bg,
          variantStyle.border,
          variantStyle.text,
          sizeStyle,
          glowing && "shadow-lg",
          animated && "animate-pulse",
          pulse && "animate-pulse",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="relative z-10 flex items-center gap-1.5">
          {children}
        </span>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700" />
        </div>
      </Badge>
    </div>
  )
}
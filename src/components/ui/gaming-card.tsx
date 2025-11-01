'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GamingCardProps {
  children: React.ReactNode
  variant?: 'victory' | 'power' | 'mystic' | 'cosmic' | 'shadow' | 'neon' | 'danger'
  glow?: boolean
  animated?: boolean
  hover?: boolean
  className?: string
  header?: {
    title: string
    subtitle?: string
    icon?: React.ReactNode
  }
}

const variantStyles = {
  victory: {
    border: 'border-amber-500/30',
    bg: 'bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-orange-600/5',
    glow: 'shadow-amber-500/20 hover:shadow-amber-500/40',
    headerBg: 'bg-gradient-to-r from-amber-500/10 to-orange-600/10',
    headerBorder: 'border-amber-500/30'
  },
  power: {
    border: 'border-purple-500/30',
    bg: 'bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-600/5',
    glow: 'shadow-purple-500/20 hover:shadow-purple-500/40',
    headerBg: 'bg-gradient-to-r from-purple-500/10 to-pink-600/10',
    headerBorder: 'border-purple-500/30'
  },
  mystic: {
    border: 'border-cyan-500/30',
    bg: 'bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-indigo-600/5',
    glow: 'shadow-cyan-500/20 hover:shadow-cyan-500/40',
    headerBg: 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10',
    headerBorder: 'border-cyan-500/30'
  },
  cosmic: {
    border: 'border-violet-500/30',
    bg: 'bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-600/5',
    glow: 'shadow-violet-500/20 hover:shadow-violet-500/40',
    headerBg: 'bg-gradient-to-r from-violet-500/10 to-fuchsia-600/10',
    headerBorder: 'border-violet-500/30'
  },
  shadow: {
    border: 'border-gray-500/30',
    bg: 'bg-gradient-to-br from-gray-500/5 via-gray-600/5 to-gray-700/5',
    glow: 'shadow-gray-500/20 hover:shadow-gray-500/40',
    headerBg: 'bg-gradient-to-r from-gray-500/10 to-gray-600/10',
    headerBorder: 'border-gray-500/30'
  },
  neon: {
    border: 'border-green-500/30',
    bg: 'bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-600/5',
    glow: 'shadow-green-500/20 hover:shadow-green-500/40',
    headerBg: 'bg-gradient-to-r from-green-500/10 to-emerald-600/10',
    headerBorder: 'border-green-500/30'
  },
  danger: {
    border: 'border-red-500/30',
    bg: 'bg-gradient-to-br from-red-500/5 via-rose-500/5 to-pink-600/5',
    glow: 'shadow-red-500/20 hover:shadow-red-500/40',
    headerBg: 'bg-gradient-to-r from-red-500/10 to-pink-600/10',
    headerBorder: 'border-red-500/30'
  }
}

export function GamingCard({
  children,
  variant = 'victory',
  glow = true,
  animated = false,
  hover = true,
  className,
  header
}: GamingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const variantStyle = variantStyles[variant] || variantStyles.victory

  return (
    <div className="relative">
      {/* Animated glow background */}
      {glow && (
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl blur-xl transition-all duration-500 -z-10",
            variantStyle.glow,
            isHovered ? "opacity-100 scale-105" : "opacity-50 scale-100",
            animated && "animate-pulse"
          )}
        />
      )}

      {/* Main card */}
      <Card 
        className={cn(
          "relative overflow-hidden border transition-all duration-300",
          "bg-gradient-to-br from-gray-900 via-gray-900 to-black",
          variantStyle.border,
          variantStyle.bg,
          glow && "shadow-xl",
          hover && "hover:scale-[1.02] hover:shadow-2xl",
          animated && "animate-pulse",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated corner decorations */}
        <div className="absolute top-0 left-0 w-8 h-8">
          <div className={cn(
            "absolute top-2 left-2 w-4 h-4 rounded-full blur-sm animate-pulse",
            variant === 'victory' && "bg-amber-400/50",
            variant === 'power' && "bg-purple-400/50",
            variant === 'mystic' && "bg-cyan-400/50",
            variant === 'cosmic' && "bg-violet-400/50",
            variant === 'shadow' && "bg-gray-400/50",
            variant === 'neon' && "bg-green-400/50",
            variant === 'danger' && "bg-red-400/50"
          )} />
        </div>
        
        <div className="absolute top-0 right-0 w-8 h-8">
          <div className={cn(
            "absolute top-2 right-2 w-4 h-4 rounded-full blur-sm animate-pulse delay-75",
            variant === 'victory' && "bg-orange-400/50",
            variant === 'power' && "bg-pink-400/50",
            variant === 'mystic' && "bg-blue-400/50",
            variant === 'cosmic' && "bg-fuchsia-400/50",
            variant === 'shadow' && "bg-gray-400/50",
            variant === 'neon' && "bg-emerald-400/50",
            variant === 'danger' && "bg-rose-400/50"
          )} />
        </div>

        {/* Header */}
        {header && (
          <CardHeader className={cn(
            "pb-4 border-b",
            variantStyle.headerBorder,
            variantStyle.headerBg
          )}>
            <div className="flex items-center gap-3">
              {header.icon && (
                <div className="flex-shrink-0">
                  {header.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-white text-lg font-bold truncate">
                  {header.title}
                </CardTitle>
                {header.subtitle && (
                  <p className="text-sm text-gray-400 truncate">{header.subtitle}</p>
                )}
              </div>
            </div>
          </CardHeader>
        )}

        {/* Content */}
        <CardContent className={cn(
          "relative",
          header ? "pt-4" : "pt-6"
        )}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-black transform rotate-45 scale-150" />
          </div>
          
          <div className="relative z-10">
            {children}
          </div>
        </CardContent>

        {/* Hover overlay effect */}
        {hover && (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          )} />
        )}
      </Card>
    </div>
  )
}
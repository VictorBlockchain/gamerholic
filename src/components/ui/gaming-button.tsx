'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface GamingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'victory' | 'power' | 'danger' | 'mystic' | 'cosmic' | 'neon' | 'shadow' | 'plasma'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  pulse?: boolean
  neon?: boolean
  children: React.ReactNode
}

const variantStyles = {
  victory: {
    base: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-700 text-white border-amber-400/30',
    glow: 'shadow-amber-500/50 hover:shadow-amber-500/70',
    neon: 'shadow-amber-500/60',
    text: 'text-white'
  },
  power: {
    base: 'bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-700 text-white border-purple-400/30',
    glow: 'shadow-purple-500/50 hover:shadow-purple-500/70',
    neon: 'shadow-purple-500/60',
    text: 'text-white'
  },
  danger: {
    base: 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 hover:from-red-600 hover:via-rose-600 hover:to-pink-700 text-white border-red-400/30',
    glow: 'shadow-red-500/50 hover:shadow-red-500/70',
    neon: 'shadow-red-500/60',
    text: 'text-white'
  },
  mystic: {
    base: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 text-white border-cyan-400/30',
    glow: 'shadow-cyan-500/50 hover:shadow-cyan-500/70',
    neon: 'shadow-cyan-500/60',
    text: 'text-white'
  },
  cosmic: {
    base: 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-700 text-white border-violet-400/30',
    glow: 'shadow-violet-500/50 hover:shadow-violet-500/70',
    neon: 'shadow-violet-500/60',
    text: 'text-white'
  },
  neon: {
    base: 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white border-green-400/30',
    glow: 'shadow-green-500/50 hover:shadow-green-500/70',
    neon: 'shadow-green-500/60',
    text: 'text-white'
  },
  shadow: {
    base: 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-800 hover:from-gray-800 hover:via-gray-700 hover:to-gray-900 text-white border-gray-500/30',
    glow: 'shadow-gray-500/50 hover:shadow-gray-500/70',
    neon: 'shadow-gray-500/60',
    text: 'text-white'
  },
  plasma: {
    base: 'bg-gradient-to-r from-orange-500 via-red-500 to-yellow-600 hover:from-orange-600 hover:via-red-600 hover:to-yellow-700 text-white border-orange-400/30',
    glow: 'shadow-orange-500/50 hover:shadow-orange-500/70',
    neon: 'shadow-orange-500/60',
    text: 'text-white'
  }
}

const sizeStyles = {
  sm: 'h-8 px-3 text-xs font-bold',
  md: 'h-10 px-4 text-sm font-bold',
  lg: 'h-12 px-6 text-base font-bold',
  xl: 'h-14 px-8 text-lg font-bold'
}

export function GamingButton({
  variant = 'victory',
  size = 'md',
  glow = true,
  pulse = false,
  neon = false,
  className,
  children,
  ...props
}: GamingButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  return (
    <div className="relative inline-block">
      {/* Animated background glow */}
      {glow && (
        <div 
          className={cn(
            "absolute inset-0 rounded-xl blur-xl transition-all duration-300 -z-10",
            variantStyle.glow,
            isHovered ? "opacity-100 scale-110" : "opacity-50 scale-100",
            pulse && "animate-pulse"
          )}
        />
      )}
      
      {/* Neon border effect */}
      {neon && (
        <div 
          className={cn(
            "absolute inset-0 rounded-xl transition-all duration-300 -z-10",
            variantStyle.neon,
            isHovered ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Main button */}
      <Button
        className={cn(
          "relative overflow-hidden rounded-xl border transition-all duration-300 transform",
          "hover:scale-105 active:scale-95",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
          "after:absolute after:inset-0 after:bg-gradient-to-t after:from-transparent after:to-white/10 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300",
          variantStyle.base,
          sizeStyle,
          glow && "shadow-lg",
          isPressed && "scale-95",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setIsPressed(false)
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000" />
        </div>
      </Button>
    </div>
  )
}
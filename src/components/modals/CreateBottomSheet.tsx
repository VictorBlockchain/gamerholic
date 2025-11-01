'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Sword, Trophy, Users, ArrowRight, Zap, Sparkles, Flame, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CreateBottomSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateBottomSheet({ isOpen, onClose }: CreateBottomSheetProps) {
  const router = useRouter()
  const sheetRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const createOptions = [
    {
      id: 'challenge',
      title: 'Challenge',
      subtitle: 'HEADS UP BATTLE',
      description: 'Create intense 1v1 challenges',
      icon: Sword,
      gradient: 'from-red-600 via-orange-500 to-yellow-500',
      href: '/challenge/create',
      glowColor: 'red',
      badge: 'HOT',
      particleColor: 'from-red-500 to-orange-500',
    },
    {
      id: 'tournament',
      title: 'Tournament',
      subtitle: 'EPIC COMPETITION',
      description: 'Host massive tournaments',
      icon: Trophy,
      gradient: 'from-amber-500 via-yellow-500 to-orange-500',
      href: '/tournament/create',
      glowColor: 'amber',
      badge: 'NEW',
      particleColor: 'from-amber-500 to-yellow-500',
    },
    {
      id: 'team',
      title: 'Team',
      subtitle: 'SQUAD UP',
      description: 'Build your dream team',
      icon: Users,
      gradient: 'from-purple-600 via-pink-500 to-red-500',
      href: '/team/create',
      glowColor: 'purple',
      badge: 'PRO',
      particleColor: 'from-purple-500 to-pink-500',
    },
  ]

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleBodyScroll = (e: Event) => {
      if (isOpen) {
        e.preventDefault()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      document.body.addEventListener('touchmove', handleBodyScroll, { passive: false })
    } else {
      document.body.style.overflow = ''
      document.body.removeEventListener('touchmove', handleBodyScroll)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      document.body.removeEventListener('touchmove', handleBodyScroll)
    }
  }, [isOpen, onClose])

  const handleOptionClick = (option: typeof createOptions[0]) => {
    // Enhanced haptic feedback pattern
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50])
    }
    
    // Set animation state
    setIsAnimating(true)
    
    // Close sheet first
    onClose()
    
    // Navigate after a short delay for smooth transition
    setTimeout(() => {
      router.push(option.href)
      setIsAnimating(false)
    }, 300)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay with animated gradient */}
      <div
        ref={overlayRef}
        className={cn(
          "fixed inset-0 z-50 transition-all duration-500 md:hidden",
          isOpen 
            ? "bg-gradient-to-br from-black/80 via-purple-900/40 to-black/80 backdrop-blur-md" 
            : "bg-transparent"
        )}
        onClick={handleOverlayClick}
      >
        {/* Animated particles in background */}
        {isOpen && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              >
                <div className={cn(
                  "w-1 h-1 rounded-full opacity-60",
                  i % 3 === 0 ? "bg-red-500" : i % 3 === 1 ? "bg-amber-500" : "bg-purple-500"
                )} />
              </div>
            ))}
          </div>
        )}

        {/* Bottom Sheet with gaming design */}
        <div
          ref={sheetRef}
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out",
            isOpen ? "translate-y-0" : "translate-y-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gaming-style top border with animated glow */}
          <div className="relative">
            <div className="h-2 bg-gradient-to-r from-red-600 via-amber-500 to-purple-600 animate-pulse" />
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-amber-500 to-purple-600 blur-lg animate-pulse" />
            
            {/* Handle bar with gaming design */}
            <div className="flex justify-center py-4 bg-gradient-to-b from-gray-900/90 to-black/90">
              <div className="relative">
                <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
                <div className="absolute inset-0 w-16 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-sm" />
              </div>
            </div>
          </div>

          {/* Gaming Header */}
          <div className="px-6 pb-6 bg-gradient-to-b from-black/90 to-gray-900/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Gaming icon with animation */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center animate-pulse">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl blur-lg animate-pulse" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                    CREATE BATTLE
                  </h2>
                  <p className="text-amber-200/70 text-sm font-medium">Choose your arena</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 transition-all duration-300"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Gaming Options */}
          <div className="px-6 pb-8 bg-gradient-to-b from-gray-900/90 to-black/95 space-y-4">
            {createOptions.map((option, index) => {
              const Icon = option.icon
              const isHovered = hoveredOption === option.id
              
              return (
                <div key={option.id} className="relative">
                  {/* Hover glow effect */}
                  {isHovered && (
                    <div className={cn(
                      "absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300",
                      `bg-gradient-to-r ${option.particleColor} opacity-30`
                    )} />
                  )}
                  
                  <button
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setHoveredOption(option.id)}
                    onMouseLeave={() => setHoveredOption(null)}
                    className={cn(
                      "relative w-full p-6 rounded-2xl border transition-all duration-300 group",
                      "bg-gradient-to-br from-gray-800/50 to-black/50 backdrop-blur-sm",
                      "border-gray-700/50 hover:border-gray-600/70",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      isAnimating && "animate-pulse",
                      "overflow-hidden"
                    )}
                  >
                    {/* Hover glow effect - behind content */}
                    {isHovered && (
                      <div className={cn(
                        "absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300 -z-10",
                        `bg-gradient-to-r ${option.particleColor} opacity-30`
                      )} />
                    )}
                    
                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        {/* Gaming Icon Container */}
                        <div className="relative">
                          {/* Animated rings */}
                          <div className={cn(
                            "absolute -inset-3 rounded-xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                            `border-${option.glowColor}-500/30 animate-spin-slow`
                          )} />
                          
                          {/* Icon background */}
                          <div className={cn(
                            "relative w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300",
                            `bg-gradient-to-br ${option.gradient}`,
                            "group-hover:scale-110 group-hover:shadow-2xl",
                            `group-hover:shadow-${option.glowColor}-500/50`
                          )}>
                            <Icon className="h-8 w-8 text-white drop-shadow-lg" />
                            
                            {/* Badge */}
                            <div className={cn(
                              "absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold text-white",
                              option.badge === 'HOT' && "bg-gradient-to-r from-red-600 to-orange-600",
                              option.badge === 'NEW' && "bg-gradient-to-r from-green-600 to-emerald-600",
                              option.badge === 'PRO' && "bg-gradient-to-r from-purple-600 to-pink-600"
                            )}>
                              {option.badge}
                            </div>
                          </div>
                          
                          {/* Particle effects on hover */}
                          {isHovered && (
                            <div className="absolute inset-0 pointer-events-none">
                              {[...Array(4)].map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "absolute w-1 h-1 rounded-full animate-ping",
                                    i % 2 === 0 ? "bg-amber-400" : "bg-orange-400"
                                  )}
                                  style={{
                                    left: `${50 + (i - 1.5) * 30}%`,
                                    top: `${50 + (i - 1.5) * 30}%`,
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: '1s'
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="text-left">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-xl font-bold text-white">{option.title}</h3>
                            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                          </div>
                          <p className={cn(
                            "text-xs font-bold mb-2 tracking-wider",
                            option.id === 'challenge' && "text-red-400",
                            option.id === 'tournament' && "text-amber-400",
                            option.id === 'team' && "text-purple-400"
                          )}>
                            {option.subtitle}
                          </p>
                          <p className="text-gray-400 text-sm">{option.description}</p>
                        </div>
                      </div>

                      {/* Gaming Arrow */}
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                        "bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-gray-600 group-hover:to-gray-700",
                        "group-hover:scale-110 group-hover:rotate-12"
                      )}>
                        <ArrowRight className={cn(
                          "h-6 w-6 transition-colors duration-300",
                          "text-gray-400 group-hover:text-white"
                        )} />
                      </div>
                    </div>

                    {/* Animated border gradient */}
                    <div className={cn(
                      "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20",
                      `bg-gradient-to-r ${option.gradient} p-[1px]`
                    )}>
                      <div className="w-full h-full rounded-2xl bg-gray-900/95" />
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
          <div className="relative h-8 bg-gradient-to-t from-black via-gray-900 to-transparent">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </>
  )
}

// Custom styles for gaming animations
const customStyles = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 4s linear infinite;
  }
`
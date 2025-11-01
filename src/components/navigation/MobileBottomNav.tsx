'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Swords, Trophy, Plus, Users, User, Sparkles, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CreateBottomSheet } from '@/components/modals/CreateBottomSheet'
import { useUser } from '@/context/UserContext'
import { useToast } from '@/hooks/use-toast'

interface MobileBottomNavProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function MobileBottomNav({ activeTab = 'challenges', onTabChange }: MobileBottomNavProps) {
  const router = useRouter()
  const [isPulsing, setIsPulsing] = useState(false)
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isNavHidden, setIsNavHidden] = useState(false)
  const [slidingOut, setSlidingOut] = useState(false)
  const [slidingIn, setSlidingIn] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchDelta, setTouchDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const { address: userAddress, isConnected } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    // Pulse effect for center button every 3 seconds
    const interval = setInterval(() => {
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), 1000)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    {
      id: 'challenges',
      label: 'Challenges',
      icon: Swords,
      href: '/challenges',
      gradient: 'from-yellow-500 to-amber-600',
      glowColor: 'yellow',
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      icon: Trophy,
      href: '/tournaments',
      gradient: 'from-amber-500 to-orange-600',
      glowColor: 'amber',
    },
    {
      id: 'center',
      label: 'Create',
      icon: Plus,
      href: '/create',
      isCenter: true,
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      glowColor: 'yellow',
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: Users,
      href: '/teams',
      gradient: 'from-orange-500 to-red-600',
      glowColor: 'orange',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      href: userAddress ? `/profile/${String(userAddress)}` : '/profile',
      gradient: 'from-amber-600 to-yellow-600',
      glowColor: 'amber',
    },
  ]

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isCenter) {
      // Handle center button action with haptic feedback simulation
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      // Open create bottom sheet instead of navigating
      setIsCreateSheetOpen(true)
    } else if (item.id === 'challenges') {
      router.push('/challenges')
    } else if (item.id === 'tournaments') {
      router.push('/tournaments')
    } else if (item.id === 'teams') {
      router.push('/teams')
    } else if (item.id === 'profile') {
      if (!isConnected || !userAddress) {
        toast({
          title: 'Log in to view profile',
          description: 'Connect your wallet to access your profile.',
        })
        return
      }
      router.push(`/profile/${String(userAddress)}`)
    } else {
      onTabChange?.(item.id)
    }
  }

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const t = e.touches[0]
    setTouchStart({ x: t.clientX, y: t.clientY })
    setTouchDelta({ x: 0, y: 0 })
  }

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!touchStart) return
    const t = e.touches[0]
    setTouchDelta({ x: t.clientX - touchStart.x, y: t.clientY - touchStart.y })
  }

  const handleTouchEnd = () => {
    if (!touchStart) return
    const { x, y } = touchDelta
    // Detect a left swipe with minimal vertical movement
    const thresholdX = -50 // at least 50px to the left
    const maxVertical = 30 // ignore if vertical movement is too large
    if (x < thresholdX && Math.abs(y) < maxVertical) {
      // Animate slide-out, then hide
      setSlidingOut(true)
      setTimeout(() => {
        setIsNavHidden(true)
        setSlidingOut(false)
      }, 300)
    }
    setTouchStart(null)
    setTouchDelta({ x: 0, y: 0 })
  }

  return (
    <>
      {/* Floating Menu button when nav is hidden */}
      {isNavHidden && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <Button
            onClick={() => {
              setIsNavHidden(false)
              setSlidingIn(true)
              setTimeout(() => setSlidingIn(false), 300)
            }}
            className={cn(
              'h-16 w-16 rounded-full border-2 border-yellow-300/30 shadow-2xl',
              'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500',
              'hover:scale-110 hover:shadow-yellow-500/60',
              'active:scale-95',
            )}
            aria-label="Open menu"
          >
            <Menu className="h-7 w-7 text-white drop-shadow-lg" />
          </Button>
          <div className="absolute -top-6 right-0 select-none text-xs px-2 py-1 rounded-md bg-zinc-900/80 text-zinc-200 border border-zinc-800 shadow-sm">
            Menu
          </div>
        </div>
      )}

      {/* Bottom nav bar (swipe left to hide) */}
      {!isNavHidden && (
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 md:hidden',
            slidingOut ? 'nav-slide-out' : slidingIn ? 'nav-slide-in' : ''
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-xl border-t border-white/10" />

      {/* Styled solid top border with gold theme */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600/80 via-amber-500 to-orange-600/80 shadow-lg shadow-amber-500/50" />
      <div className="absolute top-1 left-0 right-0 h-px bg-gradient-to-r from-yellow-400/60 via-amber-400/80 to-orange-400/60" />

      {/* Navigation container */}
      <nav className="relative px-6 pt-10 pb-6 pb-safe">
        {/* Use grid for perfect centering */}
        <div className="grid grid-cols-5 items-center justify-items-center relative">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const isCenter = item.isCenter

            if (isCenter) {
              return (
                <div key={item.id} className="relative flex items-center justify-center">
                  
                  {/* Pulsing glow layers */}
                  <div className={cn(
                    "absolute -top-7 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full transition-all duration-1000",
                    isPulsing ? "bg-gradient-to-r from-yellow-500/50 to-amber-500/50 blur-2xl scale-150" : "bg-yellow-500/30 blur-xl scale-125"
                  )} />
                  
                  {/* Main center button with advanced styling */}
                  <Button
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      "absolute -top-7 left-1/2 -translate-x-1/2 z-10 h-16 w-16 rounded-full transition-all duration-300 border-2 border-yellow-300/30 shadow-2xl",
                      "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500",
                      "hover:scale-110 hover:shadow-yellow-500/60 hover:shadow-3xl",
                      "active:scale-95",
                      isPulsing && "animate-pulse shadow-yellow-500/70 shadow-3xl"
                    )}
                  >
                    <div className="relative">
                      <Plus className="h-7 w-7 text-white drop-shadow-lg" />
                      <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
                    </div>
                  </Button>

                  {/* Floating action label */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                    <span className="text-xs text-white font-medium whitespace-nowrap">{item.label}</span>
                  </div>
                </div>
              )
            }

            return (
              <div key={item.id} className="relative group">
                {/* Hover glow effect */}
                <div className={cn(
                  "absolute inset-0 h-12 w-12 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100 pointer-events-none",
                  `bg-gradient-to-br ${item.gradient} blur-lg scale-110`
                )} />
                
                {/* Navigation button */}
                <button
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-12 w-12 rounded-2xl transition-all duration-300 group z-10",
                    isActive ? "scale-110" : "hover:scale-105"
                  )}
                >
                  {/* Icon container with gradient background */}
                  <div
                    className={cn(
                      "relative flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-300",
                      isActive
                        ? `bg-gradient-to-br ${item.gradient} shadow-lg border border-white/20`
                        : "bg-white/10 backdrop-blur-sm border border-white/10 group-hover:bg-white/20"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive ? "text-white drop-shadow-sm" : "text-white/70 group-hover:text-white"
                      )}
                    />
                    
                    {/* Active indicator with pulse */}
                    {isActive && (
                      <>
                        <div className={cn(
                          "absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full animate-pulse",
                          `bg-gradient-to-r ${item.gradient}`
                        )} />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                      </>
                    )}
                  </div>

                  {/* Label with slide-up animation */}
                  <span className={cn(
                    "absolute -bottom-5 text-xs font-medium transition-all duration-300 whitespace-nowrap",
                    isActive 
                      ? "text-white opacity-100" 
                      : "text-white/60 opacity-0 group-hover:opacity-100 group-hover:-bottom-6"
                  )}>
                    {item.label}
                  </span>

                  {/* Ripple effect on click */}
                  <div className="absolute inset-0 rounded-2xl bg-white/20 scale-0 group-active:scale-100 transition-transform duration-200 pointer-events-none" />
                </button>
              </div>
            )
          })}
        </div>

  
      </nav>

      {/* Create Bottom Sheet */}
      <CreateBottomSheet 
        isOpen={isCreateSheetOpen} 
        onClose={() => setIsCreateSheetOpen(false)} 
      />

      {/* Custom styles */}
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: translateX(-50%) rotate(360deg); }
          to { transform: translateX(-50%) rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 12s linear infinite;
        }
        .nav-slide-out {
          animation: nav-slide-out 300ms ease forwards;
        }
        .nav-slide-in {
          animation: nav-slide-in 300ms ease forwards;
        }
        @keyframes nav-slide-out {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        @keyframes nav-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
        </div>
      )}
    </>
  )
}
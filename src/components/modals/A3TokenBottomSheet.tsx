'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X, Activity, Flame, Shield, Swords, Crown, Lock, Info } from 'lucide-react' // New icons imported
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getA3Tokens, type A3TokenConfig } from '@/lib/config/a3-tokens'

export interface A3TokenOption {
  key: 'SPEED' | 'POWER' | 'DEFENSE'
  label: string
  address?: `0x${string}`
  disabled?: boolean
  badge?: string
  shortAddress?: string
}

interface A3TokenBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (opt: A3TokenOption) => void
}

export function A3TokenBottomSheet({ isOpen, onClose, onSelect }: A3TokenBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Load tokens from config with shortAddress
  const tokenOptions: A3TokenOption[] = getA3Tokens().map((token: A3TokenConfig) => ({
    key: token.key,
    label: token.label,
    address: token.address,
    shortAddress: token.address
      ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}`
      : undefined,
    disabled: token.disabled,
    badge: token.badge,
  }))

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleBodyScroll = (e: Event) => {
      if (isOpen) e.preventDefault()
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div
        ref={overlayRef}
        className={cn(
          'fixed inset-0 z-50 transition-opacity duration-300',
          'bg-black/80 backdrop-blur-sm',
        )}
        onClick={handleOverlayClick}
      >
        <div
          ref={sheetRef}
          className={cn(
            'fixed right-0 bottom-0 left-0 z-10 flex max-h-[85vh] flex-col overscroll-contain rounded-t-2xl pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-500 ease-out',
            isOpen ? 'translate-y-0' : 'translate-y-full',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated Top Border */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"></div>
          {/* Drag Handle */}
          <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-gray-700"></div>

          {/* Header with Explainer */}
          <div className="relative border-b border-gray-800 bg-gradient-to-b from-slate-900 to-black p-6">
            <div className="absolute inset-0 bg-[url('/grid.svg')] [mask-image:linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_40%,transparent)] bg-center opacity-10"></div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 blur-md"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Select 3A Token</h2>
                <p className="text-sm text-gray-400">Assets As Attributes</p>
              </div>
            </div>

            {/* Great Explainer */}
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-600/10 p-4">
              <p className="text-center text-sm font-medium text-amber-200">
                3A Tokens, Assets As Attributes. Power your game characters or playable xfts.
              </p>
            </div>
          </div>

          {/* Token List */}
          <div className="flex-1 overflow-y-auto bg-black p-6 pb-8">
            {' '}
            {/* Reduced bottom padding */}
            <div className="space-y-3">
              {tokenOptions.map((opt) => (
                <button
                  key={opt.key}
                  disabled={opt.disabled}
                  onClick={() => {
                    if (opt.disabled) return
                    setIsAnimating(true)
                    onSelect(opt)
                    setTimeout(() => {
                      setIsAnimating(false)
                      onClose()
                    }, 300)
                  }}
                  className={cn(
                    'group relative w-full overflow-hidden rounded-2xl border p-4 transition-all duration-300',
                    opt.disabled
                      ? 'cursor-not-allowed border-gray-800 bg-gray-900/50'
                      : 'border-gray-700 bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 hover:scale-[1.02] hover:border-amber-500/50 active:scale-[0.98]',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'relative flex h-14 w-14 items-center justify-center rounded-xl',
                          opt.disabled
                            ? 'bg-gray-800'
                            : opt.key === 'SPEED'
                              ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                              : opt.key === 'POWER'
                                ? 'bg-gradient-to-br from-red-500 to-orange-600'
                                : 'bg-gradient-to-br from-green-500 to-emerald-600',
                        )}
                      >
                        {/* NEW ICONS */}
                        {opt.key === 'SPEED' && (
                          <Activity className="h-7 w-7 animate-pulse text-white" />
                        )}
                        {opt.key === 'POWER' && <Flame className="h-7 w-7 text-white" />}
                        {opt.key === 'DEFENSE' && <Shield className="h-7 w-7 text-white" />}
                        {opt.disabled && <Lock className="h-7 w-7 text-gray-500" />}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white">{opt.label}</span>
                          {opt.badge && (
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold text-white',
                                opt.badge === 'LIVE' ? 'bg-green-600' : 'bg-gray-600',
                              )}
                            >
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {/* Use shortAddress here */}
                        <p className="font-mono text-xs text-gray-400">
                          {opt.shortAddress || 'Coming Soon'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {!opt.disabled ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                          <Swords className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800">
                          <Info className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Trophy, Users, Calendar, Clock, Hash, Target, Zap, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useGamerProfile } from '@/context/GamerProfileContext'
import { parseEther, createWalletClient, custom } from 'viem'
import { getTournamentFactoryAddress } from '@/lib/contract-addresses'
import { getGamerTokenAddress, ZERO_ADDRESS } from '@/lib/tokens'
import { getNetworkConfig } from '@/lib/config/deployment'
import { supabase } from '@/lib/supabase'
  import {
    readIsMod,
    readPlatformFeeRate,
    readMinimumEntryFee,
    getNativeBalance,
    getTokenBalance,
    approveTokenIfNeeded,
    createTournament,
    readTournamentDeployer,
  } from '@/lib/contracts/tournamentFactory'

// Conservative limit for on-chain metadata size
const MAX_CONTRACT_METADATA_LENGTH = 1000

// Helper: truncate oversized text for contract storage
const truncateForContract = (text: string, maxLength: number): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, Math.max(0, maxLength - 3)) + '...'
}

// Build metadata for contract (ensure total size within limit)
const createContractMetadata = (formData: any): string => {
  // Start with potentially truncated fields
  const base = {
    title: truncateForContract(formData.title ?? '', 200),
    rules: truncateForContract(formData.rules ?? '', 700),
    prizePool: truncateForContract(formData.prizePool ?? '', 100),
    startDate: truncateForContract(formData.startDate ?? '', 32),
    startTime: truncateForContract(formData.startTime ?? '', 32),
    xftId: formData.xftId ? Number(formData.xftId) : undefined,
  }

  let json = JSON.stringify(base)
  if (json.length <= MAX_CONTRACT_METADATA_LENGTH) return json

  // If still too large, progressively trim rules
  let rules = String(base.rules ?? '')
  while (json.length > MAX_CONTRACT_METADATA_LENGTH && rules.length > 0) {
    rules = truncateForContract(rules, Math.max(0, rules.length - 50))
    json = JSON.stringify({ ...base, rules })
  }
  return json
}

// Build full metadata for database
const createDatabaseMetadata = (formData: any): string => {
  return JSON.stringify({
    title: formData.title ?? '',
    rules: formData.rules ?? '',
    prizePool: formData.prizePool ?? '',
    startDate: formData.startDate ?? '',
    startTime: formData.startTime ?? '',
    xftId: formData.xftId ? Number(formData.xftId) : undefined,
  })
}

export default function CreateTournamentPage() {
  const router = useRouter()
  const { address: account } = useGamerProfile()
  const [formData, setFormData] = useState({
    title: '',
    game: '',
    tournamentType: 'BRACKET',
    entryFee: '',
    maxParticipants: '',
    startDate: '',
    startTime: '',
    rules: '',
    prizePool: '',
    xftId: '',
    payToken: 'SEI',
  })
  const [isAnimating, setIsAnimating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isMod, setIsMod] = useState<boolean>(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [createdTournamentAddress, setCreatedTournamentAddress] = useState<`0x${string}` | null>(null)
  const redirectTimeout = useRef<number | null>(null)
  // Avoid SSR/client markup mismatches by rendering after mount
  const [mounted, setMounted] = useState(false)
  const [rulesExceedsLimit, setRulesExceedsLimit] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cleanup any pending redirects on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout.current) {
        window.clearTimeout(redirectTimeout.current)
        redirectTimeout.current = null
      }
    }
  }, [])

  useEffect(() => {
    const loadRole = async () => {
      try {
        setError(null)
        if (!account || account.length === 0) return
        const mod = await readIsMod(account as `0x${string}`)
        setIsMod(mod)
      } catch (e) {
        console.error(e)
      }
    }
    loadRole()
  }, [account])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/90">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    )
  }

  // Check if full metadata would exceed on-chain limit
  const checkMetadataLength = (updated: typeof formData) => {
    const full = JSON.stringify({
      title: updated.title,
      rules: updated.rules,
      prizePool: updated.prizePool,
      startDate: updated.startDate,
      startTime: updated.startTime,
      xftId: updated.xftId ? Number(updated.xftId) : undefined,
    })
    return full.length > MAX_CONTRACT_METADATA_LENGTH
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const updated = { ...formData, [name]: value }
    setFormData(updated)
    if (name === 'rules' || name === 'title' || name === 'prizePool' || name === 'startDate' || name === 'startTime') {
      setRulesExceedsLimit(checkMetadataLength(updated))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Enhanced haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
    setError(null)
    setInfo(null)

    // Basic required fields (xftId optional when not moderator)
    const required = [
      'title',
      'game',
      'tournamentType',
      'entryFee',
      'maxParticipants',
      'startDate',
      'startTime',
      'rules',
    ] as const
    for (const key of required) {
      if (!String((formData as any)[key] ?? '').trim()) {
        setError(`Missing required field: ${key}`)
        return
      }
    }
    if (isMod && !String(formData.xftId ?? '').trim()) {
      setError('XFT TO JOIN is required for moderators.')
      return
    }

    // Validate max players: power of 2, <=64
    const mp = Number(formData.maxParticipants)
    const allowed = [2, 4, 8, 16, 32, 64]
    if (!allowed.includes(mp)) {
      setError('Max Players must be one of: 2, 4, 8, 16, 32, 64')
      return
    }

    // Validate start date/time > now + 5 minutes
    const startDateTime = (() => {
      try {
        const [yy, mm, dd] = formData.startDate.split('-').map(Number)
        const [hh, mi] = formData.startTime.split(':').map(Number)
        return new Date(yy, (mm || 1) - 1, dd || 1, hh || 0, mi || 0)
      } catch {
        return null
      }
    })()
    if (!startDateTime || isNaN(startDateTime.getTime())) {
      setError('Invalid start date or time')
      return
    }
    const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000)
    if (startDateTime <= fiveMinFromNow) {
      setError('Start time must be at least 5 minutes from now')
      return
    }

    // If validations pass, open confirmation card
    setConfirmOpen(true)
  }

  return (
    <>
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-950 via-black to-orange-950 pt-24 pb-8">
      {/* Subtle background particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + Math.random() * 3}s`,
            }}
          >
            <div
              className={cn(
                'h-2 w-2 rounded-full opacity-30',
                i % 3 === 0 ? 'bg-amber-500' : i % 3 === 1 ? 'bg-orange-500' : 'bg-yellow-500',
              )}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4">
        {/* Gaming Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/tournaments">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl border border-amber-500/30 bg-amber-500/20 text-amber-400 transition-all duration-300 hover:scale-105 hover:bg-amber-500/30 hover:text-amber-300"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-600">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 blur-lg" />
              </div>
              <div>
                {/* <h1 className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
                  CREATE TOURNAMENT
                </h1> */}
                <p className="text-sm font-medium tracking-wider text-amber-300/70">
                  HOST EPIC COMPETITION
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gaming Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament Details Card */}
          <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md">
            {/* Animated top border */}
            <div className="absolute top-0 right-0 left-0 h-1 animate-pulse bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500" />

            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold text-amber-400">
                <div className="relative">
                  <Crown className="h-6 w-6" />
                  <div className="absolute inset-0 h-6 w-6 animate-pulse bg-amber-500 blur-lg" />
                </div>
                <span>TOURNAMENT CONFIGURATION</span>
                <Zap className="h-5 w-5 animate-pulse text-orange-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-amber-300">
                  <Target className="h-4 w-4" />
                  <span>TOURNAMENT TITLE</span>
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter tournament title..."
                  className={cn(
                    'border-amber-500/30 bg-black/50 text-amber-100 placeholder-amber-300/30',
                    'transition-all duration-300 focus:border-amber-500 focus:ring-amber-500/20',
                    'hover:border-amber-500/50',
                  )}
                  required
                />
              </div>

              <div className="relative">
                <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-amber-300">
                  <Trophy className="h-4 w-4" />
                  <span>GAME ARENA</span>
                </label>
                <Input
                  name="game"
                  value={formData.game}
                  onChange={handleInputChange}
                  placeholder="e.g., Call of Duty, FIFA, Fortnite"
                  className={cn(
                    'border-amber-500/30 bg-black/50 text-amber-100 placeholder-amber-300/30',
                    'transition-all duration-300 focus:border-amber-500 focus:ring-amber-500/20',
                    'hover:border-amber-500/50',
                  )}
                  required
                />
              </div>

              <div className="relative">
                <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-amber-300">
                  <Crown className="h-4 w-4" />
                  <span>TOURNAMENT TYPE</span>
                </label>
                <RadioGroup
                  value={formData.tournamentType}
                  onValueChange={(val) =>
                    val && setFormData((p) => ({ ...p, tournamentType: val }))
                  }
                  className="grid grid-cols-2 gap-4 rounded-md border border-amber-500/30 bg-black/50 p-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      id="type-bracket"
                      value="BRACKET"
                      className="peer data-[state=checked]:border-green-500 data-[state=checked]:bg-green-600/10 data-[state=checked]:ring-green-500/40"
                    />
                    <Label
                      htmlFor="type-bracket"
                      className="text-sm text-amber-100 peer-data-[state=checked]:text-green-400"
                    >
                      Bracket
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      id="type-ffa"
                      value="FFA"
                      className="peer data-[state=checked]:border-green-500 data-[state=checked]:bg-green-600/10 data-[state=checked]:ring-green-500/40"
                    />
                    <Label
                      htmlFor="type-ffa"
                      className="text-sm text-amber-100 peer-data-[state=checked]:text-green-400"
                    >
                      Free For All
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Settings Card */}
          <Card className="relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md">
            {/* Animated top border */}
            <div className="absolute top-0 right-0 left-0 h-1 animate-pulse bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500" />

            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold text-orange-400">
                <div className="relative">
                  <Hash className="h-6 w-6" />
                  <div className="absolute inset-0 h-6 w-6 animate-pulse bg-orange-500 blur-lg" />
                </div>
                <span>TOURNAMENT PARAMETERS</span>
                <Target className="h-5 w-5 animate-pulse text-amber-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-orange-300">
                    <Trophy className="h-4 w-4" />
                    <span>ENTRY FEE</span>
                  </label>
                  <div className="relative">
                    <Input
                      name="entryFee"
                      type="number"
                      value={formData.entryFee}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={cn(
                        'border-orange-500/30 bg-black/50 text-orange-100 placeholder-orange-300/30',
                        'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                        'pr-8 hover:border-orange-500/50',
                      )}
                    />
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm font-bold text-orange-400">
                      {formData.payToken === 'GMR' ? 'GMR' : 'SEI'}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-orange-300">
                    <Users className="h-4 w-4" />
                    <span>MAX PLAYERS</span>
                  </label>
                  <Input
                    name="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    placeholder="16"
                    min="2"
                    max="128"
                    inputMode="numeric"
                    className={cn(
                      'border-orange-500/30 bg-black/50 text-orange-100 placeholder-orange-300/30',
                      'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                      'hover:border-orange-500/50',
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-orange-300">
                    <Calendar className="h-4 w-4" />
                    <span>START DATE</span>
                  </label>
                  <Input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={cn(
                      'border-orange-500/30 bg-black/50 text-orange-100 placeholder-orange-300/30',
                      'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                      'hover:border-orange-500/50',
                      '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100',
                      '[&::-webkit-calendar-picker-indicator]:filter-invert [&::-webkit-calendar-picker-indicator]:brightness-0',
                      '[&::-webkit-calendar-picker-indicator]:saturate-100 [&::-webkit-calendar-picker-indicator]:sepia-100',
                      '[&::-webkit-calendar-picker-indicator]:brightness-[2] [&::-webkit-calendar-picker-indicator]:hue-rotate-[15deg]',
                    )}
                  />
                </div>

                <div className="relative">
                  <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-orange-300">
                    <Clock className="h-4 w-4" />
                    <span>START TIME</span>
                  </label>
                  <Input
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className={cn(
                      'border-orange-500/30 bg-black/50 text-orange-100 placeholder-orange-300/30',
                      'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                      'hover:border-orange-500/50',
                      '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100',
                      '[&::-webkit-calendar-picker-indicator]:filter-invert [&::-webkit-calendar-picker-indicator]:brightness-0',
                      '[&::-webkit-calendar-picker-indicator]:saturate-100 [&::-webkit-calendar-picker-indicator]:sepia-100',
                      '[&::-webkit-calendar-picker-indicator]:brightness-[2] [&::-webkit-calendar-picker-indicator]:hue-rotate-[15deg]',
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="mb-2 block flex items-center justify-between text-sm font-bold tracking-wider text-orange-300">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4" />
                      <span>XFT</span>
                    </div>
                    {isMod ? (
                      <div className="flex items-center space-x-1 rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                        <Crown className="h-3 w-3" />
                        <span>MOD</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 rounded-full bg-gray-500/20 px-2 py-1 text-xs text-gray-400">
                        <span>MOD ONLY</span>
                      </div>
                    )}
                  </label>
                  <div className="relative">
                    <Input
                      name="xftId"
                      type="number"
                      value={formData.xftId}
                      onChange={handleInputChange}
                      placeholder={isMod ? '0' : 'Moderator access required'}
                      min="0"
                      step="1"
                      disabled={!isMod}
                      className={cn(
                        'border-orange-500/30 bg-black/50 text-orange-100 placeholder-orange-300/30',
                        'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                        'hover:border-orange-500/50',
                        !isMod && 'cursor-not-allowed opacity-60',
                      )}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-orange-300">
                    <Hash className="h-4 w-4" />
                    <span>PAY TOKEN</span>
                  </label>
                  <RadioGroup
                    value={formData.payToken}
                    onValueChange={(val) => val && setFormData((p) => ({ ...p, payToken: val }))}
                    className="grid grid-cols-2 gap-4 rounded-md border border-orange-500/30 bg-black/50 p-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        id="pay-sei"
                        value="SEI"
                        className="peer data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-600/10 data-[state=checked]:ring-orange-500/40"
                      />
                      <Label
                        htmlFor="pay-sei"
                        className="text-sm text-orange-100 peer-data-[state=checked]:text-orange-300"
                      >
                        SEI
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        id="pay-gmr"
                        value="GMR"
                        className="peer data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-600/10 data-[state=checked]:ring-orange-500/40"
                      />
                      <Label
                        htmlFor="pay-gmr"
                        className="text-sm text-orange-100 peer-data-[state=checked]:text-orange-300"
                      >
                        GMR
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="relative">
                <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-orange-300">
                  <Crown className="h-4 w-4" />
                  <span>RULES & FORMAT</span>
                </label>
                <Textarea
                  name="rules"
                  value={formData.rules}
                  onChange={handleInputChange}
                  placeholder="Describe tournament rules, format, prize distribution..."
                  rows={4}
                  className={cn(
                    'resize-none border-orange-500/30 bg-black/50 text-orange-100 placeholder-orange-300/30',
                    'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                    'hover:border-orange-500/50',
                  )}
                />
                {rulesExceedsLimit && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-amber-300">
                    <Zap className="h-3 w-3" />
                    <span>
                      Content exceeds contract limit ({MAX_CONTRACT_METADATA_LENGTH} chars). Full
                      content will be stored in database; a truncated version goes on-chain.
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gaming Submit & Confirmation */}
          <div className="flex flex-col items-center space-y-3">
            {error && <div className="text-sm font-medium text-red-400">{error}</div>}
            {info && <div className="text-sm text-amber-300">{info}</div>}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <Button
                type="submit"
                disabled={isAnimating}
                className={cn(
                  'relative bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-3 font-bold tracking-wider text-white transition-all duration-300 hover:from-amber-700 hover:to-orange-700',
                  'hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/50',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isAnimating && 'animate-pulse',
                )}
              >
                {isAnimating ? (
                  <span className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>CREATING...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <Crown className="h-5 w-5" />
                    <span>CREATE TOURNAMENT</span>
                    <Zap className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <DialogContent
                className={cn(
                  'border-amber-500/40 bg-gradient-to-br from-black via-gray-900 to-black text-white shadow-amber-500/30',
                  'overflow-hidden sm:max-w-xl max-h-[85vh] overflow-y-auto',
                )}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_70%)]" />
                <DialogHeader className="relative z-10">
                  <DialogTitle
                    className={cn(
                      'bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 bg-clip-text text-2xl font-bold text-transparent',
                      'flex items-center justify-center space-x-3',
                    )}
                  >
                    <Trophy className="h-6 w-6 animate-pulse text-amber-400" />
                    <span>Confirm Tournament Creation</span>
                    <Crown className="h-6 w-6 animate-pulse text-amber-400" />
                  </DialogTitle>
                  <DialogDescription className="text-center font-medium text-amber-200/80">
                    Review your tournament details and launch your epic competition!
                  </DialogDescription>
                </DialogHeader>
                <div className="relative z-10 space-y-3 rounded-lg border border-amber-500/20 bg-black/40 p-4 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-amber-400" />
                        <span className="font-semibold text-amber-300">Title:</span>
                      </div>
                      <div className="ml-6 text-orange-100">{formData.title}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <span className="font-semibold text-amber-300">Game:</span>
                      </div>
                      <div className="ml-6 text-orange-100">{formData.game}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-amber-400" />
                        <span className="font-semibold text-amber-300">Type:</span>
                      </div>
                      <div className="ml-6 text-orange-100">{formData.tournamentType}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-amber-400" />
                        <span className="font-semibold text-amber-300">Entry Fee:</span>
                      </div>
                      <div className="ml-6 text-orange-100">
                        {formData.entryFee} {formData.payToken === 'GMR' ? 'GMR' : 'SEI'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-amber-400" />
                        <span className="font-semibold text-amber-300">Max Players:</span>
                      </div>
                      <div className="ml-6 text-orange-100">{formData.maxParticipants}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-amber-400" />
                        <span className="font-semibold text-amber-300">Start:</span>
                      </div>
                      <div className="ml-6 text-orange-100">
                        {formData.startDate} {formData.startTime}
                      </div>
                    </div>
                  </div>
                  {isMod && (
                    <div className="mt-4 border-t border-amber-500/20 pt-3">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span className="font-semibold text-amber-300">XFT Required:</span>
                        <span className="text-orange-100">{formData.xftId || 'None'}</span>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="relative z-10 space-x-3">
                  <Button
                    variant="ghost"
                    className={cn(
                      'border-2 border-red-500/50 bg-gradient-to-r from-red-900/50 to-red-800/50',
                      'font-semibold tracking-wide text-red-200',
                      'hover:border-red-400/70 hover:from-red-800/70 hover:to-red-700/70',
                      'transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30',
                    )}
                    onClick={() => setConfirmOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={cn(
                      'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 font-bold tracking-wide text-white',
                      'border-2 border-amber-500/50 shadow-lg shadow-amber-500/30',
                      'hover:from-amber-500 hover:via-orange-500 hover:to-amber-500',
                      'hover:border-amber-400/70 hover:shadow-xl hover:shadow-amber-500/50',
                      'transition-all duration-300 hover:scale-105',
                      'relative overflow-hidden',
                      'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
                      'before:translate-x-[-100%] before:transition-transform before:duration-700 hover:before:translate-x-[100%]',
                    )}
                    onClick={async () => {
                      setIsAnimating(true)
                      setError(null)
                      setInfo(null)
                      try {
                        if (!account) throw new Error('Connect wallet to create tournament')

                        // Resolve pay token
                        const payToken =
                          formData.payToken === 'GMR'
                            ? (getGamerTokenAddress() as `0x${string}`)
                            : (ZERO_ADDRESS as `0x${string}`)
                        const entryFeeWei = parseEther(String(formData.entryFee || '0'))
                        const platformFeeRate = await readPlatformFeeRate()
                        const minimumEntryFee = await readMinimumEntryFee()
                        if (entryFeeWei < minimumEntryFee)
                          throw new Error('Entry fee below platform minimum')
                        const feeWei = (entryFeeWei * platformFeeRate) / BigInt(10000)

                        // Ensure factory deployer is configured on-chain
                        const deployerAddr = await readTournamentDeployer()
                        if (!deployerAddr || deployerAddr === ZERO_ADDRESS)
                          throw new Error('Tournament factory not configured: deployer missing')

                        // Balance checks and allowance if token
                        const acct = account as `0x${string}`
                        const factoryAddr = getTournamentFactoryAddress() as `0x${string}`
                        if (payToken === ZERO_ADDRESS) {
                          const bal = await getNativeBalance(acct)
                          if (bal < entryFeeWei + feeWei)
                            throw new Error('Insufficient SEI to cover amount + fee')
                        } else {
                          const bal = await getTokenBalance(payToken, acct)
                          if (bal < entryFeeWei + feeWei)
                            throw new Error('Insufficient GAMER to cover amount + fee')
                          await approveTokenIfNeeded(payToken, acct, factoryAddr, entryFeeWei)
                        }

                        // Build metadata (contract vs database)
                        const contractMetadata = createContractMetadata({
                          title: formData.title,
                          rules: formData.rules,
                          prizePool: formData.prizePool,
                          startDate: formData.startDate,
                          startTime: formData.startTime,
                          xftId: isMod ? Number(formData.xftId || 0) : undefined,
                        })
                        const databaseMetadata = createDatabaseMetadata({
                          title: formData.title,
                          rules: formData.rules,
                          prizePool: formData.prizePool,
                          startDate: formData.startDate,
                          startTime: formData.startTime,
                          xftId: isMod ? Number(formData.xftId || 0) : undefined,
                        })

                        // Create wallet client from provider
                        const networkConfig = getNetworkConfig()
                        const chain = {
                          id: networkConfig.chainId,
                          name: networkConfig.name,
                          nativeCurrency: networkConfig.nativeCurrency,
                          rpcUrls: {
                            default: { http: [networkConfig.rpcUrl] },
                            public: { http: [networkConfig.rpcUrl] },
                          },
                          blockExplorers: {
                            default: { name: 'Explorer', url: networkConfig.blockExplorer },
                          },
                        } as const
                        const walletClient = createWalletClient({
                          transport: custom(window.ethereum!),
                          chain,
                        })

                        const { hash, tournamentAddress } = await createTournament(
                          acct,
                          {
                            entryFeeWei,
                            payToken,
                            maxParticipants: Number(formData.maxParticipants),
                            xftToJoin: isMod ? Number(formData.xftId || 0) : 0,
                            isFFA: formData.tournamentType === 'FFA',
                            gameType: formData.game || 'custom',
                            metadata: contractMetadata,
                          },
                          walletClient,
                        )

                        // Sync to Supabase
                        if (tournamentAddress) {
                          const insert = {
                            contract_address: tournamentAddress,
                            creator: acct,
                            status: 0, // ACTIVE
                            game_type: formData.game || 'custom',
                            entry_fee: entryFeeWei.toString(),
                            max_participants: Number(formData.maxParticipants),
                            pay_token: payToken,
                            metadata: databaseMetadata,
                            created_at: new Date().toISOString(),
                          }
                          const { error: dbError } = await supabase.from('tournaments').insert(insert)
                          if (dbError) throw dbError
                          // Open success modal and redirect shortly
                          setCreatedTournamentAddress(tournamentAddress)
                          setSuccessOpen(true)
                          redirectTimeout.current = window.setTimeout(() => {
                            router.push(`/tournaments/${String(tournamentAddress).toLowerCase()}`)
                          }, 1500)
                        }

                        setInfo('Tournament created successfully')
                        console.log('Tournament created')
                      } catch (err: unknown) {
                        console.error(err)
                        setError(err instanceof Error ? err.message : 'Failed to create tournament')
                        setErrorOpen(true)
                      } finally {
                        setIsAnimating(false)
                      }
                    }}
                  >
                    Confirm & Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </div>
    </div>

    {/* Success Modal */}
    <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
      <DialogContent className="bg-black/90 border border-amber-500/30 text-amber-200">
        <DialogHeader>
          <DialogTitle className="text-amber-300">Tournament Created</DialogTitle>
          <DialogDescription className="text-amber-200/80">
            {createdTournamentAddress
              ? `Taking you to the tournament page at ${String(createdTournamentAddress).toLowerCase()}`
              : 'Taking you to the tournament page...'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            className="border-amber-500/40 text-amber-300"
            onClick={() => {
              if (createdTournamentAddress) {
                router.push(`/tournaments/${String(createdTournamentAddress).toLowerCase()}`)
              }
            }}
          >
            Go now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Error Modal */}
    <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
      <DialogContent className="bg-black/90 border border-red-500/30 text-red-200">
        <DialogHeader>
          <DialogTitle className="text-red-300">Failed to Create Tournament</DialogTitle>
          <DialogDescription className="text-red-200/80">
            {error || 'An unexpected error occurred. Please try again.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            className="border-red-500/40 text-red-300"
            onClick={() => setErrorOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

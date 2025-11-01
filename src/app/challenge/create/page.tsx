'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { ArrowLeft, Sword, Users, Trophy, Hash, Zap, Flame, Target, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
// Removed unused toggle-group imports to satisfy lint rules
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useGamerProfile } from '@/context/GamerProfileContext'
import { parseEther, createWalletClient, custom } from 'viem'
import { getChallengeFactoryAddress } from '@/lib/contract-addresses'
import { getGamerTokenAddress, ZERO_ADDRESS } from '@/lib/tokens'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { GamingButton } from '@/components/ui/gaming-button'
import {
  readPlatformFeeRate,
  readMinimumEntryFee,
  getNativeBalance,
  getTokenBalance,
  approveTokenIfNeeded,
  createHeadsUpChallenge,
} from '@/lib/contracts/challengeFactory'

// Contract metadata limits - Ethereum has practical gas limits for string storage
const MAX_CONTRACT_METADATA_LENGTH = 1000 // Conservative limit for contract storage
const MAX_RULES_LENGTH = 5000 // UI limit for rules input

// Helper functions for metadata handling
const truncateForContract = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

const createContractMetadata = (formData: any): string => {
  const fullMetadata = {
    title: formData.title,
    description: formData.description,
    rules: formData.rules,
    console: formData.console,
    streaming: formData.streaming === 'YES',
  }
  
  const fullMetadataStr = JSON.stringify(fullMetadata)
  
  // If full metadata fits within limit, use it
  if (fullMetadataStr.length <= MAX_CONTRACT_METADATA_LENGTH) {
    return fullMetadataStr
  }
  
  // Otherwise, create truncated version prioritizing essential fields
  const truncatedMetadata = {
    title: truncateForContract(formData.title, 100),
    description: truncateForContract(formData.description, 200),
    rules: truncateForContract(formData.rules, 500), // Truncate rules for contract
    console: formData.console,
    streaming: formData.streaming === 'YES',
  }
  
  const truncatedStr = JSON.stringify(truncatedMetadata)
  
  // Final safety check - if still too long, truncate rules further
  if (truncatedStr.length > MAX_CONTRACT_METADATA_LENGTH) {
    truncatedMetadata.rules = truncateForContract(formData.rules, 200)
    return JSON.stringify(truncatedMetadata)
  }
  
  return truncatedStr
}

const createDatabaseMetadata = (formData: any): string => {
  // Full metadata for database storage (no truncation)
  return JSON.stringify({
    title: formData.title,
    description: formData.description,
    rules: formData.rules, // Full rules preserved in database
    console: formData.console,
    streaming: formData.streaming === 'YES',
  })
}

export default function CreateChallengePage() {
  const { profile } = useGamerProfile()
  const router = useRouter()
  const [successOpen, setSuccessOpen] = useState(false)
  const [createdChallengeAddress, setCreatedChallengeAddress] = useState<`0x${string}` | null>(null)
  const redirectTimeout = useRef<number | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    opponent: '',
    game: '',
    description: '',
    betAmount: '',
    maxPlayers: '2',
    rules: '',
    console: '',
    currency: 'SEI',
    streaming: 'YES',
  })
  const [isAnimating, setIsAnimating] = useState(false)
  const [platformFeeRate, setPlatformFeeRate] = useState<bigint | null>(null)
  const [minimumEntryFee, setMinimumEntryFee] = useState<bigint | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [rulesExceedsLimit, setRulesExceedsLimit] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [feeRate, minFee] = await Promise.all([readPlatformFeeRate(), readMinimumEntryFee()])
        if (!mounted) return
        setPlatformFeeRate(feeRate)
        setMinimumEntryFee(minFee)
      } catch (e) {
        console.error('Failed to load factory params', e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Check if metadata will exceed contract limits
  const checkMetadataLength = (updatedFormData: typeof formData) => {
    const fullMetadata = JSON.stringify({
      title: updatedFormData.title,
      description: updatedFormData.description,
      rules: updatedFormData.rules,
      console: updatedFormData.console,
      streaming: updatedFormData.streaming === 'YES',
    })
    return fullMetadata.length > MAX_CONTRACT_METADATA_LENGTH
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const updatedFormData = { ...formData, [name]: value }
    setFormData(updatedFormData)
    
    // Check if rules exceed contract limit for real-time feedback
    if (name === 'rules' || name === 'title' || name === 'description') {
      setRulesExceedsLimit(checkMetadataLength(updatedFormData))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    setIsAnimating(true)

    try {
      const account = (profile.wallet || '').toLowerCase() as `0x${string}`
      if (!/^0x[a-fA-F0-9]{40}$/.test(account))
        throw new Error('Connect wallet to create a challenge')

      const opponent = (formData.opponent || '').toLowerCase()
      if (!/^0x[a-fA-F0-9]{40}$/.test(opponent))
        throw new Error('Enter a valid opponent 0x address')

      const entryFeeWei = parseEther((formData.betAmount || '0').toString())
      if (!minimumEntryFee || entryFeeWei < minimumEntryFee) {
        throw new Error('Entry fee below minimum requirement')
      }
      const rate = platformFeeRate ?? BigInt(0)
      const feeWei = (entryFeeWei * rate) / BigInt(10000)

      const currency = formData.currency
      const payToken = currency === 'GAMER' ? getGamerTokenAddress() : null
      const factory = getChallengeFactoryAddress() as `0x${string}`

      // Create wallet client from injected provider for writes (approve & create)
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error(
          'Wallet provider not detected. Please use a Web3-enabled browser and connect your wallet.',
        )
      }
      const walletClient = createWalletClient({
        transport: custom((window as any).ethereum!),
        chain: undefined,
      })

      // 2) Creator balance check
      if (currency === 'SEI') {
        const bal = await getNativeBalance(account)
        if (bal < entryFeeWei + feeWei)
          throw new Error('Insufficient SEI to cover amount + platform fee')
      } else {
        if (!payToken)
          throw new Error('GAMER token address not configured (NEXT_PUBLIC_GAMER_TOKEN_ADDRESS)')
        const bal = await getTokenBalance(payToken, account)
        if (bal < entryFeeWei + feeWei)
          throw new Error('Insufficient GAMER tokens to cover amount + platform fee')
        // Ensure approval for entry fee
        await approveTokenIfNeeded(payToken, account, factory, entryFeeWei, walletClient)
      }

      // 3) Opponent balance check (best-effort warning)
      const opponentAddr = opponent as `0x${string}`
      if (currency === 'SEI') {
        const bal = await getNativeBalance(opponentAddr)
        if (bal < entryFeeWei + feeWei) {
          setInfo('Warning: Opponent may not have enough SEI to join (amount + fee).')
        }
      } else if (payToken) {
        const bal = await getTokenBalance(payToken, opponentAddr)
        if (bal < entryFeeWei + feeWei) {
          setInfo('Warning: Opponent may not have enough GAMER tokens to join (amount + fee).')
        }
      }

      // 4) Submit challenge to factory
      // Create truncated metadata for contract storage (gas efficiency)
      const contractMetadata = createContractMetadata(formData)
      // Create full metadata for database storage (complete data preservation)
      const databaseMetadata = createDatabaseMetadata(formData)
      
      const { hash, challengeAddress } = await createHeadsUpChallenge(
        account,
        {
          entryFeeWei,
          opponent: opponentAddr,
          payToken: payToken ?? ZERO_ADDRESS,
          gameType: formData.game || 'custom',
          metadata: contractMetadata, // Use truncated version for contract
        },
        walletClient,
      )

      // 5) Sync event to Supabase
      if (challengeAddress) {
        const insert = {
          contract_address: challengeAddress,
          creator: account,
          opponent: opponentAddr,
          challenge_type: 0, // HEADS_UP
          status: 1, // ACTIVE
          game_type: formData.game || 'custom',
          entry_fee: entryFeeWei.toString(),
          total_prize_pool: (entryFeeWei * BigInt(2)).toString(),
          pay_token: payToken ?? ZERO_ADDRESS,
          metadata: databaseMetadata, // Use full metadata for database
          is_streaming: formData.streaming === 'YES',
          stream_embed_code: null,
          created_at: new Date().toISOString(),
        }
        const { error: dbError } = await supabase.from('challenges').insert(insert)
        if (dbError) throw dbError
        // Show success modal and auto-redirect to the challenge
        setCreatedChallengeAddress(challengeAddress)
        setSuccessOpen(true)
        redirectTimeout.current = window.setTimeout(() => {
          router.push(`/challenges/${challengeAddress.toLowerCase()}`)
        }, 1500)
      }

      console.log('Challenge created, tx:', hash)
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create challenge')
      }
    } finally {
      setIsAnimating(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-red-950 via-black to-orange-950 pt-24 pb-8">
      <br />
      <br />
      <br />
      {/* Animated background particles */}
      <DeterministicParticles count={8} />

      <div className="relative z-10 mx-auto max-w-2xl px-4">
        {/* Gaming Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/challenges">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl border border-red-500/30 bg-red-500/20 text-red-400 transition-all duration-300 hover:scale-105 hover:bg-red-500/30 hover:text-red-300"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-orange-600">
                  <Sword className="h-6 w-6 text-white" />
                </div>
                <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-xl bg-gradient-to-br from-red-600 to-orange-600 blur-lg" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
                  CHALLENGE
                </h1>
                <p className="text-sm font-medium tracking-wider text-red-300/70">
                  SET UP YOUR BATTLE
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gaming Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Challenge Details Card */}
          <Card className="relative overflow-hidden border-red-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md">
            {/* Animated top border */}
            <div className="absolute top-0 right-0 left-0 h-1 animate-pulse bg-gradient-to-r from-red-600 via-orange-500 to-amber-500" />

            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold text-red-400">
                <div className="relative">
                  <Flame className="h-6 w-6" />
                  <div className="absolute inset-0 h-6 w-6 animate-pulse bg-red-500 blur-lg" />
                </div>
                <span>BATTLE CONFIGURATION</span>
                <Zap className="h-5 w-5 animate-pulse text-amber-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && <div className="text-sm text-red-400">{error}</div>}
              {info && <div className="text-sm text-amber-400">{info}</div>}
              <div className="relative">
                <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-red-300">
                  <Target className="h-4 w-4" />
                  <span>OPPONENT</span>
                </label>
                <Input
                  name="opponent"
                  value={formData.opponent}
                  onChange={handleInputChange}
                  placeholder="Opponent's name or 0x..."
                  className={cn(
                    'border-red-500/30 bg-black/50 text-red-100 placeholder-red-300/30',
                    'transition-all duration-300 focus:border-red-500 focus:ring-red-500/20',
                    'hover:border-red-500/50',
                  )}
                  required
                />
              </div>

              <div className="relative">
                <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-red-300">
                  <Trophy className="h-4 w-4" />
                  <span>GAME ARENA</span>
                </label>
                <Input
                  name="game"
                  value={formData.game}
                  onChange={handleInputChange}
                  placeholder="e.g., Call of Duty, FIFA, Fortnite"
                  className={cn(
                    'border-red-500/30 bg-black/50 text-red-100 placeholder-red-300/30',
                    'transition-all duration-300 focus:border-red-500 focus:ring-red-500/20',
                    'hover:border-red-500/50',
                  )}
                  required
                />
              </div>

              <div className="relative">
                <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-red-300">
                  <Shield className="h-4 w-4" />
                  <span>BATTLE RULES</span>
                </label>
                <Textarea
                  name="rules"
                  value={formData.rules}
                  onChange={handleInputChange}
                  placeholder="State the battle rules..."
                  rows={3}
                  className={cn(
                    'resize-none border-red-500/30 bg-black/50 text-red-100 placeholder-red-300/30',
                    'transition-all duration-300 focus:border-red-500 focus:ring-red-500/20',
                    'hover:border-red-500/50',
                  )}
                />
                {rulesExceedsLimit && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-yellow-400">
                    <Zap className="h-3 w-3" />
                    <span>
                      Content exceeds contract limit ({MAX_CONTRACT_METADATA_LENGTH} chars). 
                      Full content will be stored in database, but truncated version will be on-chain.
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Battle Settings Card */}
          <Card className="relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md">
            {/* Animated top border */}
            <div className="absolute top-0 right-0 left-0 h-1 animate-pulse bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500" />

            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold text-orange-400">
                <div className="relative">
                  <Hash className="h-6 w-6" />
                  <div className="absolute inset-0 h-6 w-6 animate-pulse bg-orange-500 blur-lg" />
                </div>
                <span>BATTLE PARAMETERS</span>
                <Target className="h-5 w-5 animate-pulse text-amber-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-orange-300">
                    <Trophy className="h-4 w-4" />
                    <span>BATTLE AMOUNT</span>
                  </label>
                  <div className="relative">
                    <Input
                      name="betAmount"
                      type="number"
                      value={formData.betAmount}
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
                      {formData.currency}
                    </span>
                  </div>
                  {platformFeeRate !== null && (
                    <p className="mt-1 text-xs text-orange-300/70">
                      Platform fee: {(Number(platformFeeRate) / 100).toFixed(2)}%
                    </p>
                  )}
                </div>

                <div className="relative">
                  <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-orange-300">
                    <Users className="h-4 w-4" />
                    <span>CONSOLE</span>
                  </label>
                  <Select
                    value={formData.console}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, console: value }))}
                  >
                    <SelectTrigger
                      className={cn(
                        'w-full border-orange-500/30 bg-black/50 text-orange-100',
                        'transition-all duration-300 focus:border-orange-500 focus:ring-orange-500/20',
                        'hover:border-orange-500/50',
                      )}
                    >
                      <SelectValue placeholder="Select console" />
                    </SelectTrigger>
                    <SelectContent className="border-orange-500/30 bg-black/80 text-white">
                      <SelectItem value="Mobile">Mobile</SelectItem>
                      <SelectItem value="PS">Play Station</SelectItem>
                      <SelectItem value="XBOX">XBOX</SelectItem>
                      <SelectItem value="PC">PC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-orange-300">
                    <Hash className="h-4 w-4" />
                    <span>TOKEN</span>
                  </label>
                  <RadioGroup
                    value={formData.currency}
                    onValueChange={(val) => val && setFormData((p) => ({ ...p, currency: val }))}
                    className="grid grid-cols-2 gap-4 rounded-md border border-orange-500/30 bg-black/50 p-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        id="currency-sei"
                        value="SEI"
                        className="peer data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-600/10 data-[state=checked]:ring-orange-500/40"
                      />
                      <Label
                        htmlFor="currency-sei"
                        className="text-sm text-orange-100 peer-data-[state=checked]:text-orange-300"
                      >
                        SEI
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        id="currency-gamer"
                        value="GAMER"
                        className="peer data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-600/10 data-[state=checked]:ring-orange-500/40"
                      />
                      <Label
                        htmlFor="currency-gamer"
                        className="text-sm text-orange-100 peer-data-[state=checked]:text-orange-300"
                      >
                        GMR
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="relative">
                  <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-orange-300">
                    <Hash className="h-4 w-4" />
                    <span>WILL STREAM</span>
                  </label>
                  <RadioGroup
                    value={formData.streaming}
                    onValueChange={(val) => setFormData((p) => ({ ...p, streaming: val }))}
                    className="grid grid-cols-2 gap-4 rounded-md border border-orange-500/30 bg-black/50 p-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        id="stream-yes"
                        value="YES"
                        className="peer data-[state=checked]:border-green-500 data-[state=checked]:bg-green-600/10 data-[state=checked]:ring-green-500/40"
                      />
                      <Label
                        htmlFor="stream-yes"
                        className="text-orange-100 peer-data-[state=checked]:text-green-400"
                      >
                        YES
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        id="stream-no"
                        value="NO"
                        className="peer data-[state=checked]:border-green-500 data-[state=checked]:bg-green-600/10 data-[state=checked]:ring-green-500/40"
                      />
                      <Label
                        htmlFor="stream-no"
                        className="text-orange-100 peer-data-[state=checked]:text-green-400"
                      >
                        NO
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gaming Submit Buttons */}
          <div className="mb-10 flex justify-center space-x-4">
            <Button
              type="submit"
              disabled={isAnimating}
              className={cn(
                'relative bg-gradient-to-r from-red-600 to-orange-600 px-8 py-3 font-bold tracking-wider text-white transition-all duration-300 hover:from-red-700 hover:to-orange-700',
                'hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50',
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
                  <Flame className="h-5 w-5" />
                  <span>CREATE BATTLE</span>
                  <Zap className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Success Modal */}
        <Dialog
          open={successOpen}
          onOpenChange={(open) => {
            setSuccessOpen(open)
            if (!open && redirectTimeout.current) {
              clearTimeout(redirectTimeout.current)
              redirectTimeout.current = null
            }
          }}
        >
          <DialogContent className="border-red-500/40 bg-gradient-to-br from-red-950 via-black to-orange-950 text-white shadow-red-500/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-extrabold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                <Trophy className="h-7 w-7 text-yellow-400" />
                Challenge Sent!
              </DialogTitle>
              <DialogDescription className="text-red-200/80">
                Sync complete. Taking you to the challenge...
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-red-300/80">
                <Hash className="h-4 w-4" />
                {createdChallengeAddress?.slice(0, 6)}...{createdChallengeAddress?.slice(-4)}
              </div>
              <div className="flex items-center gap-2 text-red-300/80">
                <Zap className="h-4 w-4 animate-pulse" />
                Auto-redirect in ~1.5s
              </div>
            </div>
            <DialogFooter className="mt-4">
              <GamingButton
                variant="victory"
                size="lg"
                glow
                onClick={() => {
                  if (redirectTimeout.current) {
                    clearTimeout(redirectTimeout.current)
                    redirectTimeout.current = null
                  }
                  if (createdChallengeAddress) {
                    router.push(`/challenges/${createdChallengeAddress.toLowerCase()}`)
                  }
                }}
              >
                Open Now
              </GamingButton>
              <Button
                variant="ghost"
                className="border border-red-500/30 text-red-300 hover:text-red-200"
                onClick={() => {
                  if (redirectTimeout.current) {
                    clearTimeout(redirectTimeout.current)
                    redirectTimeout.current = null
                  }
                  setSuccessOpen(false)
                }}
              >
                Stay Here
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// Simple deterministic PRNG to avoid SSR/CSR hydration mismatches for decorative particles
function makePRNG(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 4294967295
  }
}

function DeterministicParticles({ count = 8 }: { count?: number }) {
  const particles = useMemo(() => {
    const rand = makePRNG(42)
    return Array.from({ length: count }, (_, i) => {
      const left = `${(rand() * 100).toFixed(6)}%`
      const top = `${(rand() * 100).toFixed(6)}%`
      const animationDelay = `${(i * 0.7).toFixed(1)}s`
      const animationDuration = `${(4 + rand() * 3).toFixed(6)}s`
      const colorIndex = i % 3
      return { left, top, animationDelay, animationDuration, colorIndex }
    })
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-pulse"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
          }}
        >
          <div
            className={cn(
              'h-2 w-2 rounded-full opacity-40',
              p.colorIndex === 0
                ? 'bg-red-500'
                : p.colorIndex === 1
                  ? 'bg-orange-500'
                  : 'bg-amber-500',
            )}
          />
        </div>
      ))}
    </div>
  )
}

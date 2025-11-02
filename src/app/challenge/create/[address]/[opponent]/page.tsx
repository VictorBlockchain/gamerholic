'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Sword, Users, Trophy, Hash, Zap, Flame, Target, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { GamingButton } from '@/components/ui/gaming-button'
import { cn } from '@/lib/utils'
import { useGamerProfile } from '@/context/GamerProfileContext'
import { ZERO_ADDRESS, getGamerTokenAddress } from '@/lib/tokens'
import { supabase } from '@/lib/supabase'
import { createWalletClient, custom, parseEther } from 'viem'
import { getChallengeFactoryAddress } from '@/lib/contract-addresses'
import {
  readPlatformFeeRate,
  readMinimumEntryFee,
  getNativeBalance,
  getTokenBalance,
  approveTokenIfNeeded,
  createHeadsUpChallenge,
} from '@/lib/contracts/challengeFactory'
import {
  readTournamentInfo,
  readActiveParticipants,
  readChallenge,
} from '@/lib/contracts/tournament'
import { readChallengeInfo } from '@/lib/contracts/challenge'
import { A3TokenBottomSheet, type A3TokenOption } from '@/components/modals/A3TokenBottomSheet'
import { getA3TokenAddress } from '@/lib/config/a3-tokens'

// Deterministic particles reused from original create page
function makePRNG(seed: number) {
  let t = seed
  return function () {
    t = (t * 48271) % 2147483647
    return t / 2147483647
  }
}

function DeterministicParticles({ count = 8 }: { count?: number }) {
  const seed = 12345
  const prng = useMemo(() => makePRNG(seed), [])
  const particles = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => ({
        top: `${5 + prng() * 85}%`,
        left: `${5 + prng() * 90}%`,
        size: 8 + Math.floor(prng() * 14),
        opacity: 0.15 + prng() * 0.25,
        delay: prng() * 3,
        duration: 2 + prng() * 3,
      })),
    [count, prng],
  )
  return (
    <div className="absolute inset-0 -z-10">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-pulse rounded-full bg-gradient-to-br from-red-600/50 to-orange-600/50"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

const MAX_CONTRACT_METADATA_LENGTH = 1000

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
  if (fullMetadataStr.length <= MAX_CONTRACT_METADATA_LENGTH) return fullMetadataStr
  const truncatedMetadata = {
    title: truncateForContract(formData.title, 100),
    description: truncateForContract(formData.description, 200),
    rules: truncateForContract(formData.rules, 500),
    console: formData.console,
    streaming: formData.streaming === 'YES',
  }
  const truncatedStr = JSON.stringify(truncatedMetadata)
  if (truncatedStr.length > MAX_CONTRACT_METADATA_LENGTH) {
    truncatedMetadata.rules = truncateForContract(formData.rules, 200)
    return JSON.stringify(truncatedMetadata)
  }
  return truncatedStr
}

const createDatabaseMetadata = (formData: any): string => {
  return JSON.stringify({
    title: formData.title,
    description: formData.description,
    rules: formData.rules,
    console: formData.console,
    streaming: formData.streaming === 'YES',
  })
}

export default function CreateChallengeWithParamsPage() {
  const router = useRouter()
  const params = useParams() as { address?: string; opponent?: string }
  const { profile } = useGamerProfile()

  const [successOpen, setSuccessOpen] = useState(false)
  const [createdChallengeAddress, setCreatedChallengeAddress] = useState<`0x${string}` | null>(null)
  const redirectTimeout = useRef<number | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [platformFeeRate, setPlatformFeeRate] = useState<bigint | null>(null)
  const [minimumEntryFee, setMinimumEntryFee] = useState<bigint | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    opponent: '',
    game: '',
    description: '',
    betAmount: '0',
    maxPlayers: '2',
    rules: '',
    console: '',
    currency: 'SEI',
    streaming: 'YES',
  })

  // 3xA token selection state
  const [isA3SheetOpen, setIsA3SheetOpen] = useState(false)
  const [selectedA3Token, setSelectedA3Token] = useState<A3TokenOption | null>(null)
  const [selectedA3Address, setSelectedA3Address] = useState<`0x${string}` | null>(null)

  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<Array<{
    wallet: string
    username: string
    avatar_url?: string
  }>>([])
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)

  const viewerAddress = useMemo(() => String(profile.wallet || '').toLowerCase(), [profile.wallet])
  const tournamentAddress = useMemo(
    () => String(params.address || '').toLowerCase(),
    [params.address],
  )
  const opponentAddress = useMemo(
    () => String(params.opponent || '').toLowerCase(),
    [params.opponent],
  )
  const isTournamentPairing = useMemo(() => {
    const tNonZero = tournamentAddress && tournamentAddress !== ZERO_ADDRESS.toLowerCase()
    const oNonZero = opponentAddress && opponentAddress !== ZERO_ADDRESS.toLowerCase()
    return Boolean(tNonZero && oNonZero)
  }, [tournamentAddress, opponentAddress])

  const handleFieldChange = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCurrencyChoice = (value: string) => {
    if (isTournamentPairing) return
    if (value === 'SEI') {
      setSelectedA3Token(null)
      setSelectedA3Address(null)
      setFormData((prev) => ({ ...prev, currency: 'SEI' }))
    } else if (value === '3XA') {
      setIsA3SheetOpen(true)
    }
  }

  // User search functionality
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setUserSearchResults([])
      setShowUserDropdown(false)
      return
    }

    setIsSearchingUsers(true)
    try {
      const { data, error } = await supabase
        .from('gamers')
        .select('wallet, username, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(10)

      if (error) throw error
      
      setUserSearchResults(data || [])
      setShowUserDropdown(true)
    } catch (e) {
      console.warn('Failed to search users:', e)
      setUserSearchResults([])
      setShowUserDropdown(false)
    } finally {
      setIsSearchingUsers(false)
    }
  }

  const handleUserSelect = (user: { wallet: string; username: string; avatar_url?: string }) => {
    setUserSearchQuery(user.username)
    setFormData((prev) => ({ ...prev, opponent: user.wallet }))
    setShowUserDropdown(false)
  }

  const handleOpponentInputChange = (value: string) => {
    // If it looks like a wallet address, use it directly
    if (/^0x[a-fA-F0-9]{40}$/.test(value)) {
      setFormData((prev) => ({ ...prev, opponent: value }))
      setUserSearchQuery(value)
      setShowUserDropdown(false)
    } else {
      // Otherwise, treat it as a username search
      setUserSearchQuery(value)
      setFormData((prev) => ({ ...prev, opponent: '' })) // Clear wallet until user selects
      searchUsers(value)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [feeRate, minFee] = await Promise.all([readPlatformFeeRate(), readMinimumEntryFee()])
        if (cancelled) return
        setPlatformFeeRate(feeRate)
        setMinimumEntryFee(minFee)
      } catch (e) {
        console.warn('Failed to load factory params', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setError(null)
        const v = viewerAddress
        const opp = opponentAddress
        if (!/^0x[a-fA-F0-9]{40}$/.test(v)) {
          setError('Connect wallet to create a challenge')
          return
        }
        const isTournament = tournamentAddress && tournamentAddress !== ZERO_ADDRESS.toLowerCase()
        const isPairing = Boolean(isTournament && opp && opp !== ZERO_ADDRESS.toLowerCase())
        if (!isPairing) {
          // Heads-up flow: allow user to edit inputs; skip strict pre-validation here
          return
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(opp)) {
          setError('Invalid opponent address')
          return
        }
        // Duplicate protection via DB: any active challenge with same pairing and tournament
        try {
          const { data: candidates, error: dupErr } = await supabase
            .from('challenges')
            .select('creator, opponent, status, tournament_address')
            .in('creator', [v, opp])
            .in('opponent', [v, opp])
            .neq('status', 0)
          if (dupErr) {
            console.warn('Dup check query failed:', dupErr.message)
          } else {
            const found = (candidates || []).some((row: any) => {
              const creators = [
                String(row.creator || '').toLowerCase(),
                String(row.opponent || '').toLowerCase(),
              ]
              const hasPair = creators.includes(v) && creators.includes(opp)
              const tAddr = String(row.tournament_address || '').toLowerCase()
              const tournamentMatch = tAddr === String(tournamentAddress).toLowerCase()
              return hasPair && tournamentMatch
            })
            if (found) {
              setError('A non-cancelled challenge for this pairing already exists')
              return
            }
          }
        } catch (e) {
          console.warn('Dup check failed:', e)
        }
        // Prefill form with opponent and tournament-derived game/metadata
        let gameType = formData.game
        let title = formData.title
        let rules = formData.rules
        let consoleName = formData.console
        let description = formData.description
        if (tournamentAddress && tournamentAddress !== ZERO_ADDRESS.toLowerCase()) {
          try {
            const info = await readTournamentInfo(tournamentAddress as `0x${string}`)
            gameType = info.gameType || 'custom'
            // Attempt to parse tournament metadata JSON
            try {
              const meta = JSON.parse(String(info.metadata || '{}'))
              title = meta.title || title
              description = meta.description || description
              rules = meta.rules || meta.gameRules || rules
              consoleName = meta.console || consoleName
            } catch (_) {
              // ignore parse errors and keep defaults
            }
            // Validate both are active participants
            const actives = await readActiveParticipants(tournamentAddress as `0x${string}`)
            const inActives = actives.map((a) => a.toLowerCase())
            if (!inActives.includes(v) || !inActives.includes(opp)) {
              setError('Both players must be active participants in the tournament')
              return
            }
            // Check on-chain for existing challenge between these two in this tournament
            const existing = await readChallenge(
              tournamentAddress as `0x${string}`,
              v as `0x${string}`,
              opp as `0x${string}`,
            )
            if (existing && existing !== ZERO_ADDRESS.toLowerCase()) {
              try {
                const exInfo = await readChallengeInfo(existing as `0x${string}`)
                const statusCode = Number(exInfo.status)
                if (statusCode !== 0) {
                  setError('A challenge for this pairing already exists')
                  return
                }
              } catch (e) {
                // If we can't read status, conservatively block duplicate
                setError('A challenge for this pairing may already exist')
                return
              }
            }
          } catch (e) {
            console.warn('Tournament prefill/validation failed:', e)
          }
        }
        setFormData((prev) => ({
          ...prev,
          opponent: opp,
          game: gameType || prev.game,
          title: title || prev.title,
          rules: rules || prev.rules,
          console: consoleName || prev.console,
          description: description || prev.description,
          // Force zero entry fee for tournament challenge
          betAmount: '0',
        }))
      } catch (e) {
        console.error('Prefill failed:', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentAddress, opponentAddress, viewerAddress])

  // Initialize user search query when opponent parameter is provided
  useEffect(() => {
    if (opponentAddress && opponentAddress !== ZERO_ADDRESS.toLowerCase()) {
      // If we have an opponent address, try to find their username
      const fetchOpponentUsername = async () => {
        try {
          const { data, error } = await supabase
            .from('gamers')
            .select('username')
            .eq('wallet', opponentAddress)
            .maybeSingle()
          
          if (!error && data) {
            setUserSearchQuery(data.username)
          } else {
            // Fallback to showing the address
            setUserSearchQuery(opponentAddress)
          }
        } catch (e) {
          console.warn('Failed to fetch opponent username:', e)
          setUserSearchQuery(opponentAddress)
        }
      }
      fetchOpponentUsername()
    } else {
      setUserSearchQuery('')
    }
  }, [opponentAddress])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    setIsAnimating(true)
    try {
      const account = viewerAddress as `0x${string}`
      const isTournament = tournamentAddress && tournamentAddress !== ZERO_ADDRESS.toLowerCase()
      const opponent = (isTournamentPairing
        ? (opponentAddress as `0x${string}`)
        : (String(formData.opponent).toLowerCase() as `0x${string}`))
      if (!/^0x[a-fA-F0-9]{40}$/.test(account)) throw new Error('Connect wallet to continue')
      if (!/^0x[a-fA-F0-9]{40}$/.test(opponent)) throw new Error('Invalid opponent address')
      // Entry fee: zero for tournament pairing path
      const entryFeeWei = isTournament
        ? BigInt(0)
        : parseEther((formData.betAmount || '0').toString())

      // Fee and token checks only apply when entry fee > 0
      const factory = getChallengeFactoryAddress() as `0x${string}`
      const rate = platformFeeRate ?? BigInt(0)
      const feeWei = (entryFeeWei * rate) / BigInt(10000)

      // Create wallet client from injected provider for writes
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('Wallet provider not detected. Please connect your wallet.')
      }
      const walletClient = createWalletClient({
        transport: custom((window as any).ethereum!),
        chain: undefined,
      })

      // Determine pay token from currency for heads-up; tournament path uses ZERO
      const gamerToken = getGamerTokenAddress()
      const payToken: `0x${string}` = isTournament
        ? (ZERO_ADDRESS as `0x${string}`)
        : (formData.currency === 'SEI'
            ? (ZERO_ADDRESS as `0x${string}`)
            : (selectedA3Address ?? 
               getA3TokenAddress(formData.currency) ?? 
               gamerToken ?? 
               ZERO_ADDRESS) as `0x${string}`)
      const isNative = String(payToken).toLowerCase() === ZERO_ADDRESS.toLowerCase()

      // For heads-up with non-zero entry, do best-effort balance/allowance checks
      if (!isTournament && entryFeeWei > BigInt(0)) {
        if (isNative) {
          const balCreator = await getNativeBalance(account)
          if (balCreator < entryFeeWei + feeWei)
            throw new Error('Insufficient SEI to cover amount + platform fee')
          const balOpponent = await getNativeBalance(opponent)
          if (balOpponent < entryFeeWei + feeWei)
            setInfo('Warning: Opponent may not have enough SEI to join (amount + fee).')
        } else {
          const balCreator = await getTokenBalance(payToken, account)
          if (balCreator < entryFeeWei)
            throw new Error('Insufficient selected token to cover entry amount')
          const balOpponent = await getTokenBalance(payToken, opponent)
          if (balOpponent < entryFeeWei)
            setInfo('Warning: Opponent may not have enough selected token to join.')
          await approveTokenIfNeeded(payToken, account, factory, entryFeeWei, walletClient)
        }
      }

      // Create truncated metadata for contract; full metadata for DB
      const contractMetadata = createContractMetadata(formData)
      const databaseMetadata = createDatabaseMetadata(formData)

      const { hash, challengeAddress } = await createHeadsUpChallenge(
        account,
        {
          entryFeeWei,
          opponent,
          payToken,
          tournament: isTournament
            ? (tournamentAddress as `0x${string}`)
            : (ZERO_ADDRESS as `0x${string}`),
          gameType: formData.game || 'custom',
          metadata: contractMetadata,
        },
        walletClient,
      )

      if (challengeAddress) {
        // Read on-chain info to populate correct type/status
        const onchain = await readChallengeInfo(challengeAddress)
        const insert = {
          contract_address: challengeAddress,
          creator: account,
          opponent,
          challenge_type: Number(onchain.challengeType),
          status: Number(onchain.status),
          game_type: onchain.gameType || formData.game || 'custom',
          entry_fee: String(onchain.entryFee ?? entryFeeWei),
          total_prize_pool: String(onchain.totalPrizePool ?? entryFeeWei * BigInt(2)),
          pay_token: onchain.payToken ?? payToken ?? ZERO_ADDRESS,
          metadata: databaseMetadata,
          is_streaming: formData.streaming === 'YES',
          stream_embed_code: null,
          tournament_address: isTournament ? String(tournamentAddress).toLowerCase() : null,
          created_at: new Date().toISOString(),
        }
        const { error: dbError } = await supabase.from('challenges').insert(insert)
        if (dbError) throw dbError
        setCreatedChallengeAddress(challengeAddress)
        setSuccessOpen(true)
        redirectTimeout.current = window.setTimeout(() => {
          router.push(`/challenges/${challengeAddress.toLowerCase()}`)
        }, 1500)
      }

      console.log('Challenge created, tx:', hash)
    } catch (err: unknown) {
      console.error(err)
      const msg = (err as any)?.message || 'Failed to create challenge'
      setError(msg)
    } finally {
      setIsAnimating(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-red-950 via-black to-orange-950 pt-24 pb-8">
      <DeterministicParticles count={8} />

      <div className="relative z-10 mx-auto max-w-2xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/tournaments/${tournamentAddress}`}>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="relative overflow-hidden border-red-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md">
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
                <div className="relative">
                  <Input
                    name="opponent"
                    value={userSearchQuery}
                    onChange={(e) => handleOpponentInputChange(e.target.value)}
                    placeholder={isTournamentPairing ? "Tournament opponent" : "Enter username or wallet address"}
                    readOnly={isTournamentPairing}
                    disabled={isTournamentPairing}
                    className={cn(
                      'border-red-500/30 bg-black/50 text-red-100',
                      'transition-all duration-300',
                      !isTournamentPairing && 'cursor-text',
                    )}
                    onFocus={() => !isTournamentPairing && userSearchQuery && setShowUserDropdown(true)}
                    onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                  />
                  {isSearchingUsers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-transparent"></div>
                    </div>
                  )}
                  {showUserDropdown && userSearchResults.length > 0 && !isTournamentPairing && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-600 bg-gray-800 shadow-lg">
                      {userSearchResults.map((user) => (
                        <button
                          key={user.wallet}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-gray-700 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-xs font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{user.username}</div>
                            <div className="text-xs text-gray-400 truncate">{user.wallet}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <label className="mb-2 block flex items-center space-x-2 text-sm font-bold tracking-wider text-red-300">
                  <Trophy className="h-4 w-4" />
                  <span>GAME ARENA</span>
                </label>
                <Input
                  name="game"
                  value={formData.game}
                  readOnly
                  disabled
                  className={cn(
                    'border-red-500/30 bg-black/50 text-red-100',
                    'transition-all duration-300',
                  )}
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
                  readOnly
                  disabled
                  rows={3}
                  className={cn(
                    'resize-none border-red-500/30 bg-black/50 text-red-100',
                    'transition-all duration-300',
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md">
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
                      readOnly
                      disabled
                      className={cn(
                        'border-orange-500/30 bg-black/50 text-orange-100',
                        'pr-8 transition-all duration-300',
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
                  <Select value={formData.console}>
                    <SelectTrigger
                      disabled
                      className={cn(
                        'w-full border-orange-500/30 bg-black/50 text-orange-100',
                        'transition-all duration-300',
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
                    value={formData.currency === 'SEI' ? 'SEI' : '3XA'}
                    onValueChange={handleCurrencyChoice}
                    className="grid grid-cols-2 gap-4 rounded-md border border-orange-500/30 bg-black/50 p-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        id="currency-sei"
                        value="SEI"
                        disabled={isTournamentPairing}
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
                        id="currency-3xa"
                        value="3XA"
                        disabled={isTournamentPairing}
                        className="peer data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-600/10 data-[state=checked]:ring-orange-500/40"
                      />
                      <Label
                        htmlFor="currency-3xa"
                        className="text-sm text-orange-100 peer-data-[state=checked]:text-orange-300"
                      >
                        {selectedA3Token?.label || '3xA'}
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
                    onValueChange={(val) => handleFieldChange('streaming', val)}
                    className="grid grid-cols-2 gap-4 rounded-md border border-orange-500/30 bg-black/50 p-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        id="stream-yes"
                        value="YES"
                        disabled={isTournamentPairing}
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
                        disabled={isTournamentPairing}
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
              <div className="flex justify-end">
                <Button type="submit" disabled={!!error || isAnimating} className="gap-2">
                  Create Challenge
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

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

        {/* 3xA Token Selector Bottom Sheet */}
        <A3TokenBottomSheet
          isOpen={isA3SheetOpen}
          onClose={() => setIsA3SheetOpen(false)}
          onSelect={(opt) => {
            setSelectedA3Token(opt)
            setSelectedA3Address(opt.address || null)
            setFormData((prev) => ({ ...prev, currency: opt.label }))
          }}
        />
      </div>
    </div>
  )
}

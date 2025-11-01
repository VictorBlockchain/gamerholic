'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ChallengeCard from '@/components/cards/ChallengeCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Plus,
  Trophy,
  Gamepad2,
  Users,
  Zap,
  TrendingUp,
  Shield,
  Star,
  ChevronDown,
  Grid,
  List,
  SlidersHorizontal,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/context/UserContext'
type ChallengeRow = {
  contract_address: string
  creator: string | null
  opponent: string | null
  status: number
  game_type: string | null
  entry_fee: string | number | null
  total_prize_pool: string | number | null
  pay_token: string | null
  metadata: any
  score_reporter?: string | null
  created_at?: string | null
}

type UiStatus =
  | 'sent'
  | 'accepted'
  | 'scored'
  | 'score_confirm_pending'
  | 'in_dispute'
  | 'completed'
  | 'canceled'

const weiToEth = (v: string | number | null | undefined) => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : 0
  return Number(n) / 1e18
}

const mapStatusToUi = (code: number, viewer?: string, reporter?: string | null): UiStatus => {
  // Aligns with ChallengeStatus enum in contracts/contracts/Challenge.sol
  // 0 CANCELLED, 1 ACTIVE, 2 ACCEPTED, 3 SCORE_REPORTED, 4 SCORE_CONFIRMED, 5 DISPUTED
  switch (code) {
    case 0: // CANCELLED
      return 'canceled'
    case 1: // ACTIVE
      // UI uses "sent" to represent an active/open challenge
      return 'sent'
    case 2: // ACCEPTED
      return 'accepted'
    case 3: // SCORE_REPORTED
      // If the current viewer is the score reporter, show confirm-pending; otherwise show scored
      return viewer && reporter && viewer.toLowerCase() === String(reporter).toLowerCase()
        ? 'score_confirm_pending'
        : 'scored'
    case 4: // SCORE_CONFIRMED
      // UI shows confirmed scores as completed
      return 'completed'
    case 5: // DISPUTED
      return 'in_dispute'
    default:
      return 'sent'
  }
}

export default function ChallengesPage() {
  const router = useRouter()
  const { address: viewerAddress } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [gameFilter, setGameFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [rows, setRows] = useState<ChallengeRow[]>([])
  const [gamerMap, setGamerMap] = useState<
    Record<string, { username?: string; avatar_url?: string }>
  >({})
  const [activeGamersCount, setActiveGamersCount] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await supabase
          .from('challenges')
          .select(
            'contract_address, creator, opponent, status, game_type, entry_fee, total_prize_pool, pay_token, metadata, score_reporter, created_at',
          )
          .order('created_at', { ascending: false })
        if (!mounted) return
        const fetched = (data || []) as ChallengeRow[]
        setRows(fetched)
        const wallets = Array.from(
          new Set(
            fetched
              .map((r) => [
                String(r.creator || '').toLowerCase(),
                String(r.opponent || '').toLowerCase(),
              ])
              .flat()
              .filter((w) => !!w && w.startsWith('0x')),
          ),
        )
        if (wallets.length) {
          const { data: gamers } = await supabase
            .from('gamers')
            .select('wallet, username, avatar_url')
            .in('wallet', wallets)
          const map: Record<string, { username?: string; avatar_url?: string }> = {}
          for (const g of gamers || []) {
            map[String(g.wallet).toLowerCase()] = {
              username: g.username,
              avatar_url: g.avatar_url || undefined,
            }
          }
          setGamerMap(map)
        }
      } catch (e) {
        console.warn('Failed to load challenges:', e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { count } = await supabase
          .from('gamers')
          .select('wallet', { count: 'exact', head: true })
        setActiveGamersCount(count || 0)
      } catch (e) {
        console.warn('Failed to load gamers count:', e)
      }
    })()
  }, [])

  const uniqueGames = useMemo(() => {
    return Array.from(new Set(rows.map((r) => String(r.game_type || '').trim()).filter(Boolean)))
  }, [rows])

  const viewModels = useMemo(() => {
    return rows.map((r) => {
      const meta = ((): any => {
        try {
          return r.metadata || {}
        } catch {
          return {}
        }
      })()
      const gameName = meta.title || r.game_type || 'Custom Game'
      const consoleName = meta.console || 'PC'
      const statusUi = mapStatusToUi(Number(r.status), viewerAddress, r.score_reporter)
      const creator = String(r.creator || '').toLowerCase()
      const opponent = String(r.opponent || '').toLowerCase()
      const creatorProfile = gamerMap[creator] || {}
      const opponentProfile = gamerMap[opponent] || {}
      const isNative =
        String(r.pay_token || '').toLowerCase() === '0x0000000000000000000000000000000000000000'
      const seiPool = isNative ? weiToEth(r.total_prize_pool) : 0
      const gamerPool = !isNative ? weiToEth(r.total_prize_pool) : 0
      return {
        id: r.contract_address,
        challenger: {
          id: creator || 'unknown',
          username: creatorProfile.username || (creator ? `gamer_${creator.slice(2, 8)}` : 'gamer'),
          avatar: creatorProfile.avatar_url || '/logo.png',
          level: 0,
        },
        opponent: {
          id: opponent || 'unknown',
          username:
            opponentProfile.username || (opponent ? `gamer_${opponent.slice(2, 8)}` : 'gamer'),
          avatar: opponentProfile.avatar_url || '/logo.png',
          level: 0,
        },
        game: { name: gameName, console: consoleName },
        amount: { sei: seiPool, gamer: gamerPool },
        status: statusUi as UiStatus,
        rules: Array.isArray(meta.rules) ? meta.rules : [],
        createdAt: r.created_at || new Date().toISOString(),
      }
    })
  }, [rows, gamerMap, viewerAddress])

  const filteredChallenges = useMemo(() => {
    return viewModels.filter((challenge) => {
      const matchesSearch =
        challenge.game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.challenger.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.opponent.username.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || challenge.status === (statusFilter as UiStatus)
      const matchesGame =
        gameFilter === 'all' ||
        challenge.game.name === gameFilter ||
        String(rows.find((r) => r.contract_address === challenge.id)?.game_type || '') ===
          gameFilter
      return matchesSearch && matchesStatus && matchesGame
    })
  }, [viewModels, searchTerm, statusFilter, gameFilter, rows])

  const prizeTotals = useMemo(() => {
    let sei = 0
    let gamer = 0
    for (const r of rows) {
      const isNative =
        String(r.pay_token || '').toLowerCase() === '0x0000000000000000000000000000000000000000'
      const val = weiToEth(r.total_prize_pool)
      if (isNative) sei += val
      else gamer += val
    }
    return { sei, gamer }
  }, [rows])

  return (
    <div className="min-h-screen bg-black pt-24 pb-8 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
        <div className="relative container mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 text-center sm:mb-8">
            <div className="mb-3 flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 sm:h-12 sm:w-12">
                <Trophy className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h1 className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl md:text-5xl">
                Heads Up Challenges
              </h1>
            </div>
            <p className="text-base font-medium text-amber-400 sm:text-lg">
              I Win For A Living - Head Up Battles & Tournaments
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-3 text-center sm:p-4">
              <div className="mb-1 flex items-center justify-center gap-1 text-amber-400 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-lg font-black sm:text-2xl">{activeGamersCount}</span>
              </div>
              <p className="text-[10px] text-gray-400 sm:text-xs">Active Gamers</p>
            </div>
            <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-600/10 p-3 text-center sm:p-4">
              <div className="mb-1 flex items-center justify-center gap-1 text-purple-400 sm:gap-2">
                <Gamepad2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-lg font-black sm:text-2xl">{rows.length}</span>
              </div>
              <p className="text-[10px] text-gray-400 sm:text-xs">Total Battles</p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-600/10 p-3 text-center sm:p-4">
              <div className="mb-1 flex items-center justify-center gap-1 text-green-400 sm:gap-2">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-lg font-black sm:text-2xl">
                  {`${Math.round(prizeTotals.sei)} SEI + ${Math.round(prizeTotals.gamer)} GAMER`}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 sm:text-xs">SEI?GAMER Prizes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search Section */}
      <section className="container mx-auto mb-6 px-4 sm:mb-8">
        <div className="rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-4 shadow-xl sm:p-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search games, players, or challenges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-xl border-gray-600 bg-gray-800/50 pl-10 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:ring-amber-500/20 sm:h-12 sm:text-base"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-1 flex-wrap gap-2 sm:gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full rounded-xl border-gray-600 bg-gray-800/50 text-xs text-white sm:h-10 sm:w-32 sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-600 bg-gray-800">
                  <SelectItem value="all" className="text-xs sm:text-sm">
                    All Status
                  </SelectItem>
                  <SelectItem value="sent" className="text-xs sm:text-sm">
                    Sent
                  </SelectItem>
                  <SelectItem value="accepted" className="text-xs sm:text-sm">
                    Accepted
                  </SelectItem>
                  <SelectItem value="scored" className="text-xs sm:text-sm">
                    Scored
                  </SelectItem>
                  <SelectItem value="score_confirm_pending" className="text-xs sm:text-sm">
                    Pending
                  </SelectItem>
                  <SelectItem value="in_dispute" className="text-xs sm:text-sm">
                    Dispute
                  </SelectItem>
                  <SelectItem value="completed" className="text-xs sm:text-sm">
                    Completed
                  </SelectItem>
                  <SelectItem value="canceled" className="text-xs sm:text-sm">
                    Canceled
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger className="h-9 w-full rounded-xl border-gray-600 bg-gray-800/50 text-xs text-white sm:h-10 sm:w-40 sm:text-sm">
                  <SelectValue placeholder="Game" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-600 bg-gray-800">
                  <SelectItem value="all" className="text-xs sm:text-sm">
                    All Games
                  </SelectItem>
                  {uniqueGames.map((game) => (
                    <SelectItem key={game} value={game} className="text-xs sm:text-sm">
                      {game}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-9 rounded-xl border-gray-600 px-3 text-xs text-gray-300 hover:bg-gray-700 hover:text-white sm:h-10 sm:px-4 sm:text-sm"
              >
                <SlidersHorizontal className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>

              <Button className="h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 text-xs font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:from-amber-600 hover:to-orange-700 hover:shadow-amber-500/40 sm:h-10 sm:px-4 sm:text-sm">
                <Plus className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                Create
              </Button>
            </div>
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showFilters && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start rounded-lg text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  <Trophy className="mr-2 h-3 w-3" />
                  High Stakes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start rounded-lg text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  <Zap className="mr-2 h-3 w-3" />
                  Quick Match
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start rounded-lg text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  <Shield className="mr-2 h-3 w-3" />
                  Verified Only
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start rounded-lg text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  <Star className="mr-2 h-3 w-3" />
                  Top Rated
                </Button>
              </div>
            </div>
          )}

          {/* Results Bar */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400 sm:text-sm">
              <span className="font-bold text-amber-400">{filteredChallenges.length}</span>{' '}
              challenges found
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 rounded-lg p-0 ${viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 rounded-lg p-0 ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges Grid */}
      <section className="container mx-auto px-4 pb-8">
        {filteredChallenges.length > 0 ? (
          <div
            className={`grid gap-3 sm:gap-4 ${
              viewMode === 'grid'
                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}
          >
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                {...challenge}
                onViewChallenge={(id) => router.push(`/challenges/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-800 sm:h-20 sm:w-20">
              <Search className="h-6 w-6 text-gray-600 sm:h-8 sm:w-8" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">No Challenges Found</h3>
            <p className="mb-6 text-sm text-gray-400 sm:text-base">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setGameFilter('all')
              }}
              variant="outline"
              className="rounded-xl border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

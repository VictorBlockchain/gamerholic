'use client'

import React, { useEffect, useMemo, useState } from 'react'
import TournamentCard from '@/components/cards/TournamentCard'
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
  Calendar,
  DollarSign,
  Crown,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ZERO_ADDRESS } from '@/lib/tokens'
import { useGamerProfile } from '@/context/GamerProfileContext'
import { useRouter } from 'next/navigation'
// Supabase tournament row type
type TournamentRow = {
  contract_address: string
  creator: string
  entry_fee: string | number | null
  max_participants: number | null
  created_at: string | null
  game_type: string | null
  metadata: any
  pay_token: string | null
  is_ffa: boolean | null
  status: number | null
  total_prize_pool: string | number | null
  participants: any
  // Missing fields from on-chain TournamentInfo
  xft_to_join: number | null
}

type UiStatus = 'ACTIVE' | 'STARTED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'

const weiToEth = (v?: string | number | null) => {
  if (!v) return 0
  const n = typeof v === 'string' ? Number(v) : Number(v)
  if (!Number.isFinite(n)) return 0
  return n / 1e18
}

const mapStatusToUi = (s?: number | null): UiStatus => {
  switch (Number(s ?? 0)) {
    case 0:
      return 'ACTIVE'
    case 1:
      return 'STARTED'
    case 2:
      return 'COMPLETED'
    case 3:
      return 'DISPUTED'
    case 4:
      return 'CANCELLED'
    default:
      return 'ACTIVE'
  }
}

type CardStatus = UiStatus

// CardStatus now matches UiStatus; no mapping needed

export default function TournamentsPage() {
  const router = useRouter()
  const { address: viewerAddress, isConnected } = useGamerProfile()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [gameFilter, setGameFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [rows, setRows] = useState<TournamentRow[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select(
            'contract_address, creator, entry_fee, max_participants, created_at, game_type, metadata, pay_token, is_ffa, status, total_prize_pool, participants',
          )
          .order('created_at', { ascending: false })
        if (error) throw error
        const normalized: TournamentRow[] = (data || []).map((d: any) => ({
          contract_address: d?.contract_address ?? '',
          creator: d?.creator ?? '',
          entry_fee: d?.entry_fee ?? null,
          max_participants: d?.max_participants ?? null,
          created_at: d?.created_at ?? null,
          game_type: d?.game_type ?? null,
          metadata: d?.metadata ?? {},
          pay_token: d?.pay_token ?? null,
          is_ffa: d?.is_ffa ?? null,
          status: d?.status ?? null,
          total_prize_pool: d?.total_prize_pool ?? null,
          participants: d?.participants ?? [],
          xft_to_join: d?.xft_to_join ?? null,
        }))
        if (!cancelled) setRows(normalized)
      } catch (e) {
        console.warn('Failed to load tournaments:', e)
        if (!cancelled) setRows([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const tournaments = useMemo(() => {
    return (rows || []).map((r) => {
      let title = r.game_type || ''
      let consoleName = ''
      let image = '/logo.png'
      let startDate = ''
      try {
        const md = r.metadata || {}
        title = String(md?.title || md?.game || title || '').trim()
        consoleName = String(md?.console || '').trim()
        startDate = md?.startDate
          ? String(md.startDate) + (md?.startTime ? ` ${String(md.startTime)}` : '')
          : ''
      } catch {}
      const entry = weiToEth(r.entry_fee)
      const isNative = String(r.pay_token || '').toLowerCase() === ZERO_ADDRESS.toLowerCase()
      const playersCurrent = Array.isArray(r?.participants) ? r.participants.length : 0
      const max = Number(r.max_participants || 0) || 0
      const prize = weiToEth(r.total_prize_pool)
      const type: 'bracket' | 'free-for-all' = r.is_ffa ? 'free-for-all' : 'bracket'
      const contractStatus = mapStatusToUi(r.status)
      const uiStatus = contractStatus
      const createdIso = r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
      return {
        id: r.contract_address,
        game: { name: title || (r.game_type || ''), console: consoleName, image },
        type,
        entryFee: { sei: isNative ? entry : 0, gamer: isNative ? 0 : entry },
        players: { current: playersCurrent, max },
        startDate: (startDate || createdIso).slice(0, 10),
        host: r.creator,
        status: uiStatus,
        prize,
      }
    })
  }, [rows])

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      tournament.game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.game.console.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || tournament.type === typeFilter
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter
    const matchesGame = gameFilter === 'all' || tournament.game.name === gameFilter

    return matchesSearch && matchesType && matchesStatus && matchesGame
  })
  const uniqueGames = useMemo(() => {
    return Array.from(new Set(tournaments.map((t) => t.game.name))).filter(Boolean)
  }, [tournaments])
  const totalPrizePool = filteredTournaments.reduce((sum, t) => sum + (t.prize || 0), 0)

  const handleViewTournament = (id: string) => {
    try {
      const addr = String(id || '').toLowerCase()
      if (addr.startsWith('0x') && addr.length === 42) {
        router.push(`/tournaments/${addr}`)
        return
      }
    } catch {}
    console.log('View tournament:', id)
  }

  return (
    <div className="pn-8 min-h-screen bg-black pt-24 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent" />
        <div className="relative container mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 text-center sm:mb-8">
            <div className="mb-3 flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25 sm:h-12 sm:w-12">
                <Crown className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h1 className="bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl md:text-5xl">
                Gaming Tournaments
              </h1>
            </div>
            <p className="text-base font-medium text-purple-400 sm:text-lg">
              Compete for Glory & Epic Prizes
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
            <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-600/10 p-3 text-center sm:p-4">
              <div className="mb-1 flex items-center justify-center gap-1 text-purple-400 sm:gap-2">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-lg font-black sm:text-2xl">{filteredTournaments.length}</span>
              </div>
              <p className="text-[10px] text-gray-400 sm:text-xs">Active Tournaments</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-3 text-center sm:p-4">
              <div className="mb-1 flex items-center justify-center gap-1 text-amber-400 sm:gap-2">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-lg font-black sm:text-2xl">
                  {totalPrizePool.toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 sm:text-xs">Total Prizes</p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-600/10 p-3 text-center sm:p-4">
              <div className="mb-1 flex items-center justify-center gap-1 text-green-400 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-lg font-black sm:text-2xl">500+</span>
              </div>
              <p className="text-[10px] text-gray-400 sm:text-xs">Daily Players</p>
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
                placeholder="Search tournaments, games, or consoles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-xl border-gray-600 bg-gray-800/50 pl-10 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500/20 sm:h-12 sm:text-base"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-1 flex-wrap gap-2 sm:gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-full rounded-xl border-gray-600 bg-gray-800/50 text-xs text-white sm:h-10 sm:w-32 sm:text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-600 bg-gray-800">
                  <SelectItem value="all" className="text-xs sm:text-sm">
                    All Types
                  </SelectItem>
                  <SelectItem value="bracket" className="text-xs sm:text-sm">
                    Bracket
                  </SelectItem>
                  <SelectItem value="free-for-all" className="text-xs sm:text-sm">
                    Free For All
                  </SelectItem>
                  <SelectItem value="1v1" className="text-xs sm:text-sm">
                    1 v 1
                  </SelectItem>
                  <SelectItem value="teams" className="text-xs sm:text-sm">
                    Teams
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full rounded-xl border-gray-600 bg-gray-800/50 text-xs text-white sm:h-10 sm:w-32 sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-600 bg-gray-800">
                  <SelectItem value="all" className="text-xs sm:text-sm">
                    All Status
                  </SelectItem>
              <SelectItem value="ACTIVE" className="text-xs sm:text-sm">
                Active
              </SelectItem>
              <SelectItem value="STARTED" className="text-xs sm:text-sm">
                Started
              </SelectItem>
              <SelectItem value="COMPLETED" className="text-xs sm:text-sm">
                Completed
              </SelectItem>
              <SelectItem value="DISPUTED" className="text-xs sm:text-sm">
                Disputed
              </SelectItem>
              <SelectItem value="CANCELLED" className="text-xs sm:text-sm">
                Cancelled
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

              <Button className="h-9 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-3 text-xs font-bold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:from-purple-600 hover:to-pink-700 hover:shadow-purple-500/40 sm:h-10 sm:px-4 sm:text-sm">
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
                  High Prize
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start rounded-lg text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  <Zap className="mr-2 h-3 w-3" />
                  Starting Soon
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start rounded-lg text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  <Shield className="mr-2 h-3 w-3" />
                  NFT Required
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start rounded-lg text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  <Star className="mr-2 h-3 w-3" />
                  Popular
                </Button>
              </div>
            </div>
          )}

          {/* Results Bar */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400 sm:text-sm">
              <span className="font-bold text-purple-400">{filteredTournaments.length}</span>{' '}
              tournaments found
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 rounded-lg p-0 ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 rounded-lg p-0 ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tournaments Grid */}
      <section className="container mx-auto px-4 pb-8">
        {filteredTournaments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800">
              <Trophy className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">No tournaments found</h3>
            <p className="mb-6 text-gray-400">Try adjusting your filters or search terms</p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
                setStatusFilter('all')
                setGameFilter('all')
              }}
              className="bg-purple-500 text-white hover:bg-purple-600"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'space-y-4'
            }
          >
            {filteredTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onViewTournament={handleViewTournament}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

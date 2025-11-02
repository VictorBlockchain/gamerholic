'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  User,
  Crown,
  Edit2,
  MessageSquare,
  Gamepad2,
  TrendingUp,
  Twitter,
  Github,
  Globe,
  Target,
  Users,
  Trophy,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGamerProfile } from '@/context/GamerProfileContext'
import { supabase } from '@/lib/supabase'

type DBGamer = {
  wallet: string
  username: string
  avatar_url?: string | null
  cover_url?: string | null
  bio?: string | null
  team?: string | null
  role?: string | null
  region?: string | null
  socials?: any
  streaming?: boolean | null
  games?: any[] | null
}

type ChallengeActivity = {
  id: number
  type: 'challenge'
  game: string
  opponent: string
  result: 'win' | 'loss' | null
  amount: string
  time: string
  mode: string
}

type TournamentActivity = {
  id: number
  type: 'tournament'
  game: string
  name: string
  position: number
  prize: string
  time: string
  participants: number
}

type AchievementActivity = {
  id: number
  type: 'achievement'
  title: string
  description: string
  time: string
  icon: string
}

type RecentActivity = ChallengeActivity | TournamentActivity | AchievementActivity

const mockRecentActivity: RecentActivity[] = [
  {
    id: 1,
    type: 'challenge',
    game: 'Madden NFL 24',
    opponent: 'ProGamer42',
    result: 'win',
    amount: '0.5 ETH',
    time: '2h ago',
    mode: '1v1 Ranked',
  },
  {
    id: 2,
    type: 'tournament',
    game: 'NBA 2K24',
    name: 'Weekly Championship',
    position: 3,
    prize: '0.3 ETH',
    time: '1d ago',
    participants: 64,
  },
  {
    id: 3,
    type: 'challenge',
    game: 'Call of Duty',
    opponent: 'SniperElite',
    result: 'win',
    amount: '1.0 ETH',
    time: '2d ago',
    mode: 'Team Deathmatch',
  },
  {
    id: 4,
    type: 'achievement',
    title: 'Win Streak Master',
    description: 'Won 10 challenges in a row',
    time: '3d ago',
    icon: '🔥',
  },
  {
    id: 5,
    type: 'challenge',
    game: 'Valorant',
    opponent: 'AimGod',
    result: 'loss',
    amount: '0.5 ETH',
    time: '4d ago',
    mode: 'Competitive',
  },
]

const mockChallenges = [
  {
    id: 1,
    game: 'Madden NFL 24',
    opponent: 'ProGamer42',
    status: 'completed',
    result: 'win',
    date: '2024-03-20',
    bet: '0.5 ETH',
  },
  {
    id: 2,
    game: 'NBA 2K24',
    opponent: 'BallKing',
    status: 'completed',
    result: 'win',
    date: '2024-03-19',
    bet: '0.3 ETH',
  },
  {
    id: 3,
    game: 'Call of Duty',
    opponent: 'SniperElite',
    status: 'pending',
    result: null,
    date: '2024-03-21',
    bet: '1.0 ETH',
  },
]

const mockTournaments = [
  {
    id: 1,
    name: 'Spring Championship 2024',
    game: 'Madden NFL 24',
    participants: 64,
    position: 1,
    prize: '5.0 ETH',
    date: '2024-03-15',
  },
  {
    id: 2,
    name: 'Weekly Valorant Cup',
    game: 'Valorant',
    participants: 32,
    position: 3,
    prize: '0.5 ETH',
    date: '2024-03-10',
  },
]

const mockCreatedTournaments = [
  {
    id: 1,
    name: 'Community Madden League',
    game: 'Madden NFL 24',
    participants: 16,
    status: 'active',
    prize: '2.0 ETH',
    date: '2024-03-01',
  },
  {
    id: 2,
    name: 'Casual NBA Fridays',
    game: 'NBA 2K24',
    participants: 8,
    status: 'completed',
    prize: '0.5 ETH',
    date: '2024-02-15',
  },
]

const mockCreatedChallenges = [
  {
    id: 1,
    game: 'Madden NFL 24',
    mode: '1v1 Ranked',
    opponent: 'RookieKing23',
    amount: '0.5',
    status: 'pending',
    expiresIn: '2h 15m',
  },
  {
    id: 2,
    game: 'NBA 2K24',
    mode: '3pt Contest',
    opponent: 'SharpShooter',
    amount: '0.3',
    status: 'active',
    expiresIn: '45m',
  },
  {
    id: 3,
    game: 'Call of Duty',
    mode: 'Team Deathmatch',
    opponent: 'SquadLeader',
    amount: '1.0',
    status: 'pending',
    expiresIn: '5h 30m',
  },
]

const rankConfig = {
  Bronze: { color: 'from-amber-700 to-amber-900', borderColor: 'border-amber-700' },
  Silver: { color: 'from-gray-400 to-gray-600', borderColor: 'border-gray-400' },
  Gold: { color: 'from-yellow-500 to-amber-600', borderColor: 'border-yellow-500' },
  Diamond: { color: 'from-blue-400 to-cyan-500', borderColor: 'border-blue-400' },
  Champion: { color: 'from-purple-500 to-pink-500', borderColor: 'border-purple-500' },
} as const

function getActivityBarColor(activity: RecentActivity) {
  if (activity.type === 'challenge') {
    return activity.result === 'win' ? 'bg-green-500' : 'bg-red-500'
  }
  if (activity.type === 'tournament') {
    return 'bg-blue-500'
  }
  return 'bg-amber-500'
}

const statusConfig = {
  completed: {
    label: 'Completed',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  active: {
    label: 'Active',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
} as const

export default function ProfileAddressPage() {
  const params = useParams() as { address?: string }
  const target = String(params.address || '').toLowerCase()
  const { address: selfAddress, profile } = useGamerProfile()
  const isSelf = !!selfAddress && target === String(selfAddress).toLowerCase()

  const [dbProfile, setDbProfile] = useState<DBGamer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activityScrollRef = useRef<HTMLDivElement>(null)

  const scrollActivity = (direction: 'left' | 'right') => {
    if (activityScrollRef.current) {
      const scrollAmount = 320
      activityScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const viewUsername = useMemo(() => {
    if (isSelf) return profile?.username || 'player'
    return dbProfile?.username || `gamer_${target.slice(2, 8)}`
  }, [isSelf, profile?.username, dbProfile, target])

  const avatarSrc = isSelf
    ? profile?.avatarUrl || '/logo.png'
    : dbProfile?.avatar_url || '/logo.png'
  const coverUrl = isSelf ? profile?.coverUrl || '/home.png' : dbProfile?.cover_url || '/home.png'
  const bio = isSelf ? profile?.bio || '' : dbProfile?.bio || ''
  const walletDisplay = `${target.slice(0, 6)}...${target.slice(-4)}`

  const primaryRank = (isSelf ? profile?.games?.[0]?.rank : dbProfile?.games?.[0]?.rank) || 'Bronze'
  const rankKey =
    (primaryRank as keyof typeof rankConfig) in rankConfig
      ? (primaryRank as keyof typeof rankConfig)
      : 'Bronze'
  const featuredGames = (isSelf ? profile?.games || [] : dbProfile?.games || [])
    .map((g: any) => g?.title)
    .filter(Boolean)
    .slice(0, 5)
  const records = isSelf ? profile?.games || [] : dbProfile?.games || []
  const totalWins = records.reduce(
    (sum: number, g: any) => sum + (g?.win_loss_record?.wins || 0),
    0,
  )
  const totalLosses = records.reduce(
    (sum: number, g: any) => sum + (g?.win_loss_record?.losses || 0),
    0,
  )
  const winRate =
    totalWins + totalLosses > 0 ? Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0

  const level = isSelf ? ((profile as any)?.level ?? 1) : 1
  const xp = level * 100
  const nextLevelXp = xp + 100
  const progressPct = Math.min(100, Math.round((xp / nextLevelXp) * 100))

  useEffect(() => {
    const run = async () => {
      if (!target || isSelf) return
      try {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from('gamers')
          .select(
            'wallet,username,avatar_url,cover_url,bio,team,role,region,socials,streaming,games',
          )
          .eq('wallet', target)
          .maybeSingle()
        if (error) throw error
        if (!data) {
          setDbProfile(null)
          setError('Profile not found')
        } else {
          setDbProfile(data as DBGamer)
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [target, isSelf])

  return (
    <div className="min-h-screen bg-black pt-24 pb-8 text-white">
      {/* Header Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
        <div className="relative container mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 text-center sm:mb-8">
            <div className="mb-3 flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 sm:h-12 sm:w-12">
                <User className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h1 className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl md:text-5xl">
                Gamer Profile
              </h1>
            </div>
            <p className="text-base font-medium text-amber-400 sm:text-lg">
              View gamer stats & history
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Enhanced Gamer Card */}
          <div className="lg:col-span-1">
            <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black transition-all duration-300 hover:border-gray-700">
              {/* Status Bar */}
              <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-600" />

              {/* Banner Section */}
              <div className="relative h-32">
                <div className="absolute inset-0">
                  <img
                    src={coverUrl}
                    alt={`${viewUsername} cover`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

                {/* Online Status Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-400">Online</span>
                </div>

                {/* Rank Badge */}
                <div className="absolute -bottom-6 left-6">
                  <div
                    className={`rounded-full bg-gradient-to-r px-3 py-1 ${rankConfig[rankKey].color} border ${rankConfig[rankKey].borderColor} backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-white" />
                      <span className="text-xs font-bold text-white">{primaryRank}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-10">
                {/* Profile Header */}
                <div className="mb-6 text-center">
                  <div className="relative mb-4 inline-block">
                    <Avatar className="h-20 w-20 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20">
                      <AvatarImage src={avatarSrc} alt={viewUsername} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-xl font-bold text-white">
                        {viewUsername.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-xs font-bold text-white shadow-lg">
                      {level}
                    </div>
                  </div>

                  <h2 className="mb-2 text-xl font-bold text-white">{viewUsername}</h2>
                  <div className="mb-3 font-mono text-sm text-gray-400">{walletDisplay}</div>

                  {/* Status Message */}
                  <div className="mb-4 flex items-center justify-center gap-2">
                    <MessageSquare className="h-3 w-3 text-gray-500" />
                    <p className="text-sm text-gray-300 italic">{bio}</p>
                  </div>

                  {/* Level Progress */}
                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-xs text-gray-400">
                      <span>Level {level}</span>
                      <span>
                        {xp}/{nextLevelXp} XP
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-800">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mb-4 flex gap-2">
                    {isSelf ? (
                      <Link href={`/profile/${target}/edit`} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-sm font-bold text-white hover:from-amber-600 hover:to-orange-700">
                          <Edit2 className="mr-1 h-3 w-3" />
                          EDIT
                        </Button>
                      </Link>
                    ) : (
                      <Button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-sm font-bold text-white hover:from-green-600 hover:to-emerald-700">
                        <Gamepad2 className="mr-1 h-3 w-3" />
                        CHALLENGE
                      </Button>
                    )}
                  </div>
                </div>

                {/* Featured Games */}
                <div className="mb-6">
                  <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Featured Games
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {featuredGames.map((game: string, index: number) => (
                      <span
                        key={index}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300"
                      >
                        {game}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="mb-6 flex justify-center gap-3">
                  <div className="cursor-pointer rounded-lg bg-gray-800 p-2 transition-colors hover:bg-gray-700">
                    <Twitter className="h-4 w-4 text-gray-400 transition-colors hover:text-white" />
                  </div>
                  <div className="cursor-pointer rounded-lg bg-gray-800 p-2 transition-colors hover:bg-gray-700">
                    <Github className="h-4 w-4 text-gray-400 transition-colors hover:text-white" />
                  </div>
                  <div className="cursor-pointer rounded-lg bg-gray-800 p-2 transition-colors hover:bg-gray-700">
                    <Globe className="h-4 w-4 text-gray-400 transition-colors hover:text-white" />
                  </div>
                </div>

                {/* Enhanced Stats */}
                <div className="grid grid-cols-3 gap-3 border-t border-gray-800 pt-6">
                  <div className="text-center">
                    <div className="text-lg font-black text-green-400">{totalWins}</div>
                    <div className="text-xs text-gray-400">WINS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-amber-400">{winRate}%</div>
                    <div className="text-xs text-gray-400">WIN RATE</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-blue-400">{level}</div>
                    <div className="text-xs text-gray-400">LEVEL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Records Panel */}
          <div className="lg:col-span-2">
            <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black transition-all duration-300 hover:border-gray-700">
              <div className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                    <Gamepad2 className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">GAME RECORDS</h3>
                </div>

                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {records.length === 0 && (
                    <div className="text-sm text-gray-400">No game records yet.</div>
                  )}
                  {records.map((record: any, index: number) => {
                    const wins = record?.win_loss_record?.wins ?? 0
                    const losses = record?.win_loss_record?.losses ?? 0
                    const wr = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all duration-300 hover:border-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                            <Target className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {record?.title || 'Unknown Game'}
                            </div>
                            <div className="text-xs text-gray-400">Win Rate: {wr}%</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-bold">
                              <span className="text-green-400">W:{wins}</span>
                              <span className="mx-2 text-gray-400">-</span>
                              <span className="text-red-400">L:{losses}</span>
                            </div>
                          </div>
                          {wr === 100 && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-yellow-500 to-orange-500">
                              <Star className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity - Swipeable Cards */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">RECENT ACTIVITY</h3>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => scrollActivity('left')}
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => scrollActivity('right')}
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={activityScrollRef}
            className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {mockRecentActivity.map((activity) => (
              <div
                key={activity.id}
                className="group relative w-80 flex-none overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black transition-all duration-300 hover:border-gray-700"
              >
                {/* Activity Type Status Bar */}
                <div
                  className={`h-1 transition-all duration-300 ${getActivityBarColor(activity)}`}
                />

                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activity.type === 'challenge' && (
                        <Target className="h-4 w-4 text-amber-400" />
                      )}
                      {activity.type === 'tournament' && (
                        <Trophy className="h-4 w-4 text-blue-400" />
                      )}
                      {activity.type === 'achievement' && (
                        <Star className="h-4 w-4 text-amber-400" />
                      )}
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        {activity.type === 'achievement' ? 'Achievement' : activity.type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>

                  {activity.type === 'challenge' && (
                    <>
                      <h4 className="mb-2 font-bold text-white">{activity.game}</h4>
                      <p className="mb-3 text-sm text-gray-400">{activity.mode}</p>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-gray-300">vs {activity.opponent}</span>
                        <span
                          className={`text-sm font-bold ${activity.result === 'win' ? 'text-green-400' : activity.result === 'loss' ? 'text-red-400' : 'text-gray-400'}`}
                        >
                          {(activity.result ?? 'pending').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400">{activity.amount}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          VIEW
                        </Button>
                      </div>
                    </>
                  )}

                  {activity.type === 'tournament' && (
                    <>
                      <h4 className="mb-2 font-bold text-white">{activity.name}</h4>
                      <p className="mb-3 text-sm text-gray-400">{activity.game}</p>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-gray-300">
                          {activity.participants} players
                        </span>
                        <span className="text-sm font-bold text-blue-400">
                          #{activity.position}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400">{activity.prize}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          VIEW
                        </Button>
                      </div>
                    </>
                  )}

                  {activity.type === 'achievement' && (
                    <>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="text-2xl">{activity.icon}</div>
                        <div>
                          <h4 className="mb-1 font-bold text-white">{activity.title}</h4>
                          <p className="text-sm text-gray-400">{activity.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"
                      >
                        <Star className="mr-1 h-3 w-3" />
                        VIEW ACHIEVEMENT
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black transition-all duration-300 hover:border-gray-700">
          <div className="p-6">
            <Tabs defaultValue="challenges" className="w-full">
              <TabsList className="grid w-full grid-cols-3 border border-gray-700 bg-gray-800">
                <TabsTrigger
                  value="challenges"
                  className="font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                >
                  <Target className="mr-2 h-4 w-4" />
                  CHALLENGES
                </TabsTrigger>
                <TabsTrigger
                  value="tournaments"
                  className="font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  TOURNAMENTS
                </TabsTrigger>
                <TabsTrigger
                  value="created"
                  className="font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  CREATED
                </TabsTrigger>
              </TabsList>

              <TabsContent value="challenges" className="mt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockChallenges.map((challenge) => {
                    const statusInfo = statusConfig[challenge.status as keyof typeof statusConfig]
                    return (
                      <div
                        key={challenge.id}
                        className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black transition-all duration-300 hover:border-gray-700"
                      >
                        <div className={`h-1 ${statusInfo.color} transition-all duration-300`} />
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div
                              className={`flex items-center gap-1 rounded-full px-2 py-1 ${statusInfo.bgColor} ${statusInfo.borderColor} border`}
                            >
                              <div className={`h-2 w-2 rounded-full ${statusInfo.color}`} />
                              <span className={`text-xs font-medium ${statusInfo.textColor}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">{challenge.date}</span>
                          </div>
                          <h4 className="mb-2 font-bold text-white">{challenge.game}</h4>
                          <p className="mb-3 text-sm text-gray-400">vs {challenge.opponent}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-amber-400">
                              {challenge.bet}
                            </span>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              VIEW
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="tournaments" className="mt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {mockTournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black transition-all duration-300 hover:border-gray-700"
                    >
                      <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-300" />
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-1">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                            <span className="text-xs font-medium text-purple-400">
                              #{tournament.position}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{tournament.date}</span>
                        </div>
                        <h4 className="mb-2 font-bold text-white">{tournament.name}</h4>
                        <p className="mb-3 text-sm text-gray-400">{tournament.game}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{tournament.participants} players</span>
                          <span className="font-bold text-green-400">{tournament.prize}</span>
                        </div>
                      </CardContent>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="created" className="mt-6">
                {/* Created Challenges */}
                <div className="mb-8">
                  <h3 className="mb-4 text-lg font-bold text-white">Created Challenges</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {mockCreatedChallenges.map((challenge) => {
                      const statusInfo = statusConfig[challenge.status as keyof typeof statusConfig]
                      return (
                        <div
                          key={challenge.id}
                          className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black transition-all duration-300 hover:border-gray-700"
                        >
                          <div className={`h-1 ${statusInfo.color} transition-all duration-300`} />
                          <CardContent className="p-6">
                            <div className="mb-4 flex items-start justify-between">
                              <div>
                                <h4 className="mb-1 text-lg font-bold text-white">
                                  {challenge.game}
                                </h4>
                                <p className="text-sm text-gray-400">{challenge.mode}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-amber-400">${challenge.amount}</p>
                                <p className="text-xs text-gray-500">{statusInfo.label}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600">
                                  <span className="text-sm font-bold text-white">
                                    {challenge.opponent.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">{challenge.opponent}</p>
                                  <p className="text-xs text-gray-500">Opponent</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Expires in</p>
                                <p className="text-sm text-gray-300">{challenge.expiresIn}</p>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Created Tournaments */}
                <div>
                  <h3 className="mb-4 text-lg font-bold text-white">Created Tournaments</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {mockCreatedTournaments.map((tournament) => {
                      const statusInfo =
                        statusConfig[tournament.status as keyof typeof statusConfig]
                      return (
                        <div
                          key={tournament.id}
                          className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black transition-all duration-300 hover:border-gray-700"
                        >
                          <div className={`h-1 ${statusInfo.color} transition-all duration-300`} />
                          <CardContent className="p-6">
                            <div className="mb-4 flex items-start justify-between">
                              <div>
                                <h4 className="mb-1 text-lg font-bold text-white">
                                  {tournament.name}
                                </h4>
                                <p className="text-sm text-gray-400">{tournament.game}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-amber-400">{tournament.prize}</p>
                                <p className="text-xs text-gray-500">{statusInfo.label}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Players</span>
                                <span className="text-white">{tournament.participants}/32</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-800">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                  style={{ width: `${(tournament.participants / 32) * 100}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Started</span>
                                <span className="text-white">{tournament.date}</span>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

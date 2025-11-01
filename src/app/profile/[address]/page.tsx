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

// Removed mockRecentActivity (was used for demo content)

// Removed mockChallenges

// Removed mockTournaments

// Removed mockCreatedTournaments

// Removed mockCreatedChallenges

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
                {/* <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-400">Online</span>
                </div> */}

                {/* Rank Badge */}
                {/* <div className="absolute -bottom-6 left-6">
                  <div
                    className={`rounded-full bg-gradient-to-r px-3 py-1 ${rankConfig[rankKey].color} border ${rankConfig[rankKey].borderColor} backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-white" />
                      <span className="text-xs font-bold text-white">{primaryRank}</span>
                    </div>
                  </div>
                </div> */}
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
                  {/* <div className="mb-4">
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
                  </div> */}

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
            <div className="w-80 flex-none overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6 text-center">
              <p className="text-sm text-gray-400">No recent activity yet.</p>
              <p className="text-xs text-gray-500">
                Play matches and join tournaments to see updates here.
              </p>
            </div>
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
                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
                  <p className="text-sm text-gray-400">No challenges to show.</p>
                  <p className="text-xs text-gray-500">
                    Create or accept a challenge to populate this list.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="tournaments" className="mt-6">
                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
                  <p className="text-sm text-gray-400">No tournaments to show.</p>
                  <p className="text-xs text-gray-500">
                    Join or create a tournament to populate this list.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="created" className="mt-6">
                {/* Created Challenges */}
                <div className="mb-8">
                  <h3 className="mb-4 text-lg font-bold text-white">Created Challenges</h3>
                  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
                    <p className="text-sm text-gray-400">No created challenges yet.</p>
                    <p className="text-xs text-gray-500">
                      Create a challenge to see it listed here.
                    </p>
                  </div>
                </div>

                {/* Created Tournaments */}
                <div>
                  <h3 className="mb-4 text-lg font-bold text-white">Created Tournaments</h3>
                  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
                    <p className="text-sm text-gray-400">No created tournaments yet.</p>
                    <p className="text-xs text-gray-500">
                      Create a tournament to see it listed here.
                    </p>
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

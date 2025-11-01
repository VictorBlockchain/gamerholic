'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Trophy,
  Gamepad2,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  QrCode,
  MessageSquare,
  Sword,
  Shield,
  TrendingUp,
  Copy,
  Share2,
  Heart,
  Star,
  Zap,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Sparkles,
  Flame,
  Target,
  Activity,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  Crown,
  Medal,
  Gem,
  Rocket,
  Timer,
  MapPin,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  FileText,
  Video,
  Calendar,
  DollarSign,
  Ticket,
  ChevronRight,
  User,
  Award,
  History,
  Scan,
  Code,
  Wallet,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// Removed unused Input import after ChatBox integration
import { cn } from '@/lib/utils'
import {
  readTournamentInfo,
  readParticipants,
  readActiveParticipants,
  readHost,
  readChallenge,
  joinTournament,
  cancelTournament,
} from '@/lib/contracts/tournament'
import { ZERO_ADDRESS } from '@/lib/tokens'
import { supabase } from '@/lib/supabase'
import { useGamerProfile } from '@/context/GamerProfileContext'
import ChatBox from '@/components/chat/ChatBox'
import { getNetworkConfig } from '@/lib/config/deployment'
import { createWalletClient, custom } from 'viem'
import { useToast } from '@/hooks/use-toast'

// A helper component for the connecting lines on larger screens
const BracketConnector = ({ isWinner }) => (
  <div className="absolute top-1/2 -right-4 hidden h-0.5 w-4 bg-purple-500/50 lg:block">
    <div
      className={`absolute top-1/2 right-0 h-8 w-0.5 -translate-y-1/2 ${isWinner ? 'bg-green-500' : 'bg-gray-600'}`}
    ></div>
  </div>
)

// A helper component for the vertical lines on larger screens
const VerticalConnector = () => (
  <div className="absolute top-1/2 left-1/2 hidden h-4 w-0.5 -translate-x-1/2 bg-purple-500/50 lg:block"></div>
)

interface TournamentDetails {
  id: string
  game: {
    name: string
    console: string
    icon: string
    contractAddress: string
    mode: string
    map: string
  }
  type: 'bracket' | 'free-for-all' | '1v1' | 'teams'
  entryFee: { sei: number; gamer: number }
  players: { current: number; max: number }
  nftRequired?: number
  startDate: string
  host: string
  status: 'upcoming' | 'registering' | 'in-progress' | 'completed'
  prize: number
  rules: string[]
  createdAt: string
  winner?: { username: string; avatar: string; level: number }
  streamUrl: string
  chatEnabled: boolean
  viewers: number
  estimatedDuration: string
  onchainStatus?: number
}
// Player UI model used in players list and bracket cards
interface Player {
  id: string
  username: string
  avatar: string
  address: string
  team: string
  record: { wins: number; losses: number }
  stats: { plays: number; wins: number; winRate?: number; kd?: number }
  level: number
  isVerified: boolean
  joinedAt: string
  coverUrl?: string
  status?: 'online' | 'offline'
  currentlyPlaying?: string
  rank?: { name: string; color: string; lp: number }
}

const statusConfig = {
  upcoming: {
    label: 'Upcoming',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: Clock,
    glow: 'shadow-blue-500/20',
    variant: 'mystic' as const,
  },
  registering: {
    label: 'Registering',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: Users,
    glow: 'shadow-green-500/20',
    variant: 'neon' as const,
  },
  'in-progress': {
    label: 'Live',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: Trophy,
    glow: 'shadow-red-500/20',
    variant: 'victory' as const,
  },
  completed: {
    label: 'Completed',
    color: 'bg-purple-500',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    icon: Trophy,
    glow: 'shadow-purple-500/20',
    variant: 'power' as const,
  },
}

const typeConfig = {
  bracket: {
    label: 'Bracket',
    variant: 'victory' as const,
    icon: '🏆',
    description: 'Elimination bracket',
  },
  'free-for-all': {
    label: 'Free For All',
    variant: 'power' as const,
    icon: '⚔️',
    description: 'Everyone vs Everyone',
  },
  '1v1': {
    label: '1 v 1',
    variant: 'mystic' as const,
    icon: '👥',
    description: 'Head to Head',
  },
  teams: {
    label: 'Teams',
    variant: 'cosmic' as const,
    icon: '👨‍👩‍👧‍👦',
    description: 'Team Battle',
  },
}

export default function TournamentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { address: viewerAddress, isConnected } = useGamerProfile()
  const [activeRoundIndex, setActiveRoundIndex] = useState(0) // Added for mobile navigation
  const [tournament, setTournament] = useState<TournamentDetails>({
    id: '',
    game: {
      name: '',
      console: '',
      icon: '',
      contractAddress: '',
      mode: '',
      map: '',
    },
    type: 'bracket',
    entryFee: { sei: 0, gamer: 0 },
    players: { current: 0, max: 0 },
    nftRequired: undefined,
    startDate: '',
    host: ZERO_ADDRESS,
    status: 'upcoming',
    prize: 0,
    rules: [],
    createdAt: '',
    winner: undefined,
    streamUrl: '',
    chatEnabled: true,
    viewers: 0,
    estimatedDuration: '',
    onchainStatus: 0,
  })
  const [players, setPlayers] = useState<Player[]>([])
  const [bracket, setBracket] = useState<any[]>([])
  const [showQrCode, setShowQrCode] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [gamerMap, setGamerMap] = useState<
    Record<string, { username?: string; avatar_url?: string; cover_url?: string; games?: any[] }>
  >({})
  const [refreshingPrize, setRefreshingPrize] = useState(false)
  const [joining, setJoining] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const { toast } = useToast()

  // Deterministic UTC date/time formatters to avoid SSR/CSR hydration mismatches
  const formatDateUTC = (iso?: string) => {
    if (!iso) return ''
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).format(new Date(iso))
    } catch {
      return ''
    }
  }

  const formatTimeUTC = (iso?: string) => {
    if (!iso) return ''
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    } catch {
      return ''
    }
  }

  const formatDateTimeUTC = (iso?: string) => {
    if (!iso) return ''
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    } catch {
      return ''
    }
  }

  // Build a Player view model from a wallet address, using provided gamer map if available
  const toPlayer = (
    addr: `0x${string}`,
    mapOverride?: Record<
      string,
      { username?: string; avatar_url?: string; cover_url?: string; games?: any[] }
    >,
  ): Player => {
    const lower = String(addr).toLowerCase()
    const gm = mapOverride || gamerMap
    const gp = gm[lower]
    const short = `${addr.slice(0, 6)}...${addr.slice(-4)}`
    // Derive record from gamer games array using tournament game name if available
    let wins = 0
    let losses = 0
    const gameTitleKey = String(tournament?.game?.name || '').toLowerCase()
    const gamesArr = Array.isArray(gp?.games) ? gp?.games : []
    const matched = gamesArr.find((g: any) => {
      const title = String(g?.title || '').toLowerCase()
      return title && gameTitleKey && title === gameTitleKey
    })
    if (matched?.win_loss_record) {
      const wl = matched.win_loss_record
      wins = Number(wl?.wins || 0)
      losses = Number(wl?.losses || 0)
    }
    const total = wins + losses
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
    const kd = 0
    const level = typeof matched?.mmr === 'number' ? Number(matched.mmr) : 0
    let rank = { name: 'Unranked', color: 'text-gray-400', lp: 0 }
    if (level >= 2000) rank = { name: 'Diamond', color: 'text-blue-400', lp: level }
    else if (level >= 1500) rank = { name: 'Platinum', color: 'text-cyan-400', lp: level }
    else if (level >= 1000) rank = { name: 'Gold', color: 'text-yellow-400', lp: level }
    else if (level >= 500) rank = { name: 'Silver', color: 'text-gray-300', lp: level }
    else if (level > 0) rank = { name: 'Bronze', color: 'text-amber-400', lp: level }
    const verified = Boolean(gp?.username)
    return {
      id: addr,
      username: gp?.username || short,
      avatar: gp?.avatar_url || '/logo.png',
      address: addr,
      team: '-',
      record: { wins, losses },
      stats: { plays: total, wins, winRate, kd },
      level,
      isVerified: verified,
      joinedAt: new Date().toISOString(),
      coverUrl: gp?.cover_url || '/octapus.GIF',
      status: verified ? 'online' : 'offline',
      currentlyPlaying: matched?.title || undefined,
      rank,
    }
  }

  const makeBracketFromActive = async (
    actives: `0x${string}`[],
    tournamentAddress: `0x${string}`,
    mapOverride?: Record<
      string,
      { username?: string; avatar_url?: string; cover_url?: string; games?: any[] }
    >,
  ) => {
    const matches = [] as any[]
    for (let i = 0; i < actives.length; i += 2) {
      const p1 = toPlayer(actives[i], mapOverride)
      const p2 = i + 1 < actives.length ? toPlayer(actives[i + 1], mapOverride) : null

      // Fetch challenge address for this match if both players exist
      let challengeAddress: `0x${string}` | null = null
      if (p2) {
        try {
          challengeAddress = await readChallenge(tournamentAddress, actives[i], actives[i + 1])
        } catch (e) {
          console.warn(
            'Failed to fetch challenge address for players:',
            actives[i],
            actives[i + 1],
            e,
          )
        }
      }

      matches.push({
        id: `r1m${i / 2 + 1}`,
        player1: p1,
        player2: p2,
        winner: null,
        score: null,
        status: p2 ? 'upcoming' : 'waiting',
        challengeAddress,
      })
    }
    return [
      {
        round: 1,
        matches,
      },
    ]
  }

  useEffect(() => {
    const addrParam = String((params as any)?.address || '').toLowerCase()
    const isHexAddr = addrParam.startsWith('0x') && addrParam.length === 42
    if (!isHexAddr) return
    const tournamentAddress = addrParam as `0x${string}`
    ;(async () => {
      try {
        const [info, host, participants, actives] = await Promise.all([
          readTournamentInfo(tournamentAddress),
          readHost(tournamentAddress),
          readParticipants(tournamentAddress),
          readActiveParticipants(tournamentAddress),
        ])

        // Enrich participants/actives with gamer profiles
        const allWallets = Array.from(
          new Set([
            ...participants.map((p) => String(p).toLowerCase()),
            ...actives.map((p) => String(p).toLowerCase()),
          ]),
        )
        let localMap: Record<
          string,
          { username?: string; avatar_url?: string; cover_url?: string; games?: any[] }
        > = {}
        if (allWallets.length) {
          try {
            const { data: gamers } = await supabase
              .from('gamers')
              .select('wallet, username, avatar_url, cover_url, games')
              .in('wallet', allWallets)
            for (const g of gamers || []) {
              const w = String(g.wallet || '').toLowerCase()
              localMap[w] = {
                username: g.username,
                avatar_url: g.avatar_url || '/logo.png',
                cover_url: g.cover_url || '/octapus.GIF',
                games: Array.isArray(g.games) ? g.games : [],
              }
            }
            setGamerMap(localMap)
          } catch (e) {
            console.warn('Failed to load gamer profiles:', e)
          }
        }

        // Update players list from participants using freshly loaded gamer map
        const participantPlayers = participants.map((p) => toPlayer(p, localMap))
        setPlayers(participantPlayers)

        // Build bracket from active participants using the same map
        setBracket(await makeBracketFromActive(actives, tournamentAddress, localMap))

        // Map on-chain info to UI tournament details
        const entryFeeSei = Number(info.entryFee) / 1e18
        const prizeSei = Number(info.totalPrizePool) / 1e18
        const createdIso = new Date(Number(info.createdAt) * 1000).toISOString()
        const max = Number(info.maxParticipants)
        let startDateStr = ''
        let metaTitle = ''
        let metaConsole = ''
        let metaMap = ''
        try {
          const md = info.metadata ? JSON.parse(info.metadata) : {}
          if (md?.startDate) {
            startDateStr = String(md.startDate) + (md?.startTime ? ` ${String(md.startTime)}` : '')
          }
          metaTitle = String(md?.title || md?.game || '').trim()
          metaConsole = String(md?.console || '').trim()
          metaMap = String(md?.map || '').trim()
        } catch (e) {
          console.warn('Failed to parse tournament metadata', e)
        }
        setTournament((prev) => ({
          ...prev,
          id: tournamentAddress,
          host,
          prize: prizeSei,
          type: info.isFFA ? 'free-for-all' : 'bracket',
          players: { current: participantPlayers.length, max },
          entryFee: {
            sei: info.payToken.toLowerCase() === ZERO_ADDRESS.toLowerCase() ? entryFeeSei : 0,
            gamer: info.payToken.toLowerCase() !== ZERO_ADDRESS.toLowerCase() ? entryFeeSei : 0,
          },
          nftRequired: Number(info.xftToJoin ?? 0),
          game: {
            ...prev.game,
            name: metaTitle || prev.game.name || info.gameType,
            console: metaConsole || prev.game.console,
            map: metaMap || prev.game.map,
            mode: info.gameType || prev.game.mode,
            contractAddress: tournamentAddress,
          },
          createdAt: createdIso,
          startDate: startDateStr || prev.startDate,
          onchainStatus: Number(info.status),
          // Keep existing rules/fields for now; metadata can be parsed later
        }))
      } catch (err) {
        console.error('Failed to load tournament details:', err)
      }
    })()
  }, [params])

  const refreshPrizePool = async () => {
    try {
      setRefreshingPrize(true)
      const addr = String(tournament.id || '').toLowerCase() as `0x${string}`
      if (!addr || !addr.startsWith('0x') || addr.length !== 42) return
      const info = await readTournamentInfo(addr)
      const prizeSei = Number(info.totalPrizePool) / 1e18
      setTournament((prev) => ({ ...prev, prize: prizeSei }))
    } catch (e) {
      console.warn('Failed to refresh prize pool:', e)
    } finally {
      setRefreshingPrize(false)
    }
  }

  const refreshParticipants = async () => {
    try {
      const addrParam = String((params as any)?.address || '').toLowerCase()
      const isHexAddr = addrParam.startsWith('0x') && addrParam.length === 42
      if (!isHexAddr) return
      const tournamentAddress = addrParam as `0x${string}`

      const [participants, actives] = await Promise.all([
        readParticipants(tournamentAddress),
        readActiveParticipants(tournamentAddress),
      ])

      const allWallets = Array.from(
        new Set([
          ...participants.map((p) => String(p).toLowerCase()),
          ...actives.map((p) => String(p).toLowerCase()),
        ]),
      )
      let localMap: Record<
        string,
        { username?: string; avatar_url?: string; cover_url?: string; games?: any[] }
      > = {}
      if (allWallets.length) {
        try {
          const { data: gamers } = await supabase
            .from('gamers')
            .select('wallet, username, avatar_url, cover_url, games')
            .in('wallet', allWallets)
          for (const g of gamers || []) {
            const w = String(g.wallet || '').toLowerCase()
            localMap[w] = {
              username: g.username,
              avatar_url: g.avatar_url || '/logo.png',
              cover_url: g.cover_url || '/octapus.GIF',
              games: Array.isArray(g.games) ? g.games : [],
            }
          }
          setGamerMap(localMap)
        } catch (e) {
          console.warn('Failed to load gamer profiles:', e)
        }
      }

      const participantPlayers = participants.map((p) => toPlayer(p, localMap))
      setPlayers(participantPlayers)
      setBracket(await makeBracketFromActive(actives, params.address as `0x${string}`, localMap))
      setTournament((prev) => ({
        ...prev,
        players: { current: participantPlayers.length, max: prev.players.max },
      }))
    } catch (e) {
      console.warn('Failed to refresh participants:', e)
    }
  }

  const statusInfo = statusConfig[tournament.status]
  const typeInfo = typeConfig[tournament.type]
  const OnChainStatus = { ACTIVE: 0, STARTED: 1, COMPLETED: 2, DISPUTED: 3, CANCELLED: 4 } as const

  const handleCancelTournament = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for canceling the tournament.',
        variant: 'destructive',
      })
      return
    }

    try {
      setCancelling(true)
      const net = getNetworkConfig()
      const chain = {
        id: net.chainId,
        name: net.name,
        nativeCurrency: net.nativeCurrency,
        rpcUrls: {
          default: { http: [net.rpcUrl] },
          public: { http: [net.rpcUrl] },
        },
        blockExplorers: { default: { name: 'Explorer', url: net.blockExplorer } },
      } as const
      const walletClient = createWalletClient({
        transport: custom(window.ethereum!),
        chain,
      })
      const accounts = await walletClient.getAddresses()
      const acct = accounts[0]
      if (!acct) throw new Error('Wallet not connected')

      await cancelTournament(
        acct as `0x${string}`,
        tournament.id as `0x${string}`,
        cancelReason,
        walletClient,
      )

      toast({
        title: 'Tournament cancelled',
        description: 'The tournament has been successfully cancelled.',
      })

      // Refresh tournament data to reflect the cancelled status
      window.location.reload()
    } catch (e: any) {
      console.warn('Cancel failed:', e)
      toast({
        title: 'Cancel failed',
        description: e?.message || 'Could not cancel the tournament.',
        variant: 'destructive',
      })
    } finally {
      setCancelling(false)
    }
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(tournament.host)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const playerPercentage = (tournament.players.current / tournament.players.max) * 100

  return (
    <div className="min-h-screen bg-black pt-24 pb-8 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-800 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{tournament.game.name}</h1>
                  <p className="text-sm text-gray-400">{tournament.game.console}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Tournament Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black">
              {/* Animated Status Bar */}
              <div
                className={`h-1 ${statusInfo.color} animate-pulse transition-all duration-300 group-hover:h-1.5`}
              />

              <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <p className="text-2xl font-bold text-white">
                          {tournament.game.name} Tournament
                        </p>
                        <div
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${typeInfo.variant === 'victory' ? 'border-green-500/30 bg-green-500/10' : 'border-purple-500/30 bg-purple-500/10'}`}
                        >
                          <span className="text-xs">{typeInfo.icon}</span>
                          <span className="text-xs font-medium text-white">{typeInfo.label}</span>
                        </div>
                      </div>
                      <p className="text-gray-400">{typeInfo.description}</p>
                    </div>
                  </div>
                </div>

                {/* Tournament Info Grid */}
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-gray-800/50 p-4 text-center">
                    <Users className="mx-auto mb-2 h-6 w-6 text-amber-400" />
                    <p className="text-lg font-bold text-white">
                      {tournament.players.current}/{tournament.players.max}
                    </p>
                    <p className="text-xs text-gray-400">Players</p>
                  </div>
                  <div className="relative rounded-xl bg-gray-800/50 p-4 text-center">
                    <DollarSign className="mx-auto mb-2 h-6 w-6 text-green-400" />
                    <p className="text-lg font-bold text-white">{tournament.prize}</p>
                    <p className="text-xs text-gray-400">Prize Pool</p>
                    <button
                      aria-label="Refresh prize pool"
                      onClick={refreshPrizePool}
                      className="absolute top-2 right-2 rounded-full border border-green-500/30 bg-black/40 p-1 hover:bg-black/60"
                    >
                      <History
                        className={cn(
                          'h-4 w-4',
                          refreshingPrize ? 'animate-spin text-green-300' : 'text-green-300',
                        )}
                      />
                    </button>
                  </div>
                  <div className="rounded-xl bg-gray-800/50 p-4 text-center">
                    <Calendar className="mx-auto mb-2 h-6 w-6 text-blue-400" />
                    <p className="text-lg font-bold text-white">
                      {formatDateTimeUTC(tournament.startDate || tournament.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-800/50 p-4 text-center">
                    <Ticket className="mx-auto mb-2 h-6 w-6 text-purple-400" />
                    <p className="text-lg font-bold text-white">#{tournament.nftRequired}</p>
                    <p className="text-xs text-gray-400">NFT Required</p>
                  </div>
                </div>

                {/* Entry Fee */}
                <div className="mb-6 rounded-xl bg-gray-800/30 p-4">
                  <p className="mb-3 text-sm text-gray-400">Entry Fee</p>
                  <div className="flex gap-3">
                    <div className="flex-1 rounded-lg bg-gray-800/50 p-3 text-center">
                      <p className="mb-1 text-xs text-gray-400">SEI</p>
                      <p className="text-lg font-bold text-amber-400">{tournament.entryFee.sei}</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-gray-800/50 p-3 text-center">
                      <p className="mb-1 text-xs text-gray-400">GAMER</p>
                      <p className="text-lg font-bold text-purple-400">
                        {tournament.entryFee.gamer}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Players Progress */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Registration Progress</span>
                    <span className="text-sm text-amber-400">{Math.round(playerPercentage)}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
                      style={{ width: `${playerPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                {tournament.status === 'registering' &&
                tournament.players.current < tournament.players.max ? (
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:from-amber-600 hover:to-orange-700 hover:shadow-amber-500/40"
                    disabled={joining}
                    onClick={async () => {
                      setJoining(true)
                      try {
                        const net = getNetworkConfig()
                        const chain = {
                          id: net.chainId,
                          name: net.name,
                          nativeCurrency: net.nativeCurrency,
                          rpcUrls: {
                            default: { http: [net.rpcUrl] },
                            public: { http: [net.rpcUrl] },
                          },
                          blockExplorers: { default: { name: 'Explorer', url: net.blockExplorer } },
                        } as const
                        const walletClient = createWalletClient({
                          transport: custom(window.ethereum!),
                          chain,
                        })
                        const accounts = await walletClient.getAddresses()
                        const acct = accounts[0]
                        if (!acct) throw new Error('Wallet not connected')

                        await joinTournament(
                          acct as `0x${string}`,
                          tournament.id as `0x${string}`,
                          walletClient,
                        )

                        toast({
                          title: 'Joined tournament',
                          description: 'You are now registered as a participant.',
                        })

                        await refreshParticipants()
                        await refreshPrizePool()
                      } catch (e: any) {
                        console.warn('Join failed:', e)
                        toast({
                          title: 'Join failed',
                          description: e?.message || 'Could not join the tournament.',
                          variant: 'destructive',
                        })
                      } finally {
                        setJoining(false)
                      }
                    }}
                  >
                    {joining ? 'Joining…' : 'Join Tournament'}
                  </Button>
                ) : (
                  tournament.onchainStatus === OnChainStatus.STARTED ? (
                    <div className="w-full rounded-xl border border-gray-700 bg-gray-800/50 p-3 text-center text-sm text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Tournament is full</span>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Winners Section - Only show if completed */}
            {tournament.status === 'completed' && tournament.winner && (
              <Card className="border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Crown className="h-6 w-6 text-yellow-400" />
                    Tournament Winners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* 1st Place */}
                    <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-600/10 p-4 text-center">
                      <div className="mb-2 text-4xl">🥇</div>
                      <div className="relative mb-3 inline-block">
                        <Avatar className="h-16 w-16 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20">
                          <AvatarImage src={tournament.winner.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-amber-600 font-bold text-white">
                            {tournament.winner.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-xs font-bold text-white shadow-lg">
                          {tournament.winner.level}
                        </div>
                      </div>
                      <h3 className="mb-1 font-bold text-white">{tournament.winner.username}</h3>
                      <p className="text-sm font-medium text-yellow-400">1st Place</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Prize: {Math.round(tournament.prize * 0.6)} SEI
                      </p>
                    </div>

                    {/* 2nd Place */}
                    <div className="rounded-xl border border-gray-500/30 bg-gradient-to-br from-gray-500/10 to-gray-600/10 p-4 text-center">
                      <div className="mb-2 text-4xl">🥈</div>
                      <div className="relative mb-3 inline-block">
                        <Avatar className="h-16 w-16 border-2 border-gray-500/50 shadow-lg shadow-gray-500/20">
                          <AvatarImage src={players[1]?.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 font-bold text-white">
                            {players[1]?.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-gray-500 to-gray-600 text-xs font-bold text-white shadow-lg">
                          {players[1]?.level}
                        </div>
                      </div>
                      <h3 className="mb-1 font-bold text-white">{players[1]?.username}</h3>
                      <p className="text-sm font-medium text-gray-400">2nd Place</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Prize: {Math.round(tournament.prize * 0.3)} SEI
                      </p>
                    </div>

                    {/* 3rd Place */}
                    <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-600/10 p-4 text-center">
                      <div className="mb-2 text-4xl">🥉</div>
                      <div className="relative mb-3 inline-block">
                        <Avatar className="h-16 w-16 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20">
                          <AvatarImage src={players[2]?.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 font-bold text-white">
                            {players[2]?.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-xs font-bold text-white shadow-lg">
                          {players[2]?.level}
                        </div>
                      </div>
                      <h3 className="mb-1 font-bold text-white">{players[2]?.username}</h3>
                      <p className="text-sm font-medium text-orange-400">3rd Place</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Prize: {Math.round(tournament.prize * 0.1)} SEI
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="players" className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-xl border border-gray-700 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-1 shadow-lg">
                <TabsTrigger
                  value="players"
                  className="rounded-lg text-gray-400 transition-all duration-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/25"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Players
                </TabsTrigger>
                <TabsTrigger
                  value="bracket"
                  className="rounded-lg text-gray-400 transition-all duration-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Bracket
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="rounded-lg text-gray-400 transition-all duration-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="host"
                  className="rounded-lg text-gray-400 transition-all duration-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/25"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Host
                </TabsTrigger>
              </TabsList>
              {/* Players Tab */}
              <TabsContent value="players" className="mt-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="group relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-green-800 via-pink-800 to-blue-900 transition-transform duration-300 hover:scale-105"
                    >
                      {/* Full-Size Background Image Layer */}
                      <div className="absolute inset-0">
                        <div
                          className="h-full w-full opacity-60"
                          style={{
                            backgroundImage: `url(${player.coverUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        {/* Vignette Overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-950 via-purple-950/50 to-purple-950/80" />
                      </div>

                      {/* Content Layer */}
                      <div className="relative z-10 flex flex-1 flex-col p-6 text-white">
                        {/* Avatar & Username Section */}
                        <div className="flex flex-col items-center pb-4">
                          <div className="relative">
                            <Link href={`/profile/${player.address.toLowerCase()}`}>
                              <Avatar className="relative h-32 w-32 rounded-full border-1 bg-gradient-to-br from-cyan-400 to-blue-500 p-1">
                                <AvatarImage src={player.avatar} className="rounded-full" />
                                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-4xl font-bold text-white">
                                  {player.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            {/* Online Status Indicator */}
                            {/* <div
                              className={`absolute right-1 bottom-1 h-7 w-7 rounded-full border-4 border-purple-950 ${player.status === 'online' ? 'bg-green-400' : 'bg-gray-500'}`}
                            /> */}
                            {/* Level Badge */}
                          </div>

                          <div className="mt-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link href={`/profile/${player.address.toLowerCase()}`}>
                                <h3 className="text-3xl font-black text-cyan-300 drop-shadow-lg">
                                  {player.username}
                                </h3>
                              </Link>
                            </div>
                            <p className="mt-1 font-mono text-xs text-pink-200 drop-shadow-md">
                              {player.address.slice(0, 6)}...{player.address.slice(-4)}
                            </p>
                          </div>
                        </div>

                        {/* Rank & Stats Section */}
                        <div className="mt-auto space-y-3">
                          {/* Rank Display */}
                          {/* <div className="flex items-center justify-between rounded-2xl border-2 border-yellow-400/50 bg-yellow-400/20 p-3 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-6 w-6 text-yellow-300" />
                              <span className="font-bold text-yellow-300">{player.rank.name}</span>
                            </div>
                            <span className="font-black text-white">{player.rank.lp} LP</span>
                          </div> */}

                          {/* Key Stats Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-green-400/50 bg-green-400/20 p-3 backdrop-blur-sm">
                              <Target className="h-5 w-5 text-green-300" />
                              <span className="text-2xl font-black text-green-300">
                                {player.stats.winRate}
                              </span>
                              <span className="text-xs text-green-100">WINS</span>
                            </div>
                            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-red-400/50 bg-red-400/20 p-3 backdrop-blur-sm">
                              <Zap className="h-5 w-5 text-red-300" />
                              <span className="text-2xl font-black text-red-300">
                                {player.stats.kd}
                              </span>
                              <span className="text-xs text-red-100">LOSS</span>
                            </div>
                          </div>

                          {/* Roles & Team */}
                          {/* <div className="flex items-center justify-between rounded-2xl border-2 border-purple-400/50 bg-purple-400/20 p-3 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-purple-200">ROLES</span>
                              <div className="flex gap-1">
                                <div className="rounded bg-blue-600 p-1" title="Tank">
                                  <Shield className="h-4 w-4 text-white" />
                                </div>
                                <div className="rounded bg-red-600 p-1" title="DPS">
                                  <Sword className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            </div>
                            {player.team && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-purple-200" />
                                <span className="text-sm font-bold text-purple-200">
                                  {player.team}
                                </span>
                              </div>
                            )}
                          </div> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              {/* Bracket Tab - Enhanced Battle Card Design */}
              <TabsContent value="bracket" className="mt-6">
                <div className="w-full max-w-full">
                  {/* Tournament Title - More Punchy */}
                  <div className="mb-6 text-center">
                    <h1 className="mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-3xl font-black text-transparent sm:text-4xl md:text-5xl">
                      BRACKET
                    </h1>
                    <div className="mx-auto h-1 w-32 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  </div>

                  {/* Mobile-First Horizontal Round Scroll */}
                  <div className="relative">
                    {/* Round Navigation Dots - Mobile Only */}
                    <div className="mb-4 flex justify-center gap-2 lg:hidden">
                      {bracket.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveRoundIndex(index)}
                          className={`h-2 w-2 rounded-full transition-all ${activeRoundIndex === index ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-600'}`}
                        />
                      ))}
                    </div>

                    <div className="scrollbar-hide flex snap-x snap-mandatory gap-8 overflow-x-auto pb-4 lg:flex-row lg:justify-center lg:gap-12 lg:overflow-x-visible">
                      {bracket.map((round, roundIndex) => (
                        <div
                          key={round.round}
                          className="w-full flex-shrink-0 snap-center lg:w-auto lg:flex-shrink"
                        >
                          {/* Round Header - Sticky on Mobile */}
                          <div className="sticky top-0 z-10 mb-6 bg-slate-950/90 py-2 text-center backdrop-blur-sm lg:static lg:mb-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2">
                              <Trophy className="h-5 w-5 text-purple-400" />
                              <h3 className="text-lg font-bold text-white">Round {round.round}</h3>
                            </div>
                          </div>

                          {/* Matches Container - Vertical Stack */}
                          <div className="space-y-6 lg:flex lg:flex-col lg:gap-8">
                            {round.matches.map((match, matchIndex) => (
                              <div
                                key={match.id}
                                className="animate-fade-in-up relative flex justify-center lg:block"
                                style={{ animationDelay: `${matchIndex * 100}ms` }}
                              >
                                {/* Match Card - The "Battle Arena" - REFINED */}
                                <div
                                  className={`group relative w-full max-w-sm overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl lg:w-80 ${
                                    match.status === 'live'
                                      ? 'border-red-500/50 bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-900 shadow-lg shadow-red-500/20'
                                      : match.status === 'upcoming'
                                        ? 'border-yellow-500/50 bg-gradient-to-br from-slate-900 via-yellow-950/20 to-slate-900'
                                        : 'border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900'
                                  }`}
                                >
                                  {/* Top Player Section */}
                                  <div
                                    className={`relative p-6 transition-all duration-500 ${
                                      match.winner?.id === match.player1?.id
                                        ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30'
                                        : 'bg-slate-900/50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <Link
                                          href={`/profile/${match.player1.address.toLowerCase()}`}
                                        >
                                          <Avatar
                                            className={`relative h-16 w-16 rounded-2xl border-2 bg-gradient-to-br from-cyan-400 to-blue-500 p-0.5 transition-transform duration-300 group-hover:scale-110 ${
                                              match.winner?.id === match.player1?.id
                                                ? 'border-green-400 shadow-lg shadow-green-500/50'
                                                : 'border-slate-700'
                                            }`}
                                          >
                                            <AvatarImage
                                              src={match.player1.avatar}
                                              className="rounded-xl object-cover"
                                            />
                                            <AvatarFallback className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-xl font-bold text-white">
                                              {match.player1.username.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                        </Link>
                                        <div>
                                          <p className="font-bold text-white">
                                            {match.player1.username}
                                          </p>
                                          <p className="text-xs text-gray-400">Player 1</p>
                                        </div>
                                      </div>

                                      {/* === ENHANCED SCORE DISPLAY === */}
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                          Score
                                        </span>
                                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-600 bg-slate-800 shadow-inner">
                                          <span className="text-lg font-bold text-white">
                                            {match.status === 'completed'
                                              ? match.score?.player1 || 0
                                              : 0}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* VS Divider with Status - IMPROVED */}
                                  <div className="relative flex items-center justify-center bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 py-4">
                                    <div className="absolute inset-0 flex items-center">
                                      <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                                    </div>
                                    <div className="relative z-10 flex items-center gap-2 rounded-full border border-purple-500/30 bg-slate-900 px-4 py-1.5">
                                      {match.status === 'live' && (
                                        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                                      )}
                                      <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-sm font-black text-transparent">
                                        VS
                                      </span>
                                      {match.status === 'live' && (
                                        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                                      )}
                                    </div>
                                    {/* Centralized Status Badge */}
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                                      {match.status === 'live' && (
                                        <Badge className="animate-pulse bg-red-500 text-xs text-white">
                                          LIVE
                                        </Badge>
                                      )}
                                      {match.status === 'upcoming' && (
                                        <Badge className="bg-yellow-500/80 text-xs text-white">
                                          UPCOMING
                                        </Badge>
                                      )}
                                      {match.status === 'completed' && (
                                        <Badge variant="secondary" className="text-xs">
                                          COMPLETED
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Bottom Player Section */}
                                  <div
                                    className={`relative p-6 transition-all duration-500 ${
                                      match.winner?.id === match.player2?.id
                                        ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30'
                                        : 'bg-slate-900/50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        {match.player2 ? (
                                          <>
                                            <Link
                                              href={`/profile/${match.player2.address.toLowerCase()}`}
                                            >
                                              <Avatar
                                                className={`relative h-16 w-16 rounded-2xl border-2 bg-gradient-to-br from-pink-400 to-purple-500 p-0.5 transition-transform duration-300 group-hover:scale-110 ${
                                                  match.winner?.id === match.player2?.id
                                                    ? 'border-green-400 shadow-lg shadow-green-500/50'
                                                    : 'border-slate-700'
                                                }`}
                                              >
                                                <AvatarImage
                                                  src={match.player2.avatar}
                                                  className="rounded-xl object-cover"
                                                />
                                                <AvatarFallback className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-xl font-bold text-white">
                                                  {match.player2.username.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                            </Link>
                                            <div>
                                              <p className="font-bold text-white">
                                                {match.player2.username}
                                              </p>
                                              <p className="text-xs text-gray-400">Player 2</p>
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/50">
                                              <Users className="h-8 w-8 text-slate-500" />
                                            </div>
                                            <div>
                                              <p className="font-bold text-gray-400">
                                                Awaiting Opponent
                                              </p>
                                              <p className="text-xs text-gray-500">TBD</p>
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      {/* === ENHANCED SCORE DISPLAY === */}
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                          Score
                                        </span>
                                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-600 bg-slate-800 shadow-inner">
                                          <span className="text-lg font-bold text-white">
                                            {match.status === 'completed'
                                              ? match.score?.player2 || 0
                                              : 0}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Minimal Footer - Only for Completed Matches */}
                                  {match.status === 'completed' && match.challengeAddress && (
                                    <div className="border-t border-gray-700/50 bg-slate-900/50 p-3 text-center">
                                      <a
                                        href={`https://etherscan.io/address/${match.challengeAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-center gap-1 font-mono text-xs text-cyan-300 transition-colors hover:text-cyan-200"
                                      >
                                        <Code className="h-3 w-3" />
                                        <span>View Challenge</span>
                                        <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                                {/* Desktop Bracket Connectors - These would need more complex logic for a real tree */}
                                {roundIndex < bracket.length - 1 && (
                                  <BracketConnector isWinner={!!match.winner} />
                                )}
                                {matchIndex < round.matches.length - 1 && <VerticalConnector />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              {/* Add this to your global CSS file for the animation */}
              <style jsx>{`
                @keyframes fade-in-up {
                  from {
                    opacity: 0;
                    transform: translateY(20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                .animate-fade-in-up {
                  animation: fade-in-up 0.5s ease-out forwards;
                }
              `}</style>
              {/* Chat Tab */}
              <TabsContent value="chat" className="mt-6">
                <Card className="border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black shadow-xl">
                  <CardContent className="p-0">
                    <div className="flex h-96 flex-col">
                      {/* Chat Header */}
                      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
                            <MessageSquare className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">Tournament Chat</h3>
                            <p className="text-xs text-gray-400">{players.length} participants</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 bg-gradient-to-b from-gray-900/30 to-black/30 p-4">
                        <ChatBox
                          address={params.address as string}
                          filterColumn="tournament_address"
                          isConnected={isConnected}
                          viewerAddress={viewerAddress}
                          heightClass="h-[21rem]"
                          className="space-y-4"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/* Host Tab */}
              <TabsContent value="host" className="mt-6">
                {/* Check if current user is the host */}
                {viewerAddress?.toLowerCase() === tournament.host?.toLowerCase() ? (
                  <div className="space-y-6">
                    {/* Host Header - Redesigned */}
                    <div className="text-center">
                      <h1 className="mb-2 bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
                        HOST COMMAND CENTER
                      </h1>
                      <div className="mx-auto h-1 w-32 rounded-full bg-gradient-to-r from-red-500 to-pink-500"></div>
                      <p className="mt-2 text-sm text-gray-400">
                        Manage your tournament with powerful tools
                      </p>
                    </div>

                    {/* Action Cards Grid */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Report a Score Card */}
                      <Card className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-900/20 via-blue-800/10 to-slate-900 shadow-lg shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/20">
                        <CardContent className="p-6">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
                              <FileText className="h-6 w-6 text-white" />
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-500 transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
                          <h3 className="mb-2 text-xl font-bold text-white">Report a Score</h3>
                          <p className="mb-4 text-sm text-gray-400">
                            Navigate to the challenge page to report the outcome of a 1v1 or bracket
                            match.
                          </p>
                          <Link href="/challenges">
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-cyan-700"
                            >
                              Open Challenges
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>

                      {/* Report FFA Score Card */}
                      <Card className="group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-slate-900 shadow-lg shadow-purple-500/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20">
                        <CardContent className="p-6">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                              <Sword className="h-6 w-6 text-white" />
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-500 transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
                          <h3 className="mb-2 text-xl font-bold text-white">Report FFA Score</h3>
                          <p className="mb-4 text-sm text-gray-400">
                            Submit the final rankings for a Free-For-All match.
                          </p>
                          <Link href="/challenge/create">
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-purple-600 hover:to-pink-700"
                            >
                              Report FFA Score
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Cancel Tournament Section - Redesigned with Confirmation */}
                    <Card className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/20 via-red-800/10 to-slate-900 shadow-lg shadow-red-500/10">
                      {/* Alert Strip */}
                      <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                      <CardContent className="p-6">
                        <div className="mb-6 flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/25">
                            <AlertTriangle className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Cancel Tournament</h3>
                            <p className="text-sm text-gray-400">
                              This action is permanent and will refund all participants.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">
                              Reason for cancellation *
                            </label>
                            <textarea
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="Please provide a clear reason for canceling the tournament..."
                              className="w-full rounded-xl border border-gray-700 bg-gray-800/50 p-3 text-white placeholder-gray-500 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                              rows={3}
                              disabled={cancelling}
                            />
                          </div>

                          {/* Confirmation Checkbox */}
                          <div className="flex items-start space-x-3 rounded-lg border border-gray-700 bg-gray-800/30 p-4">
                            <Checkbox
                              id="confirm-cancel"
                              checked={isConfirmed}
                              onCheckedChange={(checked) => setIsConfirmed(Boolean(checked))}
                              disabled={cancelling}
                              className="mt-1 border-gray-600 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor="confirm-cancel"
                                className="cursor-pointer text-sm font-medium text-gray-300"
                              >
                                I understand that this action cannot be undone.
                              </label>
                              <p className="text-xs text-gray-500">
                                All entry fees will be automatically refunded to the participants'
                                wallets.
                              </p>
                            </div>
                          </div>

                          <Button
                            onClick={handleCancelTournament}
                            disabled={
                              cancelling ||
                              !cancelReason.trim() ||
                              !isConfirmed ||
                              tournament.status === 'completed'
                            }
                            className="w-full bg-gradient-to-r from-red-600 to-red-700 font-bold text-white shadow-lg transition-all duration-300 hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {cancelling ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling Tournament...
                              </>
                            ) : (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Tournament
                              </>
                            )}
                          </Button>

                          {tournament.status === 'completed' && (
                            <p className="rounded-lg bg-gray-800/50 p-3 text-center text-xs text-gray-500">
                              <Shield className="mr-1 inline-block h-4 w-4" />
                              This tournament is already completed and cannot be cancelled.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  /* Host Only State - Redesigned */
                  <Card className="border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black shadow-xl">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="relative mb-6">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gray-700 bg-gray-800/50">
                          <Shield className="h-10 w-10 text-gray-500" />
                        </div>
                        <div className="absolute -right-2 -bottom-2 rounded-full bg-red-500 p-1">
                          <X className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <h3 className="mb-2 text-2xl font-bold text-white">Host Only Area</h3>
                      <p className="mb-4 max-w-sm text-sm text-gray-400">
                        The powerful tools in this section are restricted to the tournament host to
                        ensure fair play and proper management.
                      </p>
                      <p className="font-mono text-xs text-gray-500">
                        Host: {tournament.host.slice(0, 6)}...{tournament.host.slice(-4)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>{' '}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tournament Details Panel */}
            <Card className="relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 shadow-xl">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent" />

              <CardHeader className="relative border-b border-purple-500/20 pb-4">
                <CardTitle className="flex items-center gap-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-xl font-bold text-transparent">
                  <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Tournament Details
                </CardTitle>
              </CardHeader>

              <CardContent className="relative space-y-6 p-6">
                {/* Host Section */}
                <div className="rounded-xl bg-slate-800/50 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                    <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase">
                      Host
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        <Wallet className="h-5 w-5 text-purple-400" />
                      </div>
                      <span className="font-mono text-sm font-medium text-purple-300">
                        {tournament.host.slice(0, 6)}...{tournament.host.slice(-4)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="h-8 w-8 rounded-full p-0 text-gray-400 transition-all hover:bg-purple-500/20 hover:text-purple-300"
                    >
                      {copiedAddress ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Prize Pot Section */}
                <div className="rounded-xl border border-green-500/20 bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                    <p className="text-xs font-semibold tracking-wider text-green-400 uppercase">
                      Prize Pot
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                      <Trophy className="h-6 w-6 text-green-400" />
                    </div>
                    <p className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-2xl font-bold text-transparent">
                      {tournament.prize} SEI
                    </p>
                  </div>
                </div>

                {/* Contract Address Section */}
                <div className="rounded-xl bg-slate-800/50 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                    <p className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                      Contract Address
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                        <Code className="h-5 w-5 text-blue-400" />
                      </div>
                      <span className="font-mono text-sm font-medium text-blue-300">
                        {tournament.id.slice(0, 6)}...{tournament.id.slice(-4)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-full p-0 text-gray-400 transition-all hover:bg-blue-500/20 hover:text-blue-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="rounded-xl bg-slate-800/50 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                    <p className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
                      QR Code
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="w-full border-indigo-500/30 bg-indigo-500/10 text-indigo-300 transition-all hover:bg-indigo-500/20 hover:text-indigo-200"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {showQrCode ? 'Hide' : 'Show'} QR Code
                  </Button>
                  {showQrCode && (
                    <div className="mt-4 flex justify-center">
                      <div className="relative rounded-xl bg-white p-1 shadow-lg">
                        <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-gray-200 overflow-hidden">
                          <img
                            alt="Tournament address QR"
                            className="h-full w-full object-contain"
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(String((params as any)?.address || ''))}`}
                          />
                        </div>
                        <div className="absolute -right-2 -bottom-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-1.5">
                          <Scan className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rules Section */}
                <div className="rounded-xl bg-slate-800/50 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                    <p className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
                      Rules
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {tournament.rules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                          <span className="text-xs font-bold text-amber-400">{index + 1}</span>
                        </div>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tournament Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-800/50 p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      <p className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">
                        Duration
                      </p>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {tournament.estimatedDuration || 'TBD'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-800/50 p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-pink-400" />
                      <p className="text-xs font-semibold tracking-wider text-pink-400 uppercase">
                        Created
                      </p>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {formatDateUTC(tournament.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

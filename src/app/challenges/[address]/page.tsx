'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Send,
  RefreshCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GamingButton } from '@/components/ui/gaming-button'
import { GamingCard } from '@/components/ui/gaming-card'
import { GamingBadge } from '@/components/ui/gaming-badge'
import { cn } from '@/lib/utils'
import { useGamerProfile } from '@/context/GamerProfileContext'
import { supabase } from '@/lib/supabase'
import { sanitizeChatMessage, safeDisplayText } from '@/lib/chat-safety'
import ChatBox from '@/components/chat/ChatBox'
import {
  readChallengeInfo,
  joinChallenge,
  submitScore,
  confirmScore,
  disputeChallenge,
  cancelChallenge,
} from '@/lib/contracts/challenge'
import { readIsMod } from '@/lib/contracts/challengeFactory'
import { ZERO_ADDRESS } from '@/lib/tokens'
import { createWalletClient, custom, parseEther } from 'viem'
import { useToast } from '@/hooks/use-toast'

// Types
type ChallengeStatus =
  | 'sent'
  | 'accepted'
  | 'scored'
  | 'score_confirm_pending'
  | 'in_dispute'
  | 'completed'
  | 'canceled'

interface ChallengeDetails {
  id: string
  challenger: {
    id: string
    username: string
    avatar: string
    level: number
    winRate: number
    isVerified: boolean
    score: number
    rank: string
    wins: number
    losses: number
  }
  opponent: {
    id: string
    username: string
    avatar: string
    level: number
    winRate: number
    isVerified: boolean
    score: number
    rank: string
    wins: number
    losses: number
  }
  game: {
    name: string
    console: string
    icon: string
    contractAddress: string
    mode: string
    map: string
  }
  amount: { sei: number; gamer: number }
  status: ChallengeStatus
  rules: string[]
  createdAt: string
  winner?: 'challenger' | 'opponent'
  streamUrl: string
  chatEnabled: boolean
  viewers: number
  estimatedDuration: string
}

// Mock challenge data - in real app this would come from API
const mockChallenge: ChallengeDetails = {
  id: '0x1234567890abcdef',
  challenger: {
    id: '1',
    username: 'ProGamer42',
    avatar: '',
    level: 42,
    winRate: 78,
    isVerified: true,
    score: 0,
    rank: 'Diamond',
    wins: 156,
    losses: 44,
  },
  opponent: {
    id: '2',
    username: 'NinjaWarrior',
    avatar: '',
    level: 38,
    winRate: 82,
    isVerified: true,
    score: 0,
    rank: 'Master',
    wins: 142,
    losses: 31,
  },
  game: {
    name: 'Street Fighter 6',
    console: 'PlayStation 5',
    icon: '',
    contractAddress: '0x1234...5678',
    mode: 'Ranked Battle',
    map: 'All Stages',
  },
  amount: {
    sei: 100,
    gamer: 50,
  },
  status: 'accepted',
  rules: ['Best of 3', 'No character bans', 'Ranked mode only', 'First to 2 wins'],
  createdAt: '2024-01-15T10:30:00Z',
  winner: undefined,
  streamUrl: '',
  chatEnabled: true,
  viewers: 127,
  estimatedDuration: '15-20 min',
}

const statusConfig = {
  sent: {
    label: 'Sent',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: Clock,
    glow: 'shadow-blue-500/20',
    variant: 'mystic' as const,
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: CheckCircle,
    glow: 'shadow-green-500/20',
    variant: 'neon' as const,
  },
  scored: {
    label: 'Scored',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: Trophy,
    glow: 'shadow-yellow-500/20',
    variant: 'victory' as const,
  },
  score_confirm_pending: {
    label: 'Pending',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: AlertCircle,
    glow: 'shadow-orange-500/20',
    variant: 'victory' as const,
  },
  in_dispute: {
    label: 'Dispute',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: XCircle,
    glow: 'shadow-red-500/20',
    variant: 'danger' as const,
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
  canceled: {
    label: 'Canceled',
    color: 'bg-gray-500',
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    icon: XCircle,
    glow: 'shadow-gray-500/20',
    variant: 'shadow' as const,
  },
}

// Modal Components
function ReportScoreModal({
  isOpen,
  onClose,
  onReport,
}: {
  isOpen: boolean
  onClose: () => void
  onReport: (player1Score: string, player2Score: string) => void
}) {
  const [player1Score, setPlayer1Score] = useState('')
  const [player2Score, setPlayer2Score] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md">
        {/* Animated background particles */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-4 left-4 h-2 w-2 animate-ping rounded-full bg-red-400" />
          <div className="absolute top-12 right-8 h-1 w-1 animate-ping rounded-full bg-orange-400 delay-75" />
          <div className="absolute bottom-8 left-12 h-1.5 w-1.5 animate-ping rounded-full bg-rose-400 delay-150" />
          <div className="absolute right-4 bottom-4 h-1 w-1 animate-ping rounded-full bg-red-300 delay-300" />
        </div>

        <GamingCard variant="danger" className="border-2 border-red-500/30">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -inset-1 animate-pulse rounded-lg bg-red-500/20 blur-md" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Report Score</h2>
                  <p className="text-xs font-medium text-red-400">⚠️ Critical Action</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-500/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Warning Note */}
            <div className="relative mb-6 overflow-hidden rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-600/10 p-4">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-red-500/5 to-transparent" />
              <div className="relative z-10 flex items-start gap-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 animate-pulse text-red-400" />
                </div>
                <p className="text-sm leading-relaxed font-medium text-red-300">
                  Reporting the wrong score will cost you a fee or get you banned from the platform
                </p>
              </div>
            </div>

            {/* Score Inputs */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                  {mockChallenge.challenger.username} Score
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={player1Score}
                    onChange={(e) => setPlayer1Score(e.target.value)}
                    className="w-full rounded-xl border border-red-500/30 bg-gray-800/50 px-4 py-3 pr-10 text-white placeholder-gray-500 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    placeholder="Enter score"
                    min="0"
                  />
                  <div className="absolute top-1/2 right-3 -translate-y-1/2 text-red-400/50">
                    <Trophy className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="relative">
                <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
                  {mockChallenge.opponent.username} Score
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={player2Score}
                    onChange={(e) => setPlayer2Score(e.target.value)}
                    className="w-full rounded-xl border border-orange-500/30 bg-gray-800/50 px-4 py-3 pr-10 text-white placeholder-gray-500 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Enter score"
                    min="0"
                  />
                  <div className="absolute top-1/2 right-3 -translate-y-1/2 text-orange-400/50">
                    <Trophy className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <GamingButton variant="shadow" onClick={onClose} className="flex-1">
                Cancel
              </GamingButton>
              <GamingButton
                variant="danger"
                onClick={() => onReport(player1Score, player2Score)}
                className="flex-1"
                disabled={!player1Score || !player2Score}
              >
                Report Score
              </GamingButton>
            </div>
          </div>
        </GamingCard>
      </div>
    </div>
  )
}

function ConfirmScoreModal({
  isOpen,
  onClose,
  onConfirm,
  onReject,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onReject: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md">
        {/* Animated background particles */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-4 left-4 h-2 w-2 animate-ping rounded-full bg-green-400" />
          <div className="absolute top-12 right-8 h-1 w-1 animate-ping rounded-full bg-emerald-400 delay-75" />
          <div className="absolute bottom-8 left-12 h-1.5 w-1.5 animate-ping rounded-full bg-lime-400 delay-150" />
          <div className="absolute right-4 bottom-4 h-1 w-1 animate-ping rounded-full bg-green-300 delay-300" />
        </div>

        <GamingCard variant="victory" className="border-2 border-green-500/30">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -inset-1 animate-pulse rounded-lg bg-green-500/20 blur-md" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Confirm Score</h2>
                  <p className="text-xs font-medium text-green-400">✓ Victory Action</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-green-500/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Warning Note */}
            <div className="relative mb-6 overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-600/10 p-4">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-amber-500/5 to-transparent" />
              <div className="relative z-10 flex items-start gap-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 animate-pulse text-amber-400" />
                </div>
                <p className="text-sm leading-relaxed font-medium text-amber-300">
                  You will not be able to dispute after confirming the score, reject the score if
                  you do not agree
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <GamingButton variant="danger" onClick={onReject} className="flex-1">
                Reject
              </GamingButton>
              <GamingButton variant="victory" onClick={onConfirm} className="flex-1">
                Confirm
              </GamingButton>
            </div>
          </div>
        </GamingCard>
      </div>
    </div>
  )
}

function DisputeModal({
  isOpen,
  onClose,
  onDispute,
}: {
  isOpen: boolean
  onClose: () => void
  onDispute: (reason: string) => void
}) {
  const [disputeReason, setDisputeReason] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md">
        {/* Animated background particles */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-4 left-4 h-2 w-2 animate-ping rounded-full bg-purple-400" />
          <div className="absolute top-12 right-8 h-1 w-1 animate-ping rounded-full bg-pink-400 delay-75" />
          <div className="absolute bottom-8 left-12 h-1.5 w-1.5 animate-ping rounded-full bg-indigo-400 delay-150" />
          <div className="absolute right-4 bottom-4 h-1 w-1 animate-ping rounded-full bg-purple-300 delay-300" />
        </div>

        <GamingCard variant="mystic" className="border-2 border-purple-500/30">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -inset-1 animate-pulse rounded-lg bg-purple-500/20 blur-md" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">File Dispute</h2>
                  <p className="text-xs font-medium text-purple-400">⚡ Mystic Action</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-purple-500/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Warning Note */}
            <div className="relative mb-6 overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-600/10 p-4">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-purple-500/5 to-transparent" />
              <div className="relative z-10 flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Video className="h-5 w-5 animate-pulse text-purple-400" />
                </div>
                <p className="text-sm leading-relaxed font-medium text-purple-300">
                  Video evidence is required for your dispute, do not file disputes out of spite you
                  will be penalized or banned
                </p>
              </div>
            </div>

            {/* Dispute Reason */}
            <div className="mb-6">
              <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
                Dispute Reason
              </label>
              <div className="relative">
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full resize-none rounded-xl border border-purple-500/30 bg-gray-800/50 px-4 py-3 pr-10 text-white placeholder-gray-500 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  placeholder="Enter detailed reason for dispute..."
                  rows={4}
                />
                <div className="absolute top-3 right-3 text-purple-400/50">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-xs text-purple-400/70">
                Provide specific details and timestamps for your dispute
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <GamingButton variant="shadow" onClick={onClose} className="flex-1">
                Cancel
              </GamingButton>
              <GamingButton
                variant="mystic"
                onClick={() => onDispute(disputeReason)}
                className="flex-1"
                disabled={!disputeReason.trim()}
              >
                File Dispute
              </GamingButton>
            </div>
          </div>
        </GamingCard>
      </div>
    </div>
  )
}

export default function ChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { address: viewerAddress, isConnected } = useGamerProfile()
  const { toast } = useToast()
  const [challenge, setChallenge] = useState<ChallengeDetails>(mockChallenge)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isLiked, setIsLiked] = useState(false)
  const [viewerCount, setViewerCount] = useState(challenge.viewers)
  const [creatorAddress, setCreatorAddress] = useState<string>('')
  const [opponentAddress, setOpponentAddress] = useState<string>('')
  const [scoreReporterAddress, setScoreReporterAddress] = useState<string>('')
  const [statusCode, setStatusCode] = useState<number>(1)
  const [entryFeeWei, setEntryFeeWei] = useState<bigint>(BigInt(0))
  const [payToken, setPayToken] = useState<`0x${string}`>(ZERO_ADDRESS as `0x${string}`)
  const [isModViewer, setIsModViewer] = useState<boolean>(false)
  const [showStreamInput, setShowStreamInput] = useState<boolean>(false)
  const [streamInput, setStreamInput] = useState<string>('')
  // Chat state
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: number; sender_wallet: string; message: string; created_at: string }>
  >([])
  const [chatUsers, setChatUsers] = useState<
    Record<string, { username: string; avatar_url?: string }>
  >({})
  const [chatInput, setChatInput] = useState<string>('')
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false)
  const [showQrCode, setShowQrCode] = useState<boolean>(false)

  // Modal states
  const [showReportModal, setShowReportModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false)

  const refreshContractBalances = async () => {
    try {
      setIsRefreshingBalances(true)
      const addrParam = (params.address as string)?.toLowerCase()
      if (!addrParam || !/^0x[a-fA-F0-9]{40}$/.test(addrParam)) throw new Error('Invalid challenge address')
      const info = await readChallengeInfo(addrParam as `0x${string}`)
      const isNative = info.payToken === ZERO_ADDRESS
      const contractBalance = Number(info.contractBalance) / 1e18
      setChallenge((prev) => ({
        ...prev,
        amount: { sei: isNative ? contractBalance : 0, gamer: isNative ? 0 : contractBalance },
      }))
      toast({ title: 'Balances refreshed', description: 'Prize pool updated from contract.' })
    } catch (e: any) {
      toast({ title: 'Failed to refresh', description: String(e?.message || e), variant: 'destructive' })
    } finally {
      setIsRefreshingBalances(false)
    }
  }

  const statusInfo = statusConfig[challenge.status]
  const StatusIcon = statusInfo.icon
  const isParticipant = useMemo(() => {
    const v = viewerAddress?.toLowerCase()
    return Boolean(v && (v === creatorAddress || v === opponentAddress))
  }, [viewerAddress, creatorAddress, opponentAddress])

  // Simulate live viewer count updates
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => prev + Math.floor(Math.random() * 3) - 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Load challenge info from contract and sync to DB
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const addrParam = (params.address as string)?.toLowerCase()
        if (!addrParam || !/^0x[a-fA-F0-9]{40}$/.test(addrParam)) return
        const info = await readChallengeInfo(addrParam as `0x${string}`)
        if (!mounted) return
        setCreatorAddress(info.creator.toLowerCase())
        setOpponentAddress(info.opponent.toLowerCase())
        setScoreReporterAddress((info.scoreReporter || ZERO_ADDRESS).toLowerCase())
        setStatusCode(Number(info.status))
        setEntryFeeWei(info.entryFee)
        setPayToken(info.payToken)

        const meta = (() => {
          try {
            return info.metadata ? JSON.parse(info.metadata) : {}
          } catch {
            return {}
          }
        })()
        const gameName = meta.title || info.gameType || 'Custom Game'
        const consoleName = meta.console || 'PC'
        const modeName = meta.mode || 'Heads-Up'
        const mapName = meta.map || 'Any'
        const rulesFromMeta = parseRules(meta.rules || meta.gameRules || meta.battle_rules)
        const isNative = info.payToken === ZERO_ADDRESS
        // Use actual contract balance for prize display (SEI or GAMER)
        const contractBalance = Number(info.contractBalance) / 1e18
        // Determine winner only when score is confirmed (status code 4)
        let winner: 'challenger' | 'opponent' | undefined
        if (Number(info.status) === 4) {
          const p1 = Number(info.player1score)
          const p2 = Number(info.player2score)
          if (p1 > p2) winner = 'challenger'
          else if (p2 > p1) winner = 'opponent'
        }

        setChallenge((prev) => ({
          ...prev,
          id: addrParam,
          game: {
            ...prev.game,
            name: gameName,
            console: consoleName,
            contractAddress: addrParam,
            mode: modeName,
            map: mapName,
          },
          amount: { sei: isNative ? contractBalance : 0, gamer: isNative ? 0 : contractBalance },
          // Update reported scores from on-chain info
          challenger: { ...prev.challenger, score: Number(info.player1score) },
          opponent: { ...prev.opponent, score: Number(info.player2score) },
          rules: rulesFromMeta.length ? rulesFromMeta : prev.rules,
          status: mapStatusToUi(
            Number(info.status),
            viewerAddress?.toLowerCase(),
            info.scoreReporter?.toLowerCase(),
          ),
          createdAt: new Date(Number(info.createdAt) * 1000).toISOString(),
          winner,
        }))

        // Sync to Supabase (upsert)
        try {
          await supabase.from('challenges').upsert(
            {
              contract_address: addrParam,
              creator: info.creator.toLowerCase(),
              opponent: info.opponent.toLowerCase(),
              challenge_type: Number(info.challengeType),
              status: Number(info.status),
              game_type: info.gameType,
              entry_fee: info.entryFee.toString(),
              total_prize_pool: info.totalPrizePool.toString(),
              pay_token: info.payToken,
              metadata: info.metadata,
              created_at: new Date(Number(info.createdAt) * 1000).toISOString(),
              // keep existing streaming state if present
            },
            { onConflict: 'contract_address' },
          )
        } catch (e) {
          console.warn('Supabase upsert failed:', e)
        }

        // Fallback: load rules from the Supabase challenge row metadata if not present in contract metadata
        try {
          if (!rulesFromMeta.length) {
            const { data: chRow } = await supabase
              .from('challenges')
              .select('metadata, stream_embed_code, is_streaming')
              .eq('contract_address', addrParam)
              .maybeSingle()
            const dbMeta = chRow?.metadata || {}
            const dbRules = parseRules(dbMeta?.rules || dbMeta?.gameRules || dbMeta?.battle_rules)
            if (Array.isArray(dbRules) && dbRules.length) {
              setChallenge((prev) => ({ ...prev, rules: dbRules }))
            }
            // load stream embed if present
            if (chRow?.stream_embed_code) {
              setChallenge((prev) => ({ ...prev, streamUrl: String(chRow.stream_embed_code) }))
            }
          }
        } catch (e) {
          console.warn('Failed to load rules from DB metadata:', e)
        }

        // Load creator/opponent profiles to populate avatars, names, and W-L
        try {
          const [{ data: creatorRow }, { data: opponentRow }] = await Promise.all([
            supabase
              .from('gamers')
              .select('*')
              .eq('wallet', info.creator.toLowerCase())
              .maybeSingle(),
            supabase
              .from('gamers')
              .select('*')
              .eq('wallet', info.opponent.toLowerCase())
              .maybeSingle(),
          ])

          const toProfile = (row: any, fallbackWallet: string) => {
            const uname = row?.username || `gamer_${fallbackWallet.slice(2, 8)}`
            const avatar = row?.avatar_url || '/logo.png'
            const games: any[] = Array.isArray(row?.games) ? row?.games : []
            const match = games.find((g) => {
              const t = (g?.title || '').toLowerCase()
              return t === gameName.toLowerCase() || t === String(info.gameType || '').toLowerCase()
            })
            const wl = match?.win_loss_record || { wins: 0, losses: 0 }
            const wins = Number(wl.wins || 0)
            const losses = Number(wl.losses || 0)
            const total = wins + losses
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
            const level = typeof match?.mmr === 'number' ? Number(match.mmr) : 0
            return { username: uname, avatar, wins, losses, winRate, level }
          }

          const creatorProf = toProfile(creatorRow, info.creator)
          const opponentProf = toProfile(opponentRow, info.opponent)

          setChallenge((prev) => ({
            ...prev,
            challenger: {
              ...prev.challenger,
              username: creatorProf.username,
              avatar: creatorProf.avatar,
              wins: creatorProf.wins,
              losses: creatorProf.losses,
              winRate: creatorProf.winRate,
              level: creatorProf.level,
            },
            opponent: {
              ...prev.opponent,
              username: opponentProf.username,
              avatar: opponentProf.avatar,
              wins: opponentProf.wins,
              losses: opponentProf.losses,
              winRate: opponentProf.winRate,
              level: opponentProf.level,
            },
          }))
        } catch (e) {
          console.warn('Failed to load gamer profiles:', e)
        }

        // Moderator role check on ChallengeFactory for current viewer
        try {
          if (viewerAddress && /^0x[a-fA-F0-9]{40}$/.test(viewerAddress)) {
            const mod = await readIsMod(viewerAddress as `0x${string}`)
            if (mounted) setIsModViewer(Boolean(mod))
          } else {
            setIsModViewer(false)
          }
        } catch (e) {
          console.warn('Failed to check moderator role:', e)
        }
      } catch (e) {
        console.error('Failed to load challenge info:', e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [params.address, viewerAddress])

  // Load chat messages for this challenge and enrich with usernames
  useEffect(() => {
    const addrParam = (params.address as string)?.toLowerCase()
    if (!addrParam || !/^0x[a-fA-F0-9]{40}$/.test(addrParam)) return
    const fetchChats = async () => {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('id, sender_wallet, message, created_at')
          .eq('chat_address', addrParam)
          .order('created_at', { ascending: true })
        if (error) {
          console.warn('Failed to fetch chats:', error.message)
          return
        }
        const msgs = Array.isArray(data) ? data : []
        const safeMsgs = (msgs as any[])
          .map((m: any) => {
            const { sanitized, ok } = sanitizeChatMessage(m.message, { maxLength: 500 })
            return ok ? { ...m, message: sanitized } : null
          })
          .filter(Boolean)
        setChatMessages(safeMsgs as any)
        const senders = Array.from(
          new Set(msgs.map((m: any) => (m.sender_wallet || '').toLowerCase()).filter(Boolean)),
        )
        if (senders.length) {
          const { data: gamers } = await supabase
            .from('gamers')
            .select('wallet, username, avatar_url')
            .in('wallet', senders)
          const map: Record<string, { username: string; avatar_url?: string }> = {}
          ;(Array.isArray(gamers) ? gamers : []).forEach((g: any) => {
            const key = (g.wallet || '').toLowerCase()
            map[key] = {
              username: g.username || `gamer_${String(key).slice(2, 8)}`,
              avatar_url: g.avatar_url || undefined,
            }
          })
          setChatUsers(map)
        } else {
          setChatUsers({})
        }
      } catch (e) {
        console.warn('Unexpected error fetching chats:', e)
      }
    }
    void fetchChats()
  }, [params.address])

  // Realtime subscription: chats (INSERT)
  useEffect(() => {
    const addrParam = (params.address as string)?.toLowerCase()
    if (!addrParam || !/^0x[a-fA-F0-9]{40}$/.test(addrParam)) return
    const channel = supabase
      .channel(`chats:${addrParam}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `chat_address=eq.${addrParam}`,
        },
        (payload: any) => {
          const row = payload?.new
          if (!row) return
          setChatMessages((prev) => {
            // Deduplicate by id
            if (prev.some((m) => m.id === row.id)) return prev
            const { sanitized, ok } = sanitizeChatMessage(row.message, { maxLength: 500 })
            if (!ok) return prev
            return [
              ...prev,
              {
                id: row.id,
                sender_wallet: row.sender_wallet,
                message: sanitized,
                created_at: row.created_at,
              },
            ]
          })
          const sender = String(row.sender_wallet || '').toLowerCase()
          // Enrich sender info if missing
          setTimeout(async () => {
            try {
              const exists = Boolean((chatUsers as any)[sender])
              if (exists) return
              const { data: gamer } = await supabase
                .from('gamers')
                .select('wallet, username, avatar_url')
                .eq('wallet', sender)
                .maybeSingle()
              setChatUsers((prev) => ({
                ...prev,
                [sender]: {
                  username: gamer?.username || `gamer_${sender.slice(2, 8)}`,
                  avatar_url: gamer?.avatar_url || undefined,
                },
              }))
            } catch (e) {
              // ignore enrichment errors
            }
          }, 0)
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.address, chatUsers])

  // Realtime subscription: challenge row updates
  useEffect(() => {
    const addrParam = (params.address as string)?.toLowerCase()
    if (!addrParam || !/^0x[a-fA-F0-9]{40}$/.test(addrParam)) return
    const channel = supabase
      .channel(`challenge:${addrParam}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
          filter: `contract_address=eq.${addrParam}`,
        },
        (payload: any) => {
          const row = payload?.new
          if (!row) return
          // Stream embed updates
          const embed = row?.stream_embed_code ? String(row.stream_embed_code) : ''
          // Rules from metadata (if provided)
          const dbMeta = row?.metadata || {}
          const dbRules = parseRules(dbMeta?.rules || dbMeta?.gameRules || dbMeta?.battle_rules)
          setChallenge((prev) => ({
            ...prev,
            streamUrl: embed,
            rules: dbRules?.length ? dbRules : prev.rules,
            status: mapStatusToUi(
              Number(row?.status ?? statusCode),
              viewerAddress?.toLowerCase(),
              String(row?.score_reporter || '').toLowerCase(),
            ),
          }))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.address, viewerAddress])

  const sendChatMessage = async () => {
    if (isSendingChat) return
    const addrParam = (params.address as string)?.toLowerCase()
    const sender = viewerAddress?.toLowerCase()
    if (!isConnected || !sender || !addrParam) return
    const { sanitized, ok, reason } = sanitizeChatMessage(chatInput, { maxLength: 500 })
    if (!ok) {
      console.warn('Blocked chat message:', reason)
      return
    }
    setIsSendingChat(true)
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          chat_address: addrParam,
          challenge_address: addrParam,
          sender_wallet: sender,
          message: sanitized,
        })
        .select('id, sender_wallet, message, created_at')
        .single()
      if (error) {
        console.warn('Failed to send chat:', error.message)
        return
      }
      const msg = data as any
      setChatMessages((prev) => [...prev, { ...msg, message: sanitized }])
      setChatInput('')
      if (!chatUsers[sender]) {
        const { data: gamer } = await supabase
          .from('gamers')
          .select('wallet, username, avatar_url')
          .eq('wallet', sender)
          .maybeSingle()
        setChatUsers((prev) => ({
          ...prev,
          [sender]: {
            username: gamer?.username || `gamer_${sender.slice(2, 8)}`,
            avatar_url: gamer?.avatar_url || undefined,
          },
        }))
      }
    } catch (e) {
      console.warn('Unexpected error sending chat:', e)
    } finally {
      setIsSendingChat(false)
    }
  }

  // Helper: parse rules from various metadata formats
  const parseRules = (raw: any): string[] => {
    try {
      if (!raw) return []
      if (Array.isArray(raw)) return raw.map((r) => String(r).trim()).filter(Boolean)
      if (typeof raw === 'string') {
        return raw
          .split(/\r?\n|,|;|\|/)
          .map((s) => s.trim())
          .filter(Boolean)
      }
      if (typeof raw === 'object' && Array.isArray((raw as any).items)) {
        return (raw as any).items.map((r: any) => String(r).trim()).filter(Boolean)
      }
      return []
    } catch {
      return []
    }
  }

  const mapStatusToUi = (code: number, viewer?: string, reporter?: string): ChallengeStatus => {
    // 0 CANCELLED, 1 ACTIVE, 2 ACCEPTED, 3 SCORE_REPORTED, 4 SCORE_CONFIRMED, 5 DISPUTED
    switch (code) {
      case 0:
        return 'canceled'
      case 1:
        return 'sent'
      case 2:
        return 'accepted'
      case 3:
        return viewer && reporter && reporter === viewer ? 'score_confirm_pending' : 'scored'
      case 4:
        return 'completed'
      case 5:
        return 'in_dispute'
      default:
        return 'sent'
    }
  }

  const handleAction = (action: string) => {
    console.log(`Action: ${action}`)
    // Handle different actions based on challenge status
    if (action === 'report') {
      setShowReportModal(true)
    } else if (action === 'confirm') {
      setShowConfirmModal(true)
    } else if (action === 'dispute') {
      setShowDisputeModal(true)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Link copied to clipboard',
    })
  }

  const shareChallenge = () => {
    if (navigator.share) {
      navigator.share({
        title: `${challenge.game.name} Challenge`,
        text: `${challenge.challenger.username} vs ${challenge.opponent.username}`,
        url: window.location.href,
      })
    }
  }

  const shortenAddress = (addr: string) => {
    if (!addr || typeof addr !== 'string') return ''
    const a = addr.trim()
    if (!/^0x[a-fA-F0-9]{10,}$/.test(a)) return a
    return `${a.slice(0, 6)}…${a.slice(-4)}`
  }

  const syncChallengeDb = async (
    addrParam: string,
    info: any,
  ) => {
    try {
      await supabase.from('challenges').upsert(
        {
          contract_address: addrParam,
          status: Number(info.status),
          score_reporter: String(info.scoreReporter || ZERO_ADDRESS).toLowerCase(),
          game_type: info.gameType,
          entry_fee: info.entryFee?.toString?.() ?? String(info.entryFee ?? ''),
          total_prize_pool: info.totalPrizePool?.toString?.() ?? String(info.totalPrizePool ?? ''),
          pay_token: info.payToken,
          metadata: info.metadata,
        },
        { onConflict: 'contract_address' },
      )
    } catch (e) {
      console.warn('DB sync failed:', e)
    }
  }

  const handleReportScore = async (player1Score: string, player2Score: string) => {
    try {
      const cAddr = (params.address as string)?.toLowerCase() as `0x${string}`
      if (!viewerAddress || !/^0x[a-fA-F0-9]{40}$/.test(viewerAddress))
        throw new Error('Connect wallet to report score')
      if (typeof window === 'undefined' || !(window as any).ethereum)
        throw new Error('No wallet provider')
      const walletClient = createWalletClient({
        transport: custom((window as any).ethereum!),
        chain: undefined,
      })
      const p1 = BigInt(player1Score)
      const p2 = BigInt(player2Score)
      await submitScore(viewerAddress as `0x${string}`, cAddr, p1, p2, walletClient)
      setShowReportModal(false)
      // Refresh
      const info = await readChallengeInfo(cAddr)
      setScoreReporterAddress((info.scoreReporter || ZERO_ADDRESS).toLowerCase())
      setStatusCode(Number(info.status))
      setChallenge((prev) => ({
        ...prev,
        status: mapStatusToUi(
          Number(info.status),
          viewerAddress?.toLowerCase(),
          info.scoreReporter?.toLowerCase(),
        ),
      }))
      await syncChallengeDb(cAddr, info)
      toast({
        title: 'Score reported',
        description: 'Waiting for opponent confirmation',
      })
    } catch (e) {
      console.error('Report score failed:', e)
      const msg = (e as any)?.message || 'Failed to report score'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  const handleConfirmScore = async () => {
    try {
      const cAddr = (params.address as string)?.toLowerCase() as `0x${string}`
      if (!viewerAddress || !/^0x[a-fA-F0-9]{40}$/.test(viewerAddress))
        throw new Error('Connect wallet to confirm score')
      if (typeof window === 'undefined' || !(window as any).ethereum)
        throw new Error('No wallet provider')
      const walletClient = createWalletClient({
        transport: custom((window as any).ethereum!),
        chain: undefined,
      })
      await confirmScore(
        viewerAddress as `0x${string}`,
        cAddr,
        viewerAddress as `0x${string}`,
        walletClient,
      )
      setShowConfirmModal(false)
      const info = await readChallengeInfo(cAddr)
      setStatusCode(Number(info.status))
      setChallenge((prev) => ({
        ...prev,
        status: mapStatusToUi(
          Number(info.status),
          viewerAddress?.toLowerCase(),
          info.scoreReporter?.toLowerCase(),
        ),
      }))
      await syncChallengeDb(cAddr, info)
      toast({ title: 'Score confirmed', description: 'Challenge completed' })
    } catch (e) {
      console.error('Confirm score failed:', e)
      const msg = (e as any)?.message || 'Failed to confirm score'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  const handleRejectScore = () => {
    // For now, rejecting score triggers dispute modal as per platform policy
    setShowConfirmModal(false)
    setShowDisputeModal(true)
  }

  const handleFileDispute = async (reason: string) => {
    try {
      const cAddr = (params.address as string)?.toLowerCase() as `0x${string}`
      if (!viewerAddress || !/^0x[a-fA-F0-9]{40}$/.test(viewerAddress))
        throw new Error('Connect wallet to file dispute')
      if (typeof window === 'undefined' || !(window as any).ethereum)
        throw new Error('No wallet provider')
      const walletClient = createWalletClient({
        transport: custom((window as any).ethereum!),
        chain: undefined,
      })
      await disputeChallenge(viewerAddress as `0x${string}`, cAddr, reason, walletClient)
      setShowDisputeModal(false)
      const info = await readChallengeInfo(cAddr)
      setStatusCode(Number(info.status))
      setChallenge((prev) => ({
        ...prev,
        status: mapStatusToUi(
          Number(info.status),
          viewerAddress?.toLowerCase(),
          info.scoreReporter?.toLowerCase(),
        ),
      }))
      await syncChallengeDb(cAddr, info)
      toast({ title: 'Dispute filed', description: 'Awaiting moderator review' })
    } catch (e) {
      console.error('Dispute failed:', e)
      const msg = (e as any)?.message || 'Failed to file dispute'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  const handleAcceptChallenge = async () => {
    try {
      const cAddr = (params.address as string)?.toLowerCase() as `0x${string}`
      if (!viewerAddress || !/^0x[a-fA-F0-9]{40}$/.test(viewerAddress))
        throw new Error('Connect wallet to accept challenge')
      if (typeof window === 'undefined' || !(window as any).ethereum)
        throw new Error('No wallet provider')
      const walletClient = createWalletClient({
        transport: custom((window as any).ethereum!),
        chain: undefined,
      })
      const value = payToken === ZERO_ADDRESS ? entryFeeWei : BigInt(0)
      await joinChallenge(viewerAddress as `0x${string}`, cAddr, { valueWei: value }, walletClient)
      const info = await readChallengeInfo(cAddr)
      setStatusCode(Number(info.status))
      setChallenge((prev) => ({
        ...prev,
        status: mapStatusToUi(
          Number(info.status),
          viewerAddress?.toLowerCase(),
          info.scoreReporter?.toLowerCase(),
        ),
      }))
      await syncChallengeDb(cAddr, info)
      toast({ title: 'Challenge accepted', description: 'Good luck! Battle on.' })
    } catch (e) {
      console.error('Accept challenge failed:', e)
      const msg = (e as any)?.message || 'Failed to accept challenge'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  const handleCancelChallenge = async () => {
    try {
      const cAddr = (params.address as string)?.toLowerCase() as `0x${string}`
      if (!viewerAddress || !/^0x[a-fA-F0-9]{40}$/.test(viewerAddress))
        throw new Error('Connect wallet to cancel challenge')
      if (typeof window === 'undefined' || !(window as any).ethereum)
        throw new Error('No wallet provider')
      const walletClient = createWalletClient({
        transport: custom((window as any).ethereum!),
        chain: undefined,
      })
      await cancelChallenge(viewerAddress as `0x${string}`, cAddr, 'User canceled', walletClient)
      const info = await readChallengeInfo(cAddr)
      setStatusCode(Number(info.status))
      setChallenge((prev) => ({
        ...prev,
        status: mapStatusToUi(
          Number(info.status),
          viewerAddress?.toLowerCase(),
          info.scoreReporter?.toLowerCase(),
        ),
      }))
      await syncChallengeDb(cAddr, info)
      toast({ title: 'Challenge canceled', description: 'Challenge has been canceled' })
    } catch (e) {
      console.error('Cancel challenge failed:', e)
      const msg = (e as any)?.message || 'Failed to cancel challenge'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  const getBattleActionButton = () => {
    // Moderator Actions override when viewer is moderator
    if (isModViewer) {
      return (
        <div className="flex w-full gap-3">
          <GamingButton
            variant="victory"
            onClick={() => setShowReportModal(true)}
            className="flex-1 py-3 text-lg font-bold"
          >
            Score
          </GamingButton>
          <GamingButton
            variant="danger"
            onClick={handleCancelChallenge}
            className="flex-1 py-3 text-lg font-bold"
          >
            Cancel
          </GamingButton>
        </div>
      )
    }

    const viewer = viewerAddress?.toLowerCase()
    const isCreator = viewer && creatorAddress && viewer === creatorAddress
    const isOpponent = viewer && opponentAddress && viewer === opponentAddress
    const isEither = isCreator || isOpponent

    // 0 CANCELLED, 1 ACTIVE, 2 ACCEPTED, 3 SCORE_REPORTED, 4 SCORE_CONFIRMED, 5 DISPUTED
    if (isCreator && statusCode === 1) {
      return (
        <GamingButton
          variant="mystic"
          onClick={handleCancelChallenge}
          className="w-full py-3 text-lg font-bold"
        >
          Cancel Challenge
        </GamingButton>
      )
    }

    if (isOpponent && statusCode === 1) {
      return (
        <GamingButton
          variant="neon"
          onClick={handleAcceptChallenge}
          className="w-full py-3 text-lg font-bold"
        >
          Accept Challenge
        </GamingButton>
      )
    }

    if ((isCreator || isOpponent) && statusCode === 2) {
      return (
        <GamingButton
          variant="victory"
          onClick={() => setShowReportModal(true)}
          className="w-full py-3 text-lg font-bold"
        >
          Report Score
        </GamingButton>
      )
    }

    if (isEither && statusCode === 3) {
      const reporter = scoreReporterAddress?.toLowerCase()
      if (reporter && viewer && reporter !== viewer) {
        return (
          <div className="flex w-full gap-3">
            <GamingButton
              variant="victory"
              onClick={() => setShowConfirmModal(true)}
              className="flex-1 py-3 text-lg font-bold"
            >
              Confirm Score
            </GamingButton>
            <GamingButton
              variant="danger"
              onClick={() => setShowDisputeModal(true)}
              className="flex-1 py-3 text-lg font-bold"
            >
              Dispute Score
            </GamingButton>
          </div>
        )
      }
      return (
        <GamingButton
          variant="shadow"
          disabled
          className="w-full py-3 text-lg font-bold opacity-70"
        >
          Score confirm pending
        </GamingButton>
      )
    }

    return (
      <GamingButton
        variant="shadow"
        disabled
        className="w-full cursor-not-allowed py-3 text-lg font-bold opacity-50"
      >
        No Actions Available
      </GamingButton>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 border-b border-yellow-500/20 bg-gradient-to-b from-black via-black/90 to-transparent backdrop-blur-xl">
        {/* Static top border */}
        <div className="h-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-600 shadow-lg shadow-amber-500/50" />

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <GamingButton
                variant="shadow"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </GamingButton>
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-xl font-black text-transparent">
                Challenge Arena
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-xs text-green-400">Live</span>
                </div>
                <span className="text-xs text-gray-500">•</span>
                <p className="font-mono text-xs text-gray-400">
                  {params.address?.slice(0, 8)}...{params.address?.slice(-6)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GamingButton
              variant="mystic"
              size="sm"
              onClick={() => copyToClipboard(window.location.href)}
              className="p-2"
            >
              <Copy className="h-4 w-4" />
            </GamingButton>
            <GamingButton variant="power" size="sm" onClick={shareChallenge} className="p-2">
              <Share2 className="h-4 w-4" />
            </GamingButton>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Enhanced Game Card & Stream */}
          <div className="space-y-6 lg:col-span-2">
            {/* Challenge Card - Using same style as main page */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black transition-all duration-300 hover:border-gray-700 hover:shadow-xl hover:shadow-black/20">
              {/* Status Bar */}
              <div
                className={`h-1 ${statusInfo.color} transition-all duration-300 group-hover:h-1.5`}
              />

              <div className="p-4 sm:p-6">
                {/* Header with Game Info */}
                <div className="mb-4 flex items-center justify-between gap-2">
                  {/* Game Info */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                      <Gamepad2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-white sm:text-base">
                        {challenge.game.name}
                      </h3>
                      <p className="truncate text-xs text-gray-400">
                        {challenge.game.console} • {challenge.game.mode}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`flex items-center gap-1 rounded-full px-2 py-1 ${statusInfo.bgColor} ${statusInfo.borderColor} flex-shrink-0 border`}
                  >
                    <StatusIcon className={`h-3 w-3 ${statusInfo.textColor}`} />
                    <span className={`text-xs font-medium ${statusInfo.textColor}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Players VS Section */}
                <div className="mb-6 flex items-center justify-between gap-4">
                  {/* Challenger */}
                  <div className="flex-1 text-center">
                    <Link
                      href={creatorAddress ? `/profile/${creatorAddress}` : '#'}
                      className="relative mb-2 inline-block focus:outline-none"
                      aria-label="View challenger profile"
                    >
                      <Avatar className="h-12 w-12 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20">
                        <AvatarImage
                          src={challenge.challenger.avatar}
                          alt={challenge.challenger.username}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white">
                          {challenge.challenger.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-[8px] font-bold text-white shadow-lg">
                        {challenge.challenger.score}
                      </div>
                      {challenge.winner === 'challenger' && (
                        <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-green-500">
                          <CheckCircle className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </Link>

                    <h3 className="mb-1 truncate text-sm font-medium text-white">
                      {challenge.challenger.username}
                    </h3>

                    <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                      <span>{challenge.challenger.winRate}%</span>
                      <span>•</span>
                      <span>{challenge.challenger.wins}W</span>
                      <span>•</span>
                      <span>{challenge.challenger.losses}L</span>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 opacity-30 blur-md" />
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg">
                        <span className="text-xs font-black text-white">VS</span>
                      </div>
                    </div>
                  </div>

                  {/* Opponent */}
                  <div className="flex-1 text-center">
                    <Link
                      href={opponentAddress ? `/profile/${opponentAddress}` : '#'}
                      className="relative mb-2 inline-block focus:outline-none"
                      aria-label="View opponent profile"
                    >
                      <Avatar className="h-12 w-12 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20">
                        <AvatarImage
                          src={challenge.opponent.avatar}
                          alt={challenge.opponent.username}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-xs font-bold text-white">
                          {challenge.opponent.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-[8px] font-bold text-white shadow-lg">
                        {challenge.opponent.score}
                      </div>
                      {challenge.winner === 'opponent' && (
                        <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-green-500">
                          <CheckCircle className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </Link>

                    <h3 className="mb-1 truncate text-sm font-medium text-white">
                      {challenge.opponent.username}
                    </h3>

                    <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                      <span>{challenge.opponent.winRate}%</span>
                      <span>•</span>
                      <span>{challenge.opponent.wins}W</span>
                      <span>•</span>
                      <span>{challenge.opponent.losses}L</span>
                    </div>
                  </div>
                </div>

                {/* Prize Pool */}
                <div className="relative flex items-center justify-center gap-4 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-600/10 p-3">
                  <button
                    type="button"
                    aria-label="Refresh balances"
                    onClick={refreshContractBalances}
                    className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/20 text-amber-300 transition hover:bg-amber-500/30 hover:text-amber-200"
                    title="Refresh contract balances"
                  >
                    <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshingBalances ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="text-center">
                    <p className="mb-1 text-xs text-gray-400">SEI Prize</p>
                    <p className="text-lg font-bold text-amber-400">{challenge.amount.sei}</p>
                  </div>
                  <div className="h-8 w-px bg-gray-600" />
                  <div className="text-center">
                    <p className="mb-1 text-xs text-gray-400">GAMER</p>
                    <p className="text-lg font-bold text-purple-400">{challenge.amount.gamer}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Battle Action Button - Centered */}
            <div className="flex justify-center">{getBattleActionButton()}</div>

            {/* Tabbed Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 border border-gray-700 bg-gray-800/50">
                <TabsTrigger
                  value="overview"
                  className="text-gray-400 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="text-gray-400 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                >
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="onchain"
                  className="text-gray-400 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                >
                  On-Chain
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="space-y-6">
                  {/* Enhanced Live Stream */}
                  <GamingCard
                    variant="shadow"
                    header={{
                      title: 'Live Battle Stream',
                      subtitle: `${viewerCount} viewers • ${challenge.estimatedDuration} estimated`,
                      icon: (
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-600">
                            <Monitor className="h-5 w-5 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        </div>
                      ),
                    }}
                  >
                    <div className="space-y-4">
                      {/* Enhanced Stream Player */}
                      <div className="relative aspect-video overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900">
                        {challenge.streamUrl && (
                          <div className="absolute inset-0">
                            <div
                              className="h-full w-full"
                              dangerouslySetInnerHTML={{ __html: challenge.streamUrl }}
                            />
                          </div>
                        )}
                        {!challenge.streamUrl && isParticipant && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {!showStreamInput ? (
                              <GamingButton
                                variant="victory"
                                onClick={() => setShowStreamInput(true)}
                              >
                                Add Stream
                              </GamingButton>
                            ) : (
                              <div className="mx-auto max-w-xl space-y-3 p-4">
                                <textarea
                                  className="min-h-28 w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-white/40"
                                  placeholder="Paste stream embed HTML (iframe)"
                                  value={streamInput}
                                  onChange={(e) => setStreamInput(e.target.value)}
                                />
                                <div className="flex items-center justify-center gap-3">
                                  <GamingButton
                                    variant="victory"
                                    onClick={async () => {
                                      try {
                                        const addrParam = (params.address as string)?.toLowerCase()
                                        if (!addrParam) return
                                        if (!streamInput.trim()) return
                                        await supabase
                                          .from('challenges')
                                          .update({
                                            stream_embed_code: streamInput.trim(),
                                            is_streaming: true,
                                          })
                                          .eq('contract_address', addrParam)
                                        setChallenge((prev) => ({
                                          ...prev,
                                          streamUrl: streamInput.trim(),
                                        }))
                                        setShowStreamInput(false)
                                      } catch (e) {
                                        console.warn('Failed to save stream embed:', e)
                                      }
                                    }}
                                  >
                                    Save Stream
                                  </GamingButton>
                                  <GamingButton
                                    variant="shadow"
                                    onClick={() => {
                                      setShowStreamInput(false)
                                      setStreamInput('')
                                    }}
                                  >
                                    Cancel
                                  </GamingButton>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stream UI (only when stream is present) */}
                        {challenge.streamUrl && (
                          <>
                            <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 rounded-lg bg-red-500 px-2 py-1">
                                  <div className="h-2 w-2 rounded-full bg-white" />
                                  <span className="text-xs font-bold text-white">LIVE</span>
                                </div>
                                <GamingBadge variant="danger" size="sm">
                                  <Activity className="h-3 w-3" />
                                  {viewerCount}
                                </GamingBadge>
                              </div>

                              <div className="flex items-center gap-2">
                                <GamingButton variant="shadow" size="sm" className="p-2">
                                  {isMuted ? (
                                    <WifiOff className="h-4 w-4" />
                                  ) : (
                                    <Wifi className="h-4 w-4" />
                                  )}
                                </GamingButton>
                                <GamingButton variant="shadow" size="sm" className="p-2">
                                  <Settings className="h-4 w-4" />
                                </GamingButton>
                                <GamingButton variant="shadow" size="sm" className="p-2">
                                  <Maximize className="h-4 w-4" />
                                </GamingButton>
                              </div>
                            </div>

                            <div className="absolute right-4 bottom-4 left-4">
                              <div className="rounded-xl border border-white/10 bg-black/80 p-3 backdrop-blur-sm">
                                <div className="mb-2 flex items-center justify-between text-white">
                                  <span className="text-sm">00:00 / 45:00</span>
                                  <div className="flex items-center gap-3">
                                    <GamingBadge variant="mystic" size="sm">
                                      <Smartphone className="h-3 w-3" />
                                      Mobile
                                    </GamingBadge>
                                    <GamingBadge variant="victory" size="sm">
                                      <Flame className="h-3 w-3" />
                                      HD
                                    </GamingBadge>
                                  </div>
                                </div>
                                <div className="h-1 overflow-hidden rounded-full bg-gray-700">
                                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-1000" />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </GamingCard>

                  {/* Enhanced Rules */}
                  <GamingCard
                    variant="victory"
                    header={{
                      title: 'Battle Rules',
                      subtitle: 'Fair play guidelines',
                      icon: (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                          <Sword className="h-5 w-5 text-white" />
                        </div>
                      ),
                    }}
                  >
                    <div className="space-y-2">
                      {challenge.rules.map((rule, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-2"
                        >
                          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
                          <span className="text-sm text-gray-300">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </GamingCard>
                </div>
              </TabsContent>

              <TabsContent value="chat" className="mt-6">
                <GamingCard
                  variant="neon"
                  header={{
                    title: 'Battle Chat',
                    subtitle: 'Communicate with your opponent',
                    icon: (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                    ),
                  }}
                >
                  <ChatBox
                    address={params.address as string}
                    filterColumn="chat_address"
                    isConnected={isConnected}
                    viewerAddress={viewerAddress}
                  />
                </GamingCard>
              </TabsContent>

              <TabsContent value="onchain" className="mt-6">
                <GamingCard
                  variant="cosmic"
                  header={{
                    title: 'On-Chain Details',
                    subtitle: 'Smart contract information',
                    icon: (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                    ),
                  }}
                >
                  <div className="space-y-6">
                    {/* Contract Address */}
                    <div>
                      <p className="mb-3 text-sm text-gray-400">Game Contract Address</p>
                      <div className="relative rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-gray-800/60 to-black p-6">
                        <div className="mb-3">
                          <p className="font-mono text-2xl font-semibold tracking-wide text-indigo-300 text-center">
                            {shortenAddress(challenge.game.contractAddress)}
                          </p>
                        </div>
                        {/* Side buttons flanking centered address */}
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <GamingButton
                            variant="mystic"
                            size="sm"
                            className="p-2"
                            title="Copy address"
                            aria-label="Copy contract address"
                            onClick={() => copyToClipboard(challenge.game.contractAddress)}
                          >
                            <Copy className="h-3 w-3" />
                          </GamingButton>
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <GamingButton
                            variant="cosmic"
                            size="sm"
                            className="p-2"
                            title={showQrCode ? 'Hide QR' : 'Show QR'}
                            aria-label="Toggle QR code"
                            onClick={() => setShowQrCode((v) => !v)}
                          >
                            <QrCode className="h-3 w-3" />
                          </GamingButton>
                        </div>
                        {showQrCode && (
                          <div className="mt-4 flex justify-center">
                            <div className="h-32 w-32 rounded-lg bg-white p-2 shadow-lg shadow-indigo-500/20">
                              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded bg-gray-200">
                                <img
                                  alt="Contract address QR"
                                  className="h-full w-full object-contain"
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(challenge.game.contractAddress)}`}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GamingCard>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Enhanced Actions & Info */}
          <div className="space-y-6">
            {/* Enhanced Action Buttons */}
            <GamingCard
              variant="power"
              header={{
                title: 'Moderator Actions',
                subtitle: 'Control this challenge as a mod',
                icon: (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                    <Gamepad2 className="h-5 w-5 text-white" />
                  </div>
                ),
              }}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-6">
                <GamingButton
                  variant="victory"
                  className="w-full"
                  onClick={() => setShowReportModal(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Score
                </GamingButton>

                <GamingButton variant="danger" className="w-full" onClick={handleCancelChallenge}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Cancel
                </GamingButton>
              </div>
            </GamingCard>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReportScoreModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={handleReportScore}
      />

      <ConfirmScoreModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmScore}
        onReject={handleRejectScore}
      />

      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onDispute={handleFileDispute}
      />
    </div>
  )
}

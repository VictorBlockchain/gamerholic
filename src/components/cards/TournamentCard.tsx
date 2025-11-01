'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Trophy, 
  Users, 
  Clock, 
  DollarSign, 
  Ticket, 
  Calendar,
  Gamepad2,
  Monitor,
  Eye,
  ChevronRight,
  AlertCircle,
  XCircle
} from 'lucide-react'

type UiStatus = 'ACTIVE' | 'STARTED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'

interface TournamentCardProps {
  tournament: {
    id: string
    game: {
      name: string
      console: string
      image: string
    }
    type: 'bracket' | 'free-for-all' | '1v1' | 'teams'
    entryFee: {
      sei: number
      gamer: number
    }
    players: {
      current: number
      max: number
    }
    nftRequired?: number
    startDate: string
    host: string
    status: UiStatus
    prize?: number
  }
  onViewTournament: (id: string) => void
}

const typeConfig = {
  bracket: {
    label: 'Bracket',
    variant: 'victory' as const,
    icon: '🏆',
    description: 'Elimination bracket'
  },
  'free-for-all': {
    label: 'Free For All',
    variant: 'power' as const,
    icon: '⚔️',
    description: 'Everyone vs Everyone'
  },
  '1v1': {
    label: '1 v 1',
    variant: 'mystic' as const,
    icon: '👥',
    description: 'Head to Head'
  },
  teams: {
    label: 'Teams',
    variant: 'cosmic' as const,
    icon: '👨‍👩‍👧‍👦',
    description: 'Team Battle'
  }
}

const statusConfig: Record<UiStatus, { label: string; icon: any }> = {
  ACTIVE: { label: 'Active', icon: Users },
  STARTED: { label: 'Live', icon: Trophy },
  COMPLETED: { label: 'Completed', icon: Trophy },
  DISPUTED: { label: 'Disputed', icon: AlertCircle },
  CANCELLED: { label: 'Cancelled', icon: XCircle },
}

// Deterministic palette selection based on status and id
const hashToIndex = (str: string, mod: number) => {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h % mod
}

const statusPalettes: Record<UiStatus, Array<{
  header: string
  statusBar: string
  badgeBg: string
  badgeText: string
  button: string
  shadow: string
  cardBorder: string
}>> = {
  ACTIVE: [
    {
      header: 'bg-gradient-to-br from-green-500 to-emerald-600',
      statusBar: 'bg-green-500',
      badgeBg: 'bg-green-500/10 border border-green-500/30',
      badgeText: 'text-green-400',
      button:
        'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white',
      shadow: 'shadow-green-500/25 hover:shadow-green-500/40',
      cardBorder: 'border-green-500/30',
    },
    {
      header: 'bg-gradient-to-br from-emerald-500 to-lime-600',
      statusBar: 'bg-emerald-500',
      badgeBg: 'bg-emerald-500/10 border border-emerald-500/30',
      badgeText: 'text-emerald-400',
      button:
        'bg-gradient-to-r from-emerald-500 to-lime-600 hover:from-emerald-600 hover:to-lime-700 text-white',
      shadow: 'shadow-emerald-500/25 hover:shadow-emerald-500/40',
      cardBorder: 'border-emerald-500/30',
    },
  ],
  STARTED: [
    {
      header: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      statusBar: 'bg-blue-500',
      badgeBg: 'bg-blue-500/10 border border-blue-500/30',
      badgeText: 'text-blue-400',
      button:
        'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white',
      shadow: 'shadow-blue-500/25 hover:shadow-blue-500/40',
      cardBorder: 'border-blue-500/30',
    },
    {
      header: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      statusBar: 'bg-cyan-500',
      badgeBg: 'bg-cyan-500/10 border border-cyan-500/30',
      badgeText: 'text-cyan-400',
      button:
        'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white',
      shadow: 'shadow-cyan-500/25 hover:shadow-cyan-500/40',
      cardBorder: 'border-cyan-500/30',
    },
  ],
  COMPLETED: [
    {
      header: 'bg-gradient-to-br from-gray-500 to-gray-700',
      statusBar: 'bg-gray-500',
      badgeBg: 'bg-gray-500/10 border border-gray-500/30',
      badgeText: 'text-gray-400',
      button:
        'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white',
      shadow: 'shadow-gray-500/25 hover:shadow-gray-500/40',
      cardBorder: 'border-gray-500/30',
    },
    {
      header: 'bg-gradient-to-br from-slate-500 to-slate-700',
      statusBar: 'bg-slate-500',
      badgeBg: 'bg-slate-500/10 border border-slate-500/30',
      badgeText: 'text-slate-400',
      button:
        'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white',
      shadow: 'shadow-slate-500/25 hover:shadow-slate-500/40',
      cardBorder: 'border-slate-500/30',
    },
  ],
  DISPUTED: [
    {
      header: 'bg-gradient-to-br from-amber-500 to-orange-600',
      statusBar: 'bg-amber-500',
      badgeBg: 'bg-amber-500/10 border border-amber-500/30',
      badgeText: 'text-amber-400',
      button:
        'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white',
      shadow: 'shadow-amber-500/25 hover:shadow-amber-500/40',
      cardBorder: 'border-amber-500/30',
    },
    {
      header: 'bg-gradient-to-br from-yellow-500 to-amber-600',
      statusBar: 'bg-yellow-500',
      badgeBg: 'bg-yellow-500/10 border border-yellow-500/30',
      badgeText: 'text-yellow-300',
      button:
        'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white',
      shadow: 'shadow-yellow-500/25 hover:shadow-yellow-500/40',
      cardBorder: 'border-yellow-500/30',
    },
  ],
  CANCELLED: [
    {
      header: 'bg-gradient-to-br from-red-500 to-rose-600',
      statusBar: 'bg-red-500',
      badgeBg: 'bg-red-500/10 border border-red-500/30',
      badgeText: 'text-red-400',
      button:
        'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white',
      shadow: 'shadow-red-500/25 hover:shadow-red-500/40',
      cardBorder: 'border-red-500/30',
    },
    {
      header: 'bg-gradient-to-br from-rose-500 to-pink-600',
      statusBar: 'bg-rose-500',
      badgeBg: 'bg-rose-500/10 border border-rose-500/30',
      badgeText: 'text-rose-400',
      button:
        'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white',
      shadow: 'shadow-rose-500/25 hover:shadow-rose-500/40',
      cardBorder: 'border-rose-500/30',
    },
  ],
}

export default function TournamentCard({ tournament, onViewTournament }: TournamentCardProps) {
  const router = useRouter()
  const typeInfo = typeConfig[tournament.type]
  const statusInfo = statusConfig[tournament.status]
  
  const playerPercentage = (tournament.players.current / tournament.players.max) * 100
  
  const handleCardClick = () => {
    router.push(`/tournaments/${tournament.id}`)
  }

  const palettes = statusPalettes[tournament.status] || statusPalettes['ACTIVE']
  const palette = palettes[hashToIndex(tournament.id, palettes.length)]

  return (
    <div className={`group relative overflow-hidden rounded-2xl border ${palette.cardBorder} bg-gradient-to-br from-gray-900 via-gray-900 to-black hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer`} onClick={handleCardClick}>
      
      {/* Animated Status Bar */}
      <div className={`h-1 ${palette.statusBar} transition-all duration-300 group-hover:h-1.5 animate-pulse`} />
      
      <div className="p-3 sm:p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg ${palette.header} shadow-lg flex-shrink-0`}
            >
              <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                {tournament.game.name}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                <Monitor className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="truncate">{tournament.game.console}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${palette.badgeBg} scale-75 sm:scale-100`}>
              <statusInfo.icon className={`h-2 w-2 sm:h-3 sm:w-3 ${palette.badgeText}`} />
              <span className={`hidden sm:inline text-xs font-medium ${palette.badgeText}`}>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Tournament Type */}
        <div className="mb-3">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${
            typeInfo.variant === 'victory' ? 'bg-green-500/10 border-green-500/30' :
            typeInfo.variant === 'power' ? 'bg-purple-500/10 border-purple-500/30' :
            typeInfo.variant === 'mystic' ? 'bg-cyan-500/10 border-cyan-500/30' :
            typeInfo.variant === 'cosmic' ? 'bg-violet-500/10 border-violet-500/30' :
            'bg-gray-500/10 border-gray-500/30'
          } mb-1`}>
            <span className="text-xs">{typeInfo.icon}</span>
            <span className="text-xs font-medium text-white">{typeInfo.label}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">{typeInfo.description}</p>
        </div>

        {/* Players Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-300">
                <span className="text-white font-bold">{tournament.players.current}/{tournament.players.max}</span>
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400">{Math.round(playerPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r transition-all duration-500 ${
                typeInfo.variant === 'victory' ? 'from-amber-500 to-orange-600' :
                typeInfo.variant === 'power' ? 'from-purple-500 to-pink-600' :
                typeInfo.variant === 'mystic' ? 'from-cyan-500 to-blue-600' :
                'from-violet-500 to-fuchsia-600'
              }`}
              style={{ width: `${playerPercentage}%` }}
            />
          </div>
        </div>

        {/* Entry Fee */}
        <div className="mb-3">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300 mb-1">
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Entry:</span>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <div className="flex-1 bg-gray-800/50 rounded-lg p-1.5 sm:p-2 text-center">
              <p className="text-[8px] sm:text-xs text-gray-400">SEI</p>
              <p className="text-xs sm:text-sm font-bold text-amber-400">{tournament.entryFee.sei}</p>
            </div>
            <div className="flex-1 bg-gray-800/50 rounded-lg p-1.5 sm:p-2 text-center">
              <p className="text-[8px] sm:text-xs text-gray-400">GAMER</p>
              <p className="text-xs sm:text-sm font-bold text-purple-400">{tournament.entryFee.gamer}</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-3 text-[10px] sm:text-xs">
          {tournament.nftRequired && (
            <div className="flex items-center gap-1 text-gray-400">
              <Ticket className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
              <span className="truncate">NFT #{tournament.nftRequired}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-400">
            <Calendar className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
            <span className="truncate">{tournament.startDate}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <span>Host:</span>
            <span className="text-amber-400 font-mono truncate">
              {tournament.host.slice(0, 6)}...{tournament.host.slice(-4)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button
            className={`w-full group-hover:scale-105 transition-transform text-xs sm:text-sm rounded-xl font-medium px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-center gap-1 sm:gap-2 ${palette.button} shadow-lg ${palette.shadow}`}
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/tournaments/${tournament.id}`)
            }}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">View Tournament</span>
            <span className="sm:hidden">View</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
          </button>
        </div>
      </div>
    </div>
  )
}
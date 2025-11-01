'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  Gamepad2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  User,
  ExternalLink,
  Star,
  TrendingUp,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

interface ChallengeCardProps {
  id: string
  challenger: {
    id: string
    username: string
    avatar: string
    level: number
    winRate?: number
    isVerified?: boolean
    score?: number
  }
  opponent: {
    id: string
    username: string
    avatar: string
    level: number
    winRate?: number
    isVerified?: boolean
    score?: number
  }
  game: {
    name: string
    console: string
    icon?: string
  }
  amount: {
    sei: number
    gamer: number
  }
  status: 'sent' | 'accepted' | 'scored' | 'score_confirm_pending' | 'in_dispute' | 'completed' | 'canceled'
  rules: string[]
  createdAt: string
  winner?: 'challenger' | 'opponent'
  onViewChallenge: (id: string) => void
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
    button:
      'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]'
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: CheckCircle,
    glow: 'shadow-green-500/20',
    button:
      'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]'
  },
  scored: {
    label: 'Scored',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: Trophy,
    glow: 'shadow-yellow-500/20',
    button:
      'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]'
  },
  score_confirm_pending: {
    label: 'Pending',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: AlertCircle,
    glow: 'shadow-orange-500/20',
    button:
      'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]'
  },
  in_dispute: {
    label: 'Dispute',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: XCircle,
    glow: 'shadow-red-500/20',
    button:
      'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]'
  },
  completed: {
    label: 'Completed',
    color: 'bg-purple-500',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    icon: Trophy,
    glow: 'shadow-purple-500/20',
    button:
      'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]'
  },
  canceled: {
    label: 'Canceled',
    color: 'bg-gray-500',
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    icon: XCircle,
    glow: 'shadow-gray-500/20',
    button:
      'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold shadow-lg shadow-gray-500/25 hover:shadow-gray-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]'
  }
}

export default function ChallengeCard({
  id,
  challenger,
  opponent,
  game,
  amount,
  status,
  rules,
  createdAt,
  winner,
  onViewChallenge
}: ChallengeCardProps) {
  const router = useRouter()
  const [showRules, setShowRules] = useState(false)
  const statusInfo = statusConfig[status]
  const StatusIcon = statusInfo.icon

  const handleViewChallenge = () => {
    router.push(`/challenges/${id}`)
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98]">
      
      {/* Animated Status Bar */}
      <div className={`h-1 ${statusInfo.color} transition-all duration-300 group-hover:h-1.5 animate-pulse`} />
      
      <div className="p-3 sm:p-4">
        
        {/* Header with Game Info */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          
          {/* Game Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex-shrink-0">
              <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white text-xs sm:text-sm truncate">{game.name}</h3>
              <p className="text-xs text-gray-400 truncate">{game.console}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border flex-shrink-0`}>
            <StatusIcon className={`h-3 w-3 ${statusInfo.textColor}`} />
            <span className={`text-xs font-medium ${statusInfo.textColor} hidden sm:inline`}>{statusInfo.label}</span>
          </div>
        </div>

        {/* VS Battle Section - Horizontal Scroll on Mobile */}
        <div className="mb-3 sm:mb-4">
          {/* Mobile: Horizontal scroll */}
          <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-1 px-1">
            <div className="flex items-center gap-3 min-w-max pb-2">
              {/* Challenger */}
              <div className="flex-shrink-0 text-center">
                <div className="relative inline-block">
                  <Avatar className="h-12 w-12 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20">
                    <AvatarImage src={challenger.avatar} alt={challenger.username} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xs">
                      {challenger.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-[8px] font-bold text-white shadow-lg">
                    {challenger.level}
                  </div>
                  {challenger.isVerified && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-2 w-2 text-white" />
                    </div>
                  )}
                  {/* Winner Crown for Completed Challenges */}
                  {status === 'completed' && winner === 'challenger' && (
                    <div className="absolute -top-2 -left-1 text-yellow-400 text-lg animate-pulse">
                      👑
                    </div>
                  )}
                </div>
                <p className="mt-1 font-medium text-white text-xs truncate max-w-[80px]">{challenger.username}</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  {challenger.winRate && (
                    <span className="text-xs text-gray-400">{challenger.winRate}%</span>
                  )}
                  <div className="flex">
                    {[...Array(1)].map((_, i) => (
                      <Star key={i} className="h-2 w-2 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                {/* Score Display for Completed Challenges */}
                {status === 'completed' && challenger.score !== undefined && (
                  <div className={`mt-1 text-xs font-bold ${
                    winner === 'challenger' ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {challenger.score} pts
                  </div>
                )}
              </div>

              {/* VS */}
              <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full blur-md opacity-50 animate-pulse" />
                  <div className="relative h-8 w-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-xs">VS</span>
                  </div>
                </div>
              </div>

              {/* Opponent */}
              <div className="flex-shrink-0 text-center">
                <div className="relative inline-block">
                  <Avatar className="h-12 w-12 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20">
                    <AvatarImage src={opponent.avatar} alt={opponent.username} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold text-xs">
                      {opponent.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-[8px] font-bold text-white shadow-lg">
                    {opponent.level}
                  </div>
                  {opponent.isVerified && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-2 w-2 text-white" />
                    </div>
                  )}
                  {/* Winner Crown for Completed Challenges */}
                  {status === 'completed' && winner === 'opponent' && (
                    <div className="absolute -top-2 -left-1 text-yellow-400 text-lg animate-pulse">
                      👑
                    </div>
                  )}
                </div>
                <p className="mt-1 font-medium text-white text-xs truncate max-w-[80px]">{opponent.username}</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  {opponent.winRate && (
                    <span className="text-xs text-gray-400">{opponent.winRate}%</span>
                  )}
                  <div className="flex">
                    {[...Array(1)].map((_, i) => (
                      <Star key={i} className="h-2 w-2 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                {/* Score Display for Completed Challenges */}
                {status === 'completed' && opponent.score !== undefined && (
                  <div className={`mt-1 text-xs font-bold ${
                    winner === 'opponent' ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {opponent.score} pts
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop/Tablet: Normal Layout */}
          <div className="hidden sm:flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Challenger */}
            <div className="flex-1 text-center">
              <div className="relative inline-block">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20">
                  <AvatarImage src={challenger.avatar} alt={challenger.username} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xs">
                    {challenger.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-[8px] sm:text-xs font-bold text-white shadow-lg">
                  {challenger.level}
                </div>
                {challenger.isVerified && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-2 w-2 text-white" />
                  </div>
                )}
                {/* Winner Crown for Completed Challenges */}
                {status === 'completed' && winner === 'challenger' && (
                  <div className="absolute -top-2 -left-1 text-yellow-400 text-lg animate-pulse">
                    👑
                  </div>
                )}
              </div>
              <p className="mt-1 font-medium text-white text-xs sm:text-sm truncate max-w-full">{challenger.username}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                {challenger.winRate && (
                  <span className="text-xs text-gray-400">{challenger.winRate}%</span>
                )}
                <div className="flex">
                  {[...Array(1)].map((_, i) => (
                    <Star key={i} className="h-2 w-2 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              {/* Score Display for Completed Challenges */}
              {status === 'completed' && challenger.score !== undefined && (
                <div className={`mt-1 text-xs font-bold ${
                  winner === 'challenger' ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {challenger.score} pts
                </div>
              )}
            </div>

            {/* VS */}
            <div className="flex flex-col items-center justify-center px-1 sm:px-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full blur-md opacity-50 animate-pulse" />
                <div className="relative h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-[8px] sm:text-xs">VS</span>
                </div>
              </div>
            </div>

            {/* Opponent */}
            <div className="flex-1 text-center">
              <div className="relative inline-block">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20">
                  <AvatarImage src={opponent.avatar} alt={opponent.username} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold text-xs">
                    {opponent.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-[8px] sm:text-xs font-bold text-white shadow-lg">
                  {opponent.level}
                </div>
                {opponent.isVerified && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-2 w-2 text-white" />
                  </div>
                )}
                {/* Winner Crown for Completed Challenges */}
                {status === 'completed' && winner === 'opponent' && (
                  <div className="absolute -top-2 -left-1 text-yellow-400 text-lg animate-pulse">
                    👑
                  </div>
                )}
              </div>
              <p className="mt-1 font-medium text-white text-xs sm:text-sm truncate max-w-full">{opponent.username}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                {opponent.winRate && (
                  <span className="text-xs text-gray-400">{opponent.winRate}%</span>
                )}
                <div className="flex">
                  {[...Array(1)].map((_, i) => (
                    <Star key={i} className="h-2 w-2 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              {/* Score Display for Completed Challenges */}
              {status === 'completed' && opponent.score !== undefined && (
                <div className={`mt-1 text-xs font-bold ${
                  winner === 'opponent' ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {opponent.score} pts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prize Pool */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-amber-400">
                <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-[8px] sm:text-xs font-bold text-white">S</span>
                </div>
                <span className="font-bold text-sm sm:text-base">{amount.sei}</span>
              </div>
              <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5">SEI</p>
            </div>
            <div className="text-gray-600 text-sm sm:text-base">+</div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-purple-400">
                <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                  <span className="text-[8px] sm:text-xs font-bold text-white">G</span>
                </div>
                <span className="font-bold text-sm sm:text-base">{amount.gamer}</span>
              </div>
              <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5">GAMER</p>
            </div>
          </div>
        </div>

        {/* Rules Section - Compact */}
        <div className="mb-3 sm:mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRules(!showRules)}
            className="w-full justify-between text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors h-6 sm:h-8 px-2"
          >
            <span className="text-xs font-medium">Rules ({rules.length})</span>
            {showRules ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          
          {showRules && (
            <div className="mt-2 p-2 rounded-lg bg-gray-800/50 border border-gray-700">
              <ul className="space-y-1">
                {rules.slice(0, 3).map((rule, index) => (
                  <li key={index} className="flex items-start gap-1.5 text-[10px] sm:text-xs text-gray-300">
                    <div className="h-1 w-1 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                    <span className="line-clamp-1">{rule}</span>
                  </li>
                ))}
                {rules.length > 3 && (
                  <li className="text-[10px] sm:text-xs text-gray-500 italic">
                    +{rules.length - 3} more rules...
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={handleViewChallenge}
          className={`w-full h-8 sm:h-10 text-xs sm:text-sm ${statusInfo.button}`}
        >
          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          View Challenge
        </Button>

        {/* Quick Stats */}
        <div className="mt-2 flex items-center justify-between text-[8px] sm:text-xs text-gray-500">
          <span>{new Date(createdAt).toISOString().slice(0, 10)}</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-2 w-2" />
            <span>Hot</span>
          </div>
        </div>
      </div>
    </div>
  )
}
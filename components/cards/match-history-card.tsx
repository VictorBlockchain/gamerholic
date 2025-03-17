"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Trophy, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface MatchResult {
  id: string
  game: string
  gameIcon?: string
  opponent: string
  date: string
  result: "win" | "loss" | "draw"
  score?: string
  reward?: string
}

interface MatchHistoryCardProps {
  title: string
  matches: MatchResult[]
  className?: string
  onViewAll?: () => void
}

export function MatchHistoryCard({ title, matches, className, onViewAll }: MatchHistoryCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="text-gray-400 hover:text-white">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {matches.map((match) => (
            <div
              key={match.id}
              className="p-3 bg-black/30 rounded-lg border border-[#222] hover:border-[#333] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {match.gameIcon ? (
                    <Image
                      src={match.gameIcon || "/placeholder.svg"}
                      alt={match.game}
                      width={20}
                      height={20}
                      className="rounded-sm"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-[#222] rounded-sm flex items-center justify-center">
                      <span className="text-xs">G</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-400">{match.game}</span>
                </div>
                <Badge
                  className={cn(
                    "px-2 py-0.5 text-xs",
                    match.result === "win"
                      ? "bg-[#00FFA9] text-black"
                      : match.result === "loss"
                        ? "bg-[#FF007A] text-white"
                        : "bg-[#333] text-gray-300",
                  )}
                >
                  {match.result.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-sm">vs {match.opponent}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{match.date}</span>
                  </div>
                </div>

                <div className="text-right">
                  {match.score && <div className="text-sm font-medium mb-1">{match.score}</div>}
                  {match.reward && match.result === "win" && (
                    <div className="flex items-center gap-1 text-xs text-[#FFD600]">
                      <Trophy className="w-3 h-3" />
                      <span>{match.reward}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { cn } from "@/lib/utils"
import { Trophy, Users, Clock } from "lucide-react"

interface MatchParticipant {
  id: string
  name: string
  avatar?: string
  avatarFallback: string
  score?: number
  isWinner?: boolean
}

interface Match {
  id: string
  round: number
  position: number
  participants: MatchParticipant[]
  status: "upcoming" | "live" | "completed"
  startTime?: string
  viewerCount?: number
}

interface TournamentBracketProps {
  matches: Match[]
  className?: string
  isMobile?: boolean
}

export function TournamentBracket({ matches, className, isMobile = false }: TournamentBracketProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  // Group matches by round
  const roundsMap = matches.reduce(
    (acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = []
      }
      acc[match.round].push(match)
      return acc
    },
    {} as Record<number, Match[]>,
  )

  const rounds = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      {isMobile ? (
        // Mobile view - vertical list of matches
        <div className="space-y-4">
          {matches.map((match, index) => (
            <ScrollReveal key={match.id} delay={index * 50}>
              <Card
                className={cn(
                  "bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden",
                  selectedMatch?.id === match.id && "border-[#00FFA9]",
                )}
                onClick={() => setSelectedMatch(match)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <Badge
                      className={
                        match.status === "live"
                          ? "bg-[#00FFA9] text-black"
                          : match.status === "upcoming"
                            ? "bg-[#FFD600] text-black"
                            : "bg-[#333] text-white"
                      }
                    >
                      {match.status === "live" ? "LIVE" : match.status === "upcoming" ? "UPCOMING" : "COMPLETED"}
                    </Badge>
                    <div className="text-xs text-gray-400">
                      Round {match.round} • Match {match.position}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {match.participants.map((participant, i) => (
                      <div
                        key={participant.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg",
                          participant.isWinner ? "bg-[#00FFA9]/10 border border-[#00FFA9]/30" : "bg-black/30",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {participant.avatar && <AvatarImage src={participant.avatar} alt={participant.name} />}
                            <AvatarFallback className="bg-[#222] text-[10px]">
                              {participant.avatarFallback}
                            </AvatarFallback>
                          </Avatar>
                          <span className={cn("text-sm", participant.isWinner && "font-bold text-[#00FFA9]")}>
                            {participant.name}
                          </span>
                        </div>
                        {participant.score !== undefined && (
                          <span className={cn("text-sm font-bold", participant.isWinner && "text-[#00FFA9]")}>
                            {participant.score}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {match.status === "upcoming" && match.startTime && (
                    <div className="flex items-center justify-center mt-3 text-xs text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Starts {match.startTime}</span>
                    </div>
                  )}

                  {match.status === "live" && match.viewerCount && (
                    <div className="flex items-center justify-center mt-3 text-xs text-[#FF007A]">
                      <Users className="w-3 h-3 mr-1" />
                      <span>{match.viewerCount.toLocaleString()} watching</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      ) : (
        // Desktop view - horizontal bracket
        <div className="flex space-x-8 min-w-max pb-4">
          {rounds.map((round) => (
            <div key={round} className="flex flex-col space-y-4 min-w-[280px]">
              <div className="text-center mb-2">
                <Badge className="bg-[#222] text-white">
                  {round === Math.max(...rounds) ? "Finals" : `Round ${round}`}
                </Badge>
              </div>

              {roundsMap[round].map((match) => (
                <Card
                  key={match.id}
                  className={cn(
                    "bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden hover:border-[#555] transition-all",
                    selectedMatch?.id === match.id && "border-[#00FFA9]",
                  )}
                  onClick={() => setSelectedMatch(match)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <Badge
                        className={
                          match.status === "live"
                            ? "bg-[#00FFA9] text-black"
                            : match.status === "upcoming"
                              ? "bg-[#FFD600] text-black"
                              : "bg-[#333] text-white"
                        }
                      >
                        {match.status === "live" ? "LIVE" : match.status === "upcoming" ? "UPCOMING" : "COMPLETED"}
                      </Badge>
                      <div className="text-xs text-gray-400">Match {match.position}</div>
                    </div>

                    <div className="space-y-3">
                      {match.participants.map((participant) => (
                        <div
                          key={participant.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            participant.isWinner ? "bg-[#00FFA9]/10 border border-[#00FFA9]/30" : "bg-black/30",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              {participant.avatar && <AvatarImage src={participant.avatar} alt={participant.name} />}
                              <AvatarFallback className="bg-[#222]">{participant.avatarFallback}</AvatarFallback>
                            </Avatar>
                            <span className={cn("font-medium", participant.isWinner && "font-bold text-[#00FFA9]")}>
                              {participant.name}
                            </span>
                          </div>
                          {participant.score !== undefined && (
                            <span className={cn("text-lg font-bold", participant.isWinner && "text-[#00FFA9]")}>
                              {participant.score}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {match.status === "upcoming" && match.startTime && (
                      <div className="flex items-center justify-center mt-3 text-sm text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>Starts {match.startTime}</span>
                      </div>
                    )}

                    {match.status === "live" && match.viewerCount && (
                      <div className="flex items-center justify-center mt-3 text-sm text-[#FF007A]">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{match.viewerCount.toLocaleString()} watching</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}

          {/* Trophy for the winner */}
          {rounds.length > 0 && (
            <div className="flex items-center justify-center min-w-[100px]">
              <div className="w-16 h-16 rounded-full bg-[#FFD600]/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-[#FFD600]" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


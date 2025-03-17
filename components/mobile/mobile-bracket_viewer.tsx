"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchTeam {
  name: string
  score?: number
}

interface BracketMatch {
  team1: MatchTeam
  team2: MatchTeam
  winner?: "team1" | "team2" | null
  completed: boolean
}

interface BracketRound {
  name: string
  matches: BracketMatch[]
}

interface MobileBracketViewerProps {
  tournamentName: string
  rounds: BracketRound[]
  className?: string
}

export function MobileBracketViewer({ tournamentName, rounds, className }: MobileBracketViewerProps) {
  const [currentRound, setCurrentRound] = useState(0)

  const nextRound = () => {
    if (currentRound < rounds.length - 1) {
      setCurrentRound(currentRound + 1)
    }
  }

  const prevRound = () => {
    if (currentRound > 0) {
      setCurrentRound(currentRound - 1)
    }
  }

  return (
    <Card className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{tournamentName} Bracket</CardTitle>
      </CardHeader>

      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={prevRound}
            disabled={currentRound === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="text-sm font-medium">{rounds[currentRound].name}</h3>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={nextRound}
            disabled={currentRound === rounds.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {rounds[currentRound].matches.map((match, index) => (
            <div key={index} className="p-3 bg-black/30 rounded-xl border border-[#333]">
              <div className="flex flex-col gap-2">
                <div
                  className={cn(
                    "flex justify-between items-center p-2 rounded-lg",
                    match.winner === "team1" ? "bg-[#00FFA9]/10" : "bg-black/30",
                  )}
                >
                  <span className={cn("text-sm font-medium", match.winner === "team1" && "text-[#00FFA9]")}>
                    {match.team1.name}
                  </span>
                  {match.team1.score !== undefined && (
                    <span
                      className={cn("text-sm font-bold", match.winner === "team1" ? "text-[#00FFA9]" : "text-gray-400")}
                    >
                      {match.team1.score}
                    </span>
                  )}
                </div>

                <div
                  className={cn(
                    "flex justify-between items-center p-2 rounded-lg",
                    match.winner === "team2" ? "bg-[#00FFA9]/10" : "bg-black/30",
                  )}
                >
                  <span className={cn("text-sm font-medium", match.winner === "team2" && "text-[#00FFA9]")}>
                    {match.team2.name}
                  </span>
                  {match.team2.score !== undefined && (
                    <span
                      className={cn("text-sm font-bold", match.winner === "team2" ? "text-[#00FFA9]" : "text-gray-400")}
                    >
                      {match.team2.score}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <Badge className={match.completed ? "bg-[#00FFA9] text-black text-xs" : "bg-[#333] text-white text-xs"}>
                  {match.completed ? "COMPLETED" : "UPCOMING"}
                </Badge>

                <Button size="sm" className="h-7 text-xs rounded-full bg-[#333] hover:bg-[#444]">
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-4">
          <Tabs defaultValue={rounds[currentRound].name} className="w-full">
            <TabsList className="bg-[#111] border border-[#333] rounded-full p-1 h-8 w-auto mx-auto">
              {rounds.map((round, index) => (
                <TabsTrigger
                  key={index}
                  value={round.name}
                  className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1 px-3"
                  onClick={() => setCurrentRound(index)}
                >
                  {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}


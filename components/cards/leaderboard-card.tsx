"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Trophy, ChevronRight, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  rank: number
  name: string
  avatar?: string
  avatarFallback: string
  score: number
  change?: "up" | "down" | "none"
  highlight?: boolean
}

interface LeaderboardCardProps {
  title: string
  description?: string
  entries: LeaderboardEntry[]
  maxEntries?: number
  className?: string
  onViewAll?: () => void
}

export function LeaderboardCard({
  title,
  description,
  entries,
  maxEntries = 5,
  className,
  onViewAll,
}: LeaderboardCardProps) {
  const [visibleEntries, setVisibleEntries] = useState(maxEntries)

  const displayedEntries = entries.slice(0, visibleEntries)

  return (
    <Card className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FFD600]" />
            <CardTitle>{title}</CardTitle>
          </div>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="text-gray-400 hover:text-white">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayedEntries.map((entry) => (
            <div
              key={entry.rank}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-colors",
                entry.highlight ? "bg-[#00FFA9]/10 border border-[#00FFA9]/30" : "bg-black/30 hover:bg-black/50",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  {entry.rank <= 3 ? (
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold",
                        entry.rank === 1
                          ? "bg-[#FFD600] text-black"
                          : entry.rank === 2
                            ? "bg-[#C0C0C0] text-black"
                            : "bg-[#CD7F32] text-black",
                      )}
                    >
                      {entry.rank}
                    </div>
                  ) : (
                    <span className="text-gray-400">{entry.rank}</span>
                  )}
                </div>

                <Avatar className="h-8 w-8">
                  {entry.avatar && <AvatarImage src={entry.avatar} alt={entry.name} />}
                  <AvatarFallback className="bg-[#222] text-xs">{entry.avatarFallback}</AvatarFallback>
                </Avatar>

                <span className={entry.highlight ? "font-medium text-[#00FFA9]" : "font-medium"}>{entry.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold">{entry.score}</span>
                {entry.change && (
                  <div
                    className={cn(
                      "flex items-center",
                      entry.change === "up"
                        ? "text-[#00FFA9]"
                        : entry.change === "down"
                          ? "text-[#FF007A]"
                          : "text-gray-400",
                    )}
                  >
                    {entry.change === "up" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : entry.change === "down" ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {entries.length > visibleEntries && (
          <Button
            variant="ghost"
            className="w-full mt-4 text-gray-400 hover:text-white border border-[#333] rounded-lg"
            onClick={() => setVisibleEntries((prev) => prev + 5)}
          >
            Show More
          </Button>
        )}
      </CardContent>
    </Card>
  )
}


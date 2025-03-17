"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface TeamMember {
  id: string
  name: string
  role?: string
  avatar?: string
  avatarFallback: string
  status?: "online" | "offline" | "away" | "busy"
}

interface TeamCardProps {
  name: string
  logo?: string
  logoFallback: string
  description?: string
  members: TeamMember[]
  game?: string
  wins?: number
  losses?: number
  rank?: string | number
  className?: string
  onJoin?: () => void
  onViewDetails?: () => void
}

export function TeamCard({
  name,
  logo,
  logoFallback,
  description,
  members,
  game,
  wins,
  losses,
  rank,
  className,
  onJoin,
  onViewDetails,
}: TeamCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-[#333]">
            {logo ? <AvatarImage src={logo} alt={name} /> : null}
            <AvatarFallback className="bg-[#222] text-lg">{logoFallback}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{name}</CardTitle>
            {game && <p className="text-sm text-gray-400">{game}</p>}
          </div>
          {rank && (
            <Badge className="ml-auto bg-[#FFD600] text-black">
              {typeof rank === "number" ? `Rank #${rank}` : rank}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {description && <p className="text-sm text-gray-400">{description}</p>}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{members.length} Members</span>
          </div>

          {(wins !== undefined || losses !== undefined) && (
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#FFD600]" />
              <span className="text-sm">
                {wins !== undefined ? <span className="text-[#00FFA9]">{wins}W</span> : null}
                {wins !== undefined && losses !== undefined ? " / " : null}
                {losses !== undefined ? <span className="text-[#FF007A]">{losses}L</span> : null}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs text-gray-400 uppercase">Team Members</h4>
          <div className="grid grid-cols-1 gap-2">
            {members.slice(0, 4).map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {member.avatar ? <AvatarImage src={member.avatar} alt={member.name} /> : null}
                    <AvatarFallback className="bg-[#222] text-xs">{member.avatarFallback}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  {member.role && <span className="text-xs text-gray-400">{member.role}</span>}

                  {member.status && (
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        member.status === "online"
                          ? "bg-[#00FFA9]"
                          : member.status === "away"
                            ? "bg-[#FFD600]"
                            : member.status === "busy"
                              ? "bg-[#FF007A]"
                              : "bg-gray-500",
                      )}
                    />
                  )}
                </div>
              </div>
            ))}

            {members.length > 4 && (
              <div className="flex items-center justify-center p-2 bg-black/30 rounded-lg">
                <span className="text-xs text-gray-400">+{members.length - 4} more members</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {onJoin && (
            <Button
              className="flex-1 bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full"
              onClick={onJoin}
            >
              Join Team
            </Button>
          )}

          {onViewDetails && (
            <Button
              variant="outline"
              className="flex-1 border-[#333] text-white hover:bg-white/5 rounded-full"
              onClick={onViewDetails}
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


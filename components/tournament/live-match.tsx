"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { cn } from "@/lib/utils"
import { Users, MessageSquare, Share2, Heart, Trophy, Clock, ChevronRight, Flame, Shield, Zap } from "lucide-react"

interface Team {
  id: string
  name: string
  logo?: string
  logoFallback: string
  score: number
  players: {
    id: string
    name: string
    avatar?: string
    avatarFallback: string
    kills?: number
    deaths?: number
    assists?: number
  }[]
}

interface LiveMatchProps {
  matchId: string
  tournament: string
  game: string
  teams: Team[]
  viewerCount: number
  timeElapsed: string
  className?: string
  isMobile?: boolean
}

export function LiveMatch({
  matchId,
  tournament,
  game,
  teams,
  viewerCount,
  timeElapsed,
  className,
  isMobile = false,
}: LiveMatchProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(1243)
  const [commentCount, setCommentCount] = useState(356)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [matchTime, setMatchTime] = useState(timeElapsed)

  // Simulate match time progression
  useEffect(() => {
    const timer = setInterval(() => {
      // Parse the time (assuming format is MM:SS)
      const [minutes, seconds] = matchTime.split(":").map(Number)
      let newSeconds = seconds + 1
      let newMinutes = minutes

      if (newSeconds >= 60) {
        newSeconds = 0
        newMinutes += 1
      }

      setMatchTime(`${newMinutes.toString().padStart(2, "0")}:${newSeconds.toString().padStart(2, "0")}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [matchTime])

  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1)
    } else {
      setLikeCount((prev) => prev + 1)
    }
    setLiked(!liked)
  }

  const totalScore = teams.reduce((sum, team) => sum + team.score, 0)

  return (
    <div className={className}>
      {isMobile ? (
        // Mobile view
        <div className="space-y-4">
          <ScrollReveal>
            <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
              <div className="relative">
                <Image
                  src="/placeholder.svg?height=300&width=600"
                  alt={`${teams[0].name} vs ${teams[1].name}`}
                  width={600}
                  height={300}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                
                <div className="absolute top-2 left-2">
                  <Badge className="bg-[#00FFA9] text-black">LIVE</Badge>
                </div>
                
                <div className="absolute top-2 right-2">
                  <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10">
                    <Clock className="w-3 h-3 mr-1" /> {matchTime}
                  </Badge>
                </div>
                
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10">
                    <Flame className="w-3 h-3 mr-1 text-[#FF007A]" /> {viewerCount.toLocaleString()} Watching
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-400">{tournament}</p>
                  <p className="text-sm font-medium">{game}</p>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  {teams.map((team) => (
                    <div key={team.id} className="text-center">
                      <Avatar className="h-12 w-12 mx-auto mb-2 border-2 border-[#333]">
                        {team.logo && <AvatarImage src={team.logo} alt={team.name} />}
                        <AvatarFallback className="bg-[#222]">{team.logoFallback}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">{team.name}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold">{teams[0].score}</div>
                  <div className="text-xs text-gray-400">VS</div>
                  <div className="text-2xl font-bold">{teams[1].score}</div>
                </div>
                
                <Progress 
                  value={(teams[0].score / totalScore) * 100} 
                  className="h-2 bg-[#222] mb-4" 
                  indicatorClassName="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF]" 
                />
                
                <div className="flex justify-between">
                  <ButtonPressEffect>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full border-[#333]"
                      onClick={handleLike}
                    >
                      <Heart className={cn("w-4 h-4 mr-1", liked ? "fill-[#FF007A] text-[#FF007A]" : "")} />
                      {likeCount.toLocaleString()}
                    </Button>
                  </ButtonPressEffect>
                  
                  <ButtonPressEffect>
                    <Button variant="outline" size="sm" className="rounded-full border-[#333]">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {commentCount.toLocaleString()}
                    </Button>
                  </ButtonPressEffect>  />
                      {commentCount.toLocaleString()}
                    </Button>
                  </ButtonPressEffect>
                  
                  <ButtonPressEffect>
                    <Button variant="outline" size="sm" className="rounded-full border-[#333]">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </ButtonPressEffect>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
          
          <ScrollReveal
  delay={100}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold">Team Stats</h3>
              <Button variant="ghost" className="text-gray-400 p-0 h-auto text-xs">
                Details <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            
            <div
  className="space-y-3">
              {teams.map((team) => (
                <Card 
                  key={team.id} 
                  className={cn(
                    "bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden",
                    selectedTeam === team.id && "border-[#00FFA9]"
  )
}
onClick={() => setSelectedTeam(team.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8 border border-[#333]">
                        {team.logo && <AvatarImage src={team.logo} alt={team.name} />}
                        <AvatarFallback className="bg-[#222]">{team.logoFallback}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-bold">{team.name}</h4>
                        <p className="text-xs text-gray-400">{team.players.length} Players</p>
                      </div>
                      <div className="ml-auto text-xl font-bold">{team.score}</div>
                    </div>
                    
                    <div className="space-y-2">
                      {team.players.slice(0, 2).map((player) => (
                        <div key={player.id} className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {player.avatar && <AvatarImage src={player.avatar} alt={player.name} />}
                              <AvatarFallback className="bg-[#222] text-[10px]">{player.avatarFallback}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{player.name}</span>
                          </div>
                          <div className="text-xs">
                            {player.kills}/{player.deaths}/{player.assists}
                          </div>
                        </div>
                      ))}
                      
                      {team.players.length > 2 && (
                        <Button variant="ghost" size="sm" className="w-full text-xs text-gray-400">
                          View all players
                        </Button>
                      )}
                    </div>
                  </CardContent>
</Card>
              ))}
            </div>
          </ScrollReveal>
        </div>
      ) : (
        // Desktop view
        <div className="space-y-6">
          <ScrollReveal>
            <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden">
              <div className="relative">
                <Image
                  src="/placeholder.svg?height=600&width=1200"
                  alt=
{
  ;`${teams[0].name} vs ${teams[1].name}`
}
width={1200}
height={600}
className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                
                <div
className = "absolute top-4 left-4" > <Badge className="bg-[#00FFA9] text-black px-3 py-1">LIVE</Badge>
</div>
                
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/50 backdrop-blur-md text-white border-white/10 px-3 py-1">
                    <Clock className="w-4 h-4 mr-2" />
{
  matchTime
}
</Badge>
                </div>
                
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-black/50 backdrop-blur-md text-white border-white/10 px-3 py-1">
                    <Flame className="w-4 h-4 mr-2 text-[#FF007A]" />
{
  viewerCount.toLocaleString()
}
Watching
</Badge>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">
{
  tournament
}
</p>
;<p className="text-xl font-medium">{game}</p>
</div>
                    
                    <div className="flex gap-3">
                      <ButtonPressEffect>
                        <Button 
                          variant="outline" 
                          className="rounded-full border-white/20 bg-black/50 backdrop-blur-md"
                          onClick=
{
  handleLike
}
>
                          <Heart className=
{
  cn("w-4 h-4 mr-2", liked ? "fill-[#FF007A] text-[#FF007A]" : "")
}
;/>
{
  likeCount.toLocaleString()
}
</Button>
                      </ButtonPressEffect>
                      
                      <ButtonPressEffect>
                        <Button variant="outline" className="rounded-full border-white/20 bg-black/50 backdrop-blur-md">
                          <MessageSquare className="w-4 h-4 mr-2" />
{
  commentCount.toLocaleString()
}
</Button>
                      </ButtonPressEffect>
                      
                      <ButtonPressEffect>
                        <Button variant="outline" className="rounded-full border-white/20 bg-black/50 backdrop-blur-md">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </ButtonPressEffect>
                    </div>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
{
  teams.map((team, index) => (
    <div key={team.id} className="text-center flex-1">
      <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-[#333]">
        {team.logo && <AvatarImage src={team.logo} alt={team.name} />}
        <AvatarFallback className="bg-[#222] text-2xl">{team.logoFallback}</AvatarFallback>
      </Avatar>
      <p className="text-2xl font-bold mb-1">{team.name}</p>
      <p className="text-gray-400">{team.players.length} Players</p>
    </div>
  ))
}
</div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-6xl font-bold">
{
  teams[0].score
}
</div>
;(
  <div>
    <div className="text-xl text-gray-400 mb-2">VS</div>
    <Badge className="bg-[#FFD600] text-black">
      <Trophy className="w-3 h-3 mr-1" /> BEST OF 5
    </Badge>
  </div>
) < div
className="text-6xl font-bold">{teams[1].score}
</div>
</div>
                
                <Progress 
                  value=
{
  ;(teams[0].score / totalScore) * 100
}
className = "h-3 bg-[#222] mb-8"
indicatorClassName="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF]" 
                />
                
                <div className="grid grid-cols-2 gap-8">
                  {teams.map((team) => (
                    <div key={team.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">{team.name} Stats</h3>
                        <Badge 
                          className={
                            team.id === teams[0].id 
                              ? "bg-[#00FFA9]/20 text-[#00FFA9] border border-[#00FFA9]/30" 
                              : "bg-[#FF007A]/20 text-[#FF007A] border border-[#FF007A]/30"
                          }
                        >
                          Team {team.id === teams[0].id ? "A" : "B"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {team.players.map((player) => (
                          <div key={player.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {player.avatar && <AvatarImage src={player.avatar} alt={player.name} />}
                                <AvatarFallback className="bg-[#222]">{player.avatarFallback}</AvatarFallback>
                              </Avatar>
                              <span>{player.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <Zap className="w-4 h-4 text-[#00FFA9] mr-1" />
                                <span>{player.kills}</span>
                              </div>
                              <div className="flex items-center">
                                <Shield className="w-4 h-4 text-[#FF007A] mr-1" />
                                <span>{player.deaths}</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 text-[#FFD600] mr-1" />
                                <span>{player.assists}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
</CardContent>
            </Card>
          </ScrollReveal>
        </div>
      )}
    </div>
  )
}


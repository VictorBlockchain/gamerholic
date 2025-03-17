"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Filter, Search, Trophy, Users, Clock, ChevronRight, Flame, Zap, Plus } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { CreateTournamentForm } from "@/components/tournament/create-tournament-form"
import { CreateTeamForm } from "@/components/tournament/create-team-form"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDistanceToNow } from "date-fns"

interface Tournament {
  game_id: number
  title: string
  game: string
  console: string
  entry_fee: number
  prize_percentage: number
  first_place_percentage: number
  second_place_percentage: number
  third_place_percentage: number
  rules: string
  start_date: string
  money: number
  max_players: number
  image_url: string
  status: string
  host_id: string
  winner_take_all: boolean
  type: number
}

interface Team {
  id: string
  name: string
  console: string
  header_image: string
  creator_id: string
  created_at: string
}

interface TournamentsMobileProps {
  tournaments: Tournament[]
  teams: Team[]
  isLoading: boolean
}

export function TournamentsMobile({ tournaments, teams, isLoading }: TournamentsMobileProps) {
  const router = useRouter()
  const { isAuthenticated } = useUser()
  const [activeTab, setActiveTab] = useState("tournaments")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [swipePosition, setSwipePosition] = useState(0)
  const [touchStart, setTouchStart] = useState(0)

  // Filter tournaments based on active tab
  const filteredTournaments = tournaments
    .filter((tournament) => {
      if (statusFilter === "all") return true
      if (statusFilter === "live") return tournament.status === "in-progress"
      if (statusFilter === "upcoming") return tournament.status === "upcoming"
      if (statusFilter === "completed") return tournament.status === "completed"
      return true
    })
    .filter(
      (tournament) =>
        tournament.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tournament.game.toLowerCase().includes(searchQuery.toLowerCase()),
    )

  // Filter teams based on search query
  const filteredTeams = teams.filter((team) => team.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Featured tournaments
  const featuredTournaments = tournaments
    .filter((t) => t.status === "in-progress" || t.status === "upcoming")
    .slice(0, 3)

  // Handle touch events for carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchDelta = touchStart - e.touches[0].clientX
    setSwipePosition(Math.min(Math.max(-touchDelta, -100), 100))
  }

  const handleTouchEnd = () => {
    if (swipePosition > 50) {
      // Swipe left
      console.log("Swipe left")
    } else if (swipePosition < -50) {
      // Swipe right
      console.log("Swipe right")
    }
    setSwipePosition(0)
  }

  const openTournamentDetails = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setShowDialog(true)
  }

  const handleTournamentClick = (tournament: Tournament) => {
    router.push(`/tournaments/${tournament.game_id}`)
  }

  const handleTeamClick = (team: Team) => {
    router.push(`/teams/${team.id}`)
  }
  
  return (
    <>
      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-4 relative z-10">
        {/* Hero Section */}
        <section className="mb-8">
          <ScrollReveal>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF007A]/10 border border-[#FF007A]/20 text-[#FF007A] text-sm mb-4">
              <Trophy className="w-4 h-4 mr-2" />
              TOURNAMENTS & TEAMS
            </div>
            <h1 className="text-2xl font-bold mb-2">Compete & Win</h1>
            <p className="text-gray-400 text-sm mb-4">Join tournaments and win crypto prizes</p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="w-8 h-8 rounded-full bg-[#00FFA9]/20 flex items-center justify-center mb-2">
                    <Trophy className="w-4 h-4 text-[#00FFA9]" />
                  </div>
                  <p className="text-xs text-gray-400">ACTIVE</p>
                  <p className="text-xl font-bold">
                    <AnimatedCounter end={tournaments.filter((t) => t.status === "in-progress").length} />
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF007A]/20 flex items-center justify-center mb-2">
                    <Users className="w-4 h-4 text-[#FF007A]" />
                  </div>
                  <p className="text-xs text-gray-400">TEAMS</p>
                  <p className="text-xl font-bold">
                    <AnimatedCounter end={teams.length} />
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFD600]/20 flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4 text-[#FFD600]" />
                  </div>
                  <p className="text-xs text-gray-400">PRIZE POOL</p>
                  <p className="text-xl font-bold">
                    <AnimatedCounter
                      end={tournaments.reduce(
                        (acc, t) => acc + t.entry_fee * t.max_players * (t.prize_percentage / 100),
                        0,
                      )}
                      prefix="$"
                      suffix="k"
                    />
                  </p>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </section>
        
        {/* Tabs */}
        <section className="mb-6">
          <ScrollReveal>
            <Tabs defaultValue="tournaments" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-[#111] border border-[#333] rounded-full p-1">
                <TabsTrigger
                  value="tournaments"
                  className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                >
                  Tournaments
                </TabsTrigger>
                <TabsTrigger
                  value="teams"
                  className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                >
                  Teams
                </TabsTrigger>
                {isAuthenticated && (
                  <>
                    <TabsTrigger
                      value="create-tournament"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span className="sr-only">Create Tournament</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="create-team"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span className="sr-only">Create Team</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

                      {/* Tab Content */}
        <TabsContent value="tournaments" className={activeTab === "tournaments" ? "block" : "hidden"}>
          {/* Search */}
          <section className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search tournaments..."
                className="pl-10 bg-black/50 border-[#333] focus:border-[#00FFA9] rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </section>
          
          {/* Status Tabs */}
          <section className="mb-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-4 bg-[#111] border border-[#333] rounded-full p-1">
                <TabsTrigger
                  value="all"
                  className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="live"
                  className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                  onClick={() => setStatusFilter("live")}
                >
                  Live
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                  onClick={() => setStatusFilter("upcoming")}
                >
                  Register
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                  onClick={() => setStatusFilter("completed")}
                >
                  Completed
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </section>
          
          {/* Featured Tournament */}
          {featuredTournaments.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Featured Tournaments</h2>
                <Button variant="ghost" className="text-gray-400 p-0 h-auto">
                  See all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              <div
                className="relative overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(${swipePosition}px)` }}
                >
                  {featuredTournaments.map((tournament, index) => (
                    <ScrollReveal
                      key={tournament.game_id}
                      delay={index * 100}
                      className="w-full flex-shrink-0 pr-4 last:pr-0"
                    >
                      <Card
                        className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden"
                        onClick={() => handleTournamentClick(tournament)}
                      >
                        <div className="relative">
                          <Image
                            src={tournament.image_url || "/placeholder.svg?height=200&width=400"}
                            alt={tournament.title}
                            width={400}
                            height={200}
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                          <div className="absolute top-3 right-3">
                            <Badge
                              className={`${
                                tournament.status === "in-progress"
                                  ? "bg-[#00FFA9] text-black"
                                  : tournament.status === "upcoming"
                                    ? "bg-[#FFD600] text-black"
                                    : "bg-[#333] text-white"
                              } text-xs`}
                            >
                              {tournament.status === "in-progress"
                                ? "LIVE"
                                : tournament.status === "upcoming"
                                  ? "REGISTERING"
                                  : "COMPLETED"}
                            </Badge>
                          </div>
                          <div className="absolute bottom-3 left-3">
                            <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10 text-xs">
                              <Flame className="w-3 h-3 mr-1 text-[#FF007A]" /> {Math.floor(Math.random() * 1000) + 100}{" "}
                              Watching
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-bold mb-1">{tournament.title}</h3>
                          <p className="text-sm text-gray-400 mb-3">
                            {tournament.game} • 0/{tournament.max_players}
                          </p>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-400">PRIZE POOL</p>
                              <p className="text-base font-bold text-[#FFD600]">
                                {tournament.entry_fee * tournament.max_players * (tournament.prize_percentage / 100)}{" "}
                                {tournament.money === 1 ? "SOL" : "GAMER"}
                              </p>
                            </div>
                            <ButtonPressEffect>
                              <Button
                                className={`rounded-full px-4 py-1 h-8 ${
                                  tournament.status === "in-progress"
                                    ? "bg-[#00FFA9] hover:bg-[#00D48F] text-black"
                                    : tournament.status === "upcoming"
                                      ? "bg-[#FF007A] hover:bg-[#D60067] text-white"
                                      : "bg-[#333] hover:bg-[#444] text-white"
                                }`}
                              >
                                {tournament.status === "in-progress"
                                  ? "Join Now"
                                  : tournament.status === "upcoming"
                                    ? "Register"
                                    : "Results"}
                              </Button>
                            </ButtonPressEffect>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  ))}
                </div>
                
                {/* Pagination dots */}
                <div className="flex justify-center mt-4">
                  {featuredTournaments.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full mx-1 ${index === 0 ? "bg-[#00FFA9]" : "bg-[#333]"}`}
                    ></div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* All Tournaments */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">All Tournaments</h2>
              <Button variant="outline" size="sm" className="h-8 rounded-full border-[#333]">
                <Filter className="w-3 h-3 mr-1" /> Filter
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredTournaments.length > 0 ? (
              <div className="space-y-4">
                {filteredTournaments.map((tournament, index) => (
                  <ScrollReveal key={tournament.game_id} delay={index * 50} distance={20}>
                    <Card
                      className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden"
                      onClick={() => handleTournamentClick(tournament)}
                    >
                      <div className="flex">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={tournament.image_url || "/placeholder.svg?height=96&width=96"}
                            alt={tournament.title}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 right-1">
                            <Badge
                              className={`${
                                tournament.status === "in-progress"
                                  ? "bg-[#00FFA9] text-black"
                                  : tournament.status === "upcoming"
                                    ? "bg-[#FFD600] text-black"
                                    : "bg-[#333] text-white"
                              } text-[10px] px-1 py-0`}
                            >
                              {tournament.status === "in-progress"
                                ? "LIVE"
                                : tournament.status === "upcoming"
                                  ? "REGISTERING"
                                  : "COMPLETED"}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-3 flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-bold mb-1">{tournament.title}</h3>
                              <p className="text-xs text-gray-400">{tournament.game}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">PRIZE</p>
                              <p className="text-sm font-bold text-[#FFD600]">
                                {tournament.entry_fee * tournament.max_players * (tournament.prize_percentage / 100)}{" "}
                                {tournament.money === 1 ? "SOL" : "GAMER"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center text-xs text-gray-400">
                              <Users className="w-3 h-3 mr-1" />
                              <span>0/{tournament.max_players}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-400">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>{formatDistanceToNow(new Date(tournament.start_date), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No tournaments found</p>
                <Button
                  variant="outline"
                  className="mt-4 border-[#333] text-white hover:bg-white/5 rounded-full"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </section>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className={activeTab === "teams" ? "block" : "hidden"}>
          {/* Search */}
          <section className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search teams..."
                className="pl-10 bg-black/50 border-[#333] focus:border-[#00FFA9] rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </section>
          
          {/* Teams List */}
          <section>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredTeams.length > 0 ? (
              <div className="space-y-4">
                {filteredTeams.map((team, index) => (
                  <ScrollReveal key={team.id} delay={index * 50} distance={20}>
                    <Card
                      className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden"
                      onClick={() => handleTeamClick(team)}
                    >
                      <div className="relative h-32">
                        <Image
                          src={team.header_image || "/placeholder.svg?height=128&width=384"}
                          alt={team.name}
                          width={384}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                        <div className="absolute bottom-3 left-3">
                          <h3 className="text-lg font-bold">{team.name}</h3>
                          <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10 text-xs mt-1">
                            {team.console}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                          {formatDistanceToNow(new Date(team.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No teams found</p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    className="mt-4 border-[#333] text-white hover:bg-white/5 rounded-full"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </section>
        </TabsContent>
        
        {/* Create Tournament Tab */}
        <TabsContent value="create-tournament" className={activeTab === "create-tournament" ? "block" : "hidden"}>
          {isAuthenticated ? (
            <CreateTournamentForm />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">Please connect your wallet to create a tournament.</p>
              <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full">Connect Wallet</Button>
            </div>
          )}
        </TabsContent>

        {/* Create Team Tab */}
        <TabsContent value="create-team" className={activeTab === "create-team" ? "block" : "hidden"}>
          {isAuthenticated ? (
            <CreateTeamForm />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">Please connect your wallet to create a team.</p>
              <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full">Connect Wallet</Button>
            </div>
          )}
        </TabsContent>
            </Tabs>
          </ScrollReveal>
        </section>
        
      </main>

      {/* Tournament Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#111] border-[#333] rounded-xl max-w-[95%] p-4">
          {selectedTournament && (
            <>
              <DialogHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    className={`${
                      selectedTournament.status === "in-progress"
                        ? "bg-[#00FFA9] text-black"
                        : selectedTournament.status === "upcoming"
                          ? "bg-[#FFD600] text-black"
                          : "bg-[#333] text-white"
                    } text-xs`}
                  >
                    {selectedTournament.status === "in-progress"
                      ? "LIVE"
                      : selectedTournament.status === "upcoming"
                        ? "REGISTERING"
                        : "COMPLETED"}
                  </Badge>
                  <Badge className="bg-[#222] text-gray-300 text-xs">{selectedTournament.game}</Badge>
                </div>
                <DialogTitle className="text-xl">{selectedTournament.title}</DialogTitle>
                <DialogDescription className="text-sm">{selectedTournament.rules.slice(0, 100)}...</DialogDescription>
              </DialogHeader>

              <div className="relative rounded-lg overflow-hidden aspect-video mb-3">
                <Image
                  src={selectedTournament.image_url || "/placeholder.svg?height=225&width=400"}
                  alt={selectedTournament.title}
                  width={400}
                  height={225}
                  className="w-full h-full object-cover"
                />
                {selectedTournament.status === "in-progress" && (
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10">
                      <Flame className="w-3 h-3 mr-1 text-[#FF007A]" /> {Math.floor(Math.random() * 1000) + 100}{" "}
                      Watching
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-black/30 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">PRIZE POOL</p>
                  <p className="text-sm font-bold text-[#FFD600]">
                    {selectedTournament.entry_fee *
                      selectedTournament.max_players *
                      (selectedTournament.prize_percentage / 100)}{" "}
                    {selectedTournament.money === 1 ? "SOL" : "GAMER"}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">ENTRY FEE</p>
                  <p className="text-sm font-bold">
                    {selectedTournament.entry_fee} {selectedTournament.money === 1 ? "SOL" : "GAMER"}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">
                    {selectedTournament.status === "in-progress" ? "ENDS IN" : "STARTS IN"}
                  </p>
                  <p className="text-sm font-bold font-mono">
                    {formatDistanceToNow(new Date(selectedTournament.start_date), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold">Tournament Details</h3>
                  <Badge className="bg-[#222] text-gray-300 text-xs">0/{selectedTournament.max_players} Players</Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-300">
                  <p>
                    • {selectedTournament.type === 1 ? "Single elimination bracket format" : "Custom tournament format"}
                  </p>
                  {selectedTournament.winner_take_all ? (
                    <p>• Winner takes all prize pool</p>
                  ) : (
                    <>
                      <p>• 1st Place: {selectedTournament.first_place_percentage}%</p>
                      <p>• 2nd Place: {selectedTournament.second_place_percentage}%</p>
                      <p>• 3rd Place: {selectedTournament.third_place_percentage}%</p>
                    </>
                  )}
                </div>
              </div>

              <DialogFooter className="px-0">
                <ButtonPressEffect className="w-full">
                  <Button
                    className={`w-full rounded-full ${
                      selectedTournament.status === "in-progress"
                        ? "bg-[#00FFA9] hover:bg-[#00D48F] text-black"
                        : selectedTournament.status === "upcoming"
                          ? "bg-[#FF007A] hover:bg-[#D60067] text-white"
                          : "bg-[#333] hover:bg-[#444] text-white"
                    }`}
                    onClick={() => {
                      setShowDialog(false)
                      router.push(`/tournaments/${selectedTournament.game_id}`)
                    }}
                  >
                    {selectedTournament.status === "in-progress"
                      ? "View Live"
                      : selectedTournament.status === "upcoming"
                        ? "Register Now"
                        : "View Results"}
                  </Button>
                </ButtonPressEffect>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}


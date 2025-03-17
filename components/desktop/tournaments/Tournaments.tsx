"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, Search, Trophy, Users, Plus, Shield } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { CreateTournamentForm } from "@/components/tournament/create-tournament-form"
import { CreateTeamForm } from "@/components/tournament/create-team-form"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDistanceToNow } from "date-fns"

interface Tournament {
  tournament_id: number
  title: string
  game: string
  console: string
  entry_fee: number
  prize_percentage: number
  first_place_percentage: number
  second_place_percentage: number
  third_place_percentage: number
  rules: string
  start_time: string
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

interface TournamentsDesktopProps {
  tournaments: Tournament[]
  teams: Team[]
  isLoading: boolean
}

export function TournamentsDesktop({ tournaments, teams, isLoading }: TournamentsDesktopProps) {
  const router = useRouter()
  const { isAuthenticated, player } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [activeTab, setActiveTab] = useState("tournaments")

  // Filter tournaments based on search query and filters
  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      tournament.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.game.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === "all" || tournament.game.toLowerCase() === categoryFilter.toLowerCase()

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "live" && tournament.status === "in-progress") ||
      (statusFilter === "registering" && tournament.status === "upcoming") ||
      (statusFilter === "completed" && tournament.status === "completed")

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Get unique game categories
  const gameCategories = Array.from(new Set(tournaments.map((tournament) => tournament.game.toLowerCase())))
  
  // Filter teams based on search query
  const filteredTeams = teams.filter((team) => team.name.toLowerCase().includes(searchQuery.toLowerCase()))
  
  const handleTournamentClick = (tournament: Tournament) => {
    router.push(`/tournaments/${tournament.tournament_id}`)
  }
  
  const handleTeamClick = (team: Team) => {
    router.push(`/teams/${team.id}`)
  }
  
  return (
    <main className="container mx-auto px-4 py-12 relative z-10">
      {/* Hero Section */}
      <section className="mb-16">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF007A]/10 border border-[#FF007A]/20 text-[#FF007A] text-sm mb-4">
            <Trophy className="w-4 h-4 mr-2" />
            TOURNAMENTS & TEAMS
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Compete & Win Crypto</h1>
          <p className="text-xl text-gray-400">
            Join tournaments across various game categories, create or join teams, and compete for cryptocurrency
            prizes.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <Tabs defaultValue="tournaments" className="w-full mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto">
          <TabsTrigger value="tournaments" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Tournaments
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> Teams
          </TabsTrigger>
          {isAuthenticated && (
            <>
              <TabsTrigger value="create-tournament" className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Tournament
              </TabsTrigger>
              <TabsTrigger value="create-team" className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Team
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Tournaments Tab */}
        <TabsContent value="tournaments">
          {/* Search and Filters */}
          <section className="mb-12">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search tournaments..."
                  className="pl-10 bg-black/50 border-[#333] focus:border-[#00FFA9] rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-4 items-center w-full md:w-auto">
                <Button
                  variant="outline"
                  className="border-[#333] text-white hover:bg-white/5 rounded-full flex-shrink-0"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
                
                <Tabs defaultValue="all" className="w-full md:w-auto">
                  <TabsList className="grid grid-cols-3 bg-[#111] border border-[#333] rounded-full p-1">
                    <TabsTrigger
                      value="all"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
                      onClick={() => setStatusFilter("all")}
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="live"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
                      onClick={() => setStatusFilter("live")}
                    >
                      Live
                    </TabsTrigger>
                    <TabsTrigger
                      value="upcoming"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
                      onClick={() => setStatusFilter("upcoming")}
                    >
                      Upcoming
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {showFilters && (
              <div className="bg-[#111] border border-[#333] rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category-filter" className="text-sm text-gray-400 mb-2 block">
                      Game Category
                    </Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="bg-black/50 border-[#333] focus:border-[#00FFA9] rounded-lg">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-[#333]">
                        <SelectItem value="all">All Categories</SelectItem>
                        {gameCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status-filter" className="text-sm text-gray-400 mb-2 block">
                      Status
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-black/50 border-[#333] focus:border-[#00FFA9] rounded-lg">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-[#333]">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="registering">Registering</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-400 mb-2 block">Prize Pool</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prize-filter-1"
                        className="border-[#333] data-[state=checked]:bg-[#00FFA9] data-[state=checked]:text-black"
                      />
                      <label htmlFor="prize-filter-1" className="text-sm">
                        $1,000+
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="prize-filter-2"
                        className="border-[#333] data-[state=checked]:bg-[#00FFA9] data-[state=checked]:text-black"
                      />
                      <label htmlFor="prize-filter-2" className="text-sm">
                        $5,000+
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="prize-filter-3"
                        className="border-[#333] data-[state=checked]:bg-[#00FFA9] data-[state=checked]:text-black"
                      />
                      <label htmlFor="prize-filter-3" className="text-sm">
                        $10,000+
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
          
          {/* Tournament List */}
          <section>
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredTournaments.map((tournament) => (
                  <Card
                    key={tournament.tournament_id}
                    className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden hover:border-[#555] transition-all cursor-pointer"
                    onClick={() => handleTournamentClick(tournament)}
                  >
                    <div className="aspect-[3/2] relative">
                      <Image
                        src={tournament.image_url || "/placeholder.svg?height=300&width=500"}
                        alt={tournament.title}
                        width={500}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 z-20">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            tournament.status === "in-progress"
                              ? "bg-[#00FFA9] text-black"
                              : tournament.status === "upcoming"
                                ? "bg-[#FFD600] text-black"
                                : "bg-[#333] text-white"
                          }`}
                        >
                          {tournament.status === "in-progress"
                            ? "LIVE"
                            : tournament.status === "upcoming"
                              ? "REGISTERING"
                              : "COMPLETED"}
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-2">
                        <Badge className="bg-[#222] text-gray-300 hover:bg-[#333] rounded-full">
                          {tournament.game}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-400">
                          <Users className="w-3 h-3 mr-1" />
                          <span>0/{tournament.max_players}</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{tournament.title}</h3>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-xs text-gray-400">PRIZE POOL</p>
                          <p className="text-lg font-bold text-[#FFD600]">
                            {tournament.entry_fee * tournament.max_players * (tournament.prize_percentage / 100)}{" "}
                            {tournament.money === 1 ? "SOL" : "GAMER"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            {tournament.status === "in-progress" ? "ENDS IN" : "STARTS IN"}
                          </p>
                          <p className="text-sm font-mono">
                            {formatDistanceToNow(new Date(tournament.start_time), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Button
                        className={`w-full rounded-full ${
                          tournament.status === "in-progress"
                            ? "bg-[#00FFA9] hover:bg-[#00D48F] text-black"
                            : tournament.status === "upcoming"
                              ? "bg-[#FF007A] hover:bg-[#D60067] text-white"
                              : "bg-[#333] hover:bg-[#444] text-white"
                        }`}
                      >
                        {tournament.status === "in-progress"
                          ? "View Live"
                          : tournament.status === "upcoming"
                            ? "Register"
                            : "View Results"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No tournaments found matching your criteria.</p>
                <Button
                  variant="outline"
                  className="mt-4 border-[#333] text-white hover:bg-white/5 rounded-full"
                  onClick={() => {
                    setSearchQuery("")
                    setCategoryFilter("all")
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
        <TabsContent value="teams">
          <section className="mb-8">
            <div className="relative w-full max-w-md mx-auto mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search teams..."
                className="pl-10 bg-black/50 border-[#333] focus:border-[#00FFA9] rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredTeams.map((team) => (
                  <Card
                    key={team.id}
                    className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden hover:border-[#555] transition-all cursor-pointer"
                    onClick={() => handleTeamClick(team)}
                  >
                    <div className="aspect-[3/1] relative">
                      <Image
                        src={team.header_image || "/placeholder.svg?height=200&width=600"}
                        alt={team.name}
                        width={600}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-2xl font-bold">{team.name}</h3>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <Badge className="bg-[#222] text-gray-300 hover:bg-[#333] rounded-full">{team.console}</Badge>
                        <div className="text-sm text-gray-400">
                          {formatDistanceToNow(new Date(team.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <Button className="w-full rounded-full bg-[#00FFA9] hover:bg-[#00D48F] text-black">
                        View Team
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No teams found matching your search.</p>
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
        <TabsContent value="create-tournament">
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
        <TabsContent value="create-team">
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
    </main>
  )
}


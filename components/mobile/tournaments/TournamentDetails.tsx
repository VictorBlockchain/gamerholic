"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Gamepad, Calendar, Users, Trophy, User, Zap, Book, Swords, Crown, Clock, ArrowLeft } from "lucide-react"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { MobileFooter } from "@/components/mobile/mobile-footer"
import { useUser } from "@/contexts/user-context"
import { TournamentBracket } from "@/components/tournament/tournament-bracket"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { joinTournament, startTournament } from "@/lib/service-tourmanent"
import { ScoreReportingModal } from "@/components/tournament/score-reporting-modal"
import { TournamentEditModal } from "@/components/tournament/tournament-edit-modal"
import { TournamentCancelModal } from "@/components/tournament/tournament-cancel-modal"
import moment from "moment";

export function TournamentDetailMobile({
  tournament,
  matches,
  players,
  teams,
  host,
  walletBalance,
  winner,
  isLoading,
  error,
  refreshData,
}:any) {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, player, balance } = useUser()
  const [activeTab, setActiveTab] = useState("overview")
  const [isJoining, setIsJoining] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const isAdmin = false // This would need to be determined from user context
  const isCreator = tournament && player ? tournament.host_id === player : false

  const participants = tournament?.is_team_tournament ? teams : players

  const handleJoinTournament = async () => {
    if (!isAuthenticated || !player || !tournament) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to join this tournament.",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)
    try {
      // Check if user has enough balance
      if (tournament.gamer_to_join > 0) {
        if (!balance || balance.gamer < tournament.gamer_to_join) {
          toast({
            title: "Insufficient Balance",
            description: `You need at least ${tournament.gamer_to_join} GAMER tokens to join this tournament.`,
            variant: "destructive",
          })
          return
        }
      }

      const result = await joinTournament(tournament.game_id, player)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.message || "Failed to join tournament.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "You have successfully joined the tournament!",
        })

        // Refresh tournament data
        refreshData()
      }
    } catch (error) {
      console.error("Error joining tournament:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleStartTournament = async () => {
    if (!isAuthenticated || !tournament || (!isAdmin && !isCreator)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to start this tournament.",
        variant: "destructive",
      })
      return
    }

    setIsStarting(true)
    try {
      const result = await startTournament(tournament.game_id)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.message || "Failed to start tournament.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Tournament has been started successfully!",
        })

        // Refresh tournament data
        refreshData()
      }
    } catch (error) {
      console.error("Error starting tournament:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsStarting(false)
    }
  }

  const openScoreModal = (match:any) => {
    if (!isAuthenticated || !tournament || (!isAdmin && !isCreator)) {
      toast({
        title: "Permission Denied",
        description: "Only the tournament host can report scores.",
        variant: "destructive",
      })
      return
    }

    setSelectedMatch(match)
    setIsScoreModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <MobileHeader />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-xl">Loading tournament data...</span>
        </div>
        <MobileFooter />
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <MobileHeader />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">{error || "Tournament not found"}</h1>
            <Button onClick={() => router.push("/tournaments")}>Back to Tournaments</Button>
          </div>
        </div>
        <MobileFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20">
      <MobileHeader />

      <main className="container mx-auto px-4 py-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-gray-400 hover:text-white"
          onClick={() => router.push("/tournaments")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Tournaments
        </Button>

        {/* Hero Banner */}
        <div className="relative mb-6">
          <div className="w-full h-48 rounded-xl overflow-hidden">
            <Image
              src={tournament.image_url || "/placeholder.svg?height=192&width=384"}
              alt={tournament.title}
              width={384}
              height={192}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent rounded-xl"></div>
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge
                className={`${
                  tournament.status === "in-progress"
                    ? "bg-[#00FFA9] text-black"
                    : tournament.status === "upcoming"
                      ? "bg-[#FFD600] text-black"
                      : "bg-[#333] text-white"
                } text-xs px-2 py-0.5`}
              >
                {tournament.status === "in-progress"
                  ? "LIVE"
                  : tournament.status === "upcoming"
                    ? "REGISTERING"
                    : "COMPLETED"}
              </Badge>
              <Badge className="bg-[#222] text-gray-300 text-xs px-2 py-0.5">
                <Gamepad className="w-3 h-3 mr-1" />
                {tournament.game}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{tournament.title}</h1>
          </div>
        </div>

        {/* Tournament Info */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className="bg-[#222] text-gray-300 text-xs px-2 py-0.5">
            <Calendar className="w-3 h-3 mr-1" />
                {moment(tournament.start_time).format("MMM D, YYYY h:mm A")}
          </Badge>
          {tournament.is_team_tournament && (
            <Badge className="bg-[#FF007A] text-white text-xs px-2 py-0.5">Team Tournament</Badge>
          )}
          <Badge className="bg-[#222] text-gray-300 text-xs px-2 py-0.5">
            <Users className="w-3 h-3 mr-1" />
            {participants.length}/{tournament.max_players}
          </Badge>
        </div>

        {/* Tournament Actions */}
        {tournament.status === "upcoming" && (
          <div className="flex flex-wrap gap-2 mb-6">
            {isAuthenticated &&
              (tournament.is_team_tournament
                ? !teams.some((t:any) => t.creator_id === player)
                : !players.some((p:any) => p.publicKey === player)) && (
                <Button
                  className="w-full bg-[#00FFA9] hover:bg-[#00D48F] text-black font-bold rounded-full"
                  onClick={handleJoinTournament}
                  disabled={isJoining}
                >
                  {isJoining ? <LoadingSpinner className="mr-2" /> : null}
                  {isJoining ? "Joining..." : `Join Tournament${tournament.is_team_tournament ? " with Team" : ""}`}
                </Button>
              )}

            {(isAdmin || isCreator) && (
              <div className="w-full flex gap-2">
                <Button
                  className="flex-1 bg-[#FF007A] hover:bg-[#D60067] text-white font-bold rounded-full"
                  onClick={handleStartTournament}
                  disabled={isStarting || participants.length < 2}
                >
                  {isStarting ? <LoadingSpinner className="mr-2" /> : null}
                  {isStarting ? "Starting..." : "Start Tournament"}
                </Button>

                <Button
                  className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold rounded-full"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit
                </Button>
                
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full"
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
            <TabsTrigger value="players">{tournament.is_team_tournament ? "Teams" : "Players"}</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className={activeTab === "overview" ? "block" : "hidden"}>
            <div className="space-y-4">
              {/* Prize Pool Card */}
              <Card className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-primary/20 rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold flex items-center mb-3">
                    <Trophy className="w-4 h-4 mr-2 text-[#FFD600]" /> Prize Pool
                  </h3>

                  <div className="text-3xl font-bold mb-3">
                    {(
                      tournament.entry_fee * tournament.max_players * (tournament.prize_percentage / 100) +
                      (walletBalance?.solana || 0)
                    ).toLocaleString()}{" "}
                    {tournament.money === 1 ? "SOL" : "GAMER"}
                  </div>

                  {tournament.winner_take_all ? (
                    <Badge className="bg-[#FFD600] text-black">Winner Takes All</Badge>
                  ) : (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span>1st Place:</span>
                        <Badge className="bg-[#FFD600] text-black">{tournament.first_place_percentage}%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>2nd Place:</span>
                        <Badge className="bg-[#333]">{tournament.second_place_percentage}%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>3rd Place:</span>
                        <Badge className="bg-[#333]">{tournament.third_place_percentage}%</Badge>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-white/10 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400">Entry Fee:</span>
                      <span>
                        {tournament.entry_fee} {tournament.money === 1 ? "SOL" : "GAMER"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">GAMER to Join:</span>
                      <span>{tournament.gamer_to_join > 0 ? tournament.gamer_to_join : "Free"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Host Card */}
              <Card className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border-primary/20 rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold flex items-center mb-3">
                    <User className="w-4 h-4 mr-2 text-[#00FFA9]" /> Tournament Host
                  </h3>

                  {host && (
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-12 w-12 border-2 border-[#00FFA9]">
                        <AvatarImage
                          src={host.avatar || "/placeholder.svg?height=48&width=48"}
                          alt={host.name}
                        />
                        <AvatarFallback>{host.name?.slice(0, 2) || "H"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{host.name}</p>
                        <p className="text-xs text-gray-400">{host.player.slice(0, 8)}...</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Tournament Type:</span>
                      <Badge className="bg-[#333]">{tournament.type === 1 ? "Bracket" : "Custom"}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Max {tournament.is_team_tournament ? "Teams" : "Players"}:</span>
                      <span>{tournament.max_players}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">
                        {tournament.status === "in-progress" ? "Started:" : "Starts:"}
                      </span>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                        <span>{moment(tournament.start_time).format("MMM D, YYYY h:mm A")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
                            {/* Status Card */}
                <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-primary/20 rounded-xl overflow-hidden">
                
                <CardContent className="p-4">
                <h3 className="text-lg font-bold flex items-center mb-3">
                  <Zap className="w-5 h-5 mr-2 text-[#FFD600]" /> Tournament Status
                </h3>
                  <div className="flex items-center mb-4">
                    <Badge
                      className={`${
                        tournament.status === "in-progress"
                          ? "bg-[#00FFA9] text-black"
                          : tournament.status === "upcoming"
                            ? "bg-[#FFD600] text-black"
                            : "bg-[#333] text-white"
                      } text-lg px-3 py-1`}
                    >
                      {tournament.status === "in-progress"
                        ? "LIVE"
                        : tournament.status === "upcoming"
                          ? "REGISTERING"
                          : "COMPLETED"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{tournament.is_team_tournament ? "Teams" : "Players"}:</span>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>
                          {participants.length}/{tournament.max_players}
                        </span>
                      </div>
                    </div>
                    
                    {tournament.status === "upcoming" && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Registration:</span>
                        <span>Open</span>
                      </div>
                    )}
                    
                    {tournament.status === "completed" && winner && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Winner:</span>
                        <div className="flex items-center">
                          <Crown className="w-4 h-4 mr-1 text-[#FFD600]" />
                          <span>{tournament.is_team_tournament ? winner.name : winner.username}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {tournament.status === "completed" && winner && (
                    <div className="mt-6 flex items-center justify-center">
                      <Avatar className="h-16 w-16 border-2 border-[#FFD600]">
                        <AvatarImage
                          src={
                            tournament.is_team_tournament
                              ? winner.logo_image || "/placeholder.svg?height=64&width=64"
                              : winner.avatar_url || "/placeholder.svg?height=64&width=64"
                          }
                          alt={tournament.is_team_tournament ? winner.name : winner.username}
                        />
                        <AvatarFallback>
                          {tournament.is_team_tournament
                            ? winner.name?.slice(0, 2)
                            : winner.username?.slice(0, 2) || "W"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="text-sm text-gray-400">Tournament Winner</p>
                        <p className="text-xl font-bold">
                          {tournament.is_team_tournament ? winner.name : winner.username}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Winner Card (if tournament is completed) */}
              {tournament.status === "completed" && winner && (
                <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-primary/20 rounded-xl overflow-hidden">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold flex items-center mb-3">
                      <Crown className="w-4 h-4 mr-2 text-[#FFD600]" /> Tournament Winner
                    </h3>

                    <div className="flex items-center justify-center">
                      <Avatar className="h-16 w-16 border-2 border-[#FFD600]">
                        <AvatarImage
                          src={
                            tournament.is_team_tournament
                              ? winner.logo_image || "/placeholder.svg?height=64&width=64"
                              : winner.avatar_url || "/placeholder.svg?height=64&width=64"
                          }
                          alt={tournament.is_team_tournament ? winner.name : winner.username}
                        />
                        <AvatarFallback>
                          {tournament.is_team_tournament
                            ? winner.name?.slice(0, 2)
                            : winner.username?.slice(0, 2) || "W"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="text-sm text-gray-400">Tournament Winner</p>
                        <p className="text-xl font-bold">
                          {tournament.is_team_tournament ? winner.name : winner.username}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Bracket Tab */}
          <TabsContent value="bracket" className={activeTab === "bracket" ? "block" : "hidden"}>
            {tournament.type === 1 ? (
              matches.length > 0 ? (
                <div className="overflow-x-auto pb-4">
                  <TournamentBracket
                    matches={matches.map((match:any) => ({
                      id: match.id.toString(),
                      round: match.round,
                      position: match.match_order,
                      participants: [
                        {
                          id: match.player1_id || "",
                          name: tournament.is_team_tournament
                            ? teams.find((t:any) => t.id === match.player1_id)?.name || "TBD"
                            : players.find((p:any) => p.player === match.player1_id)?.name || "TBD",
                          avatarFallback: tournament.is_team_tournament
                            ? teams.find((t:any) => t.id === match.player1_id)?.name?.slice(0, 2) || "?"
                            : players.find((p:any) => p.player === match.player1_id)?.name?.slice(0, 2) || "?",
                          avatar: tournament.is_team_tournament
                            ? teams.find((t:any) => t.id === match.player1_id)?.logo_image
                            : players.find((p:any) => p.player === match.player1_id)?.avatar,
                          score: match.player1_score,
                          isWinner: match.winner_id === match.player1_id,
                        },
                        {
                          id: match.player2_id || "",
                          name: tournament.is_team_tournament
                            ? teams.find((t:any) => t.id === match.player2_id)?.name || "TBD"
                            : players.find((p:any) => p.player === match.player2_id)?.name || "TBD",
                          avatarFallback: tournament.is_team_tournament
                            ? teams.find((t:any) => t.id === match.player2_id)?.name?.slice(0, 2) || "?"
                            : players.find((p:any) => p.player === match.player2_id)?.name?.slice(0, 2) || "?",
                          avatar: tournament.is_team_tournament
                            ? teams.find((t:any) => t.id === match.player2_id)?.logo_image
                            : players.find((p:any) => p.player === match.player2_id)?.avatar,
                          score: match.player2_score,
                          isWinner: match.winner_id === match.player2_id,
                        },
                      ],
                      status:
                        match.player1_id && match.player2_id ? (match.winner_id ? "completed" : "live") : "upcoming",
                      startTime: match.match_date ? moment(match.match_date).format("MMM D, YYYY h:mm A") : "",
                      onReportScore:
                        (isAdmin || isCreator) && tournament.status === "in-progress"
                          ? () => openScoreModal(match)
                          : undefined,
                    }))}
                    isMobile={true}
                  />
                </div>
              ) : tournament.status === "upcoming" ? (
                <div className="text-center py-8">
                  <p className="text-lg text-gray-400 mb-3">
                    Tournament bracket will be generated when the tournament starts.
                  </p>
                  {participants.length > 0 && (
                    <p className="text-gray-500">
                      {participants.length} {tournament.is_team_tournament ? "team" : "player"}
                      {participants.length !== 1 ? "s" : ""} registered so far.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-lg text-gray-400">No matches found for this tournament.</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <p className="text-lg text-gray-400 mb-3">This is a custom tournament format.</p>
                <p className="text-gray-500">Matches are managed manually by the tournament host.</p>
              </div>
            )}
          </TabsContent>

          {/* Players/Teams Tab */}
          <TabsContent value="players" className={activeTab === "players" ? "block" : "hidden"}>
            {participants.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {tournament.is_team_tournament
                  ? // Teams
                    teams.map((team:any) => (
                      <Card
                        key={team.id}
                        className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden hover:border-[#555] transition-all"
                      >
                        <div className="relative h-24">
                          <Image
                            src={team.header_image || "/placeholder.svg?height=96&width=384"}
                            alt={team.name}
                            width={384}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 border border-primary">
                                <AvatarImage src={team.logo_image || "/placeholder.svg?height=40&width=40"} />
                                <AvatarFallback>{team.name?.slice(0, 2) || "T"}</AvatarFallback>
                              </Avatar>
                              <div className="ml-2">
                                <h3 className="font-bold text-sm">{team.name}</h3>
                              </div>
                            </div>
                            <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10 text-xs">
                              {team.console}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))
                  : // Players
                    players.map((player:any) => (
                      <Card
                        key={player.publicKey}
                        className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden hover:border-[#555] transition-all"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="h-10 w-10 border border-primary">
                              <AvatarImage src={player.avatar || "/placeholder.svg?height=40&width=40"} />
                              <AvatarFallback>{player.name?.slice(0, 2) || "?"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-bold text-sm">{player.name}</h3>
                              <p className="text-xs text-gray-400">{player.player.slice(0, 8)}...</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="bg-black/30 p-2 rounded">
                              <p className="text-xs text-gray-400">Win/Loss</p>
                              <p className="font-bold">
                                {player.wins || 0} - {player.losses || 0}
                              </p>
                            </div>
                            <div className="bg-black/30 p-2 rounded">
                              <p className="text-xs text-gray-400">Win Streak</p>
                              <p className="font-bold">{player.win_streak || 0}</p>
                            </div>
                            <div className="bg-black/30 p-2 rounded">
                              <p className="text-xs text-gray-400">Loss Streak</p>
                              <p className="font-bold">{player.loss_streak || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-lg text-gray-400 mb-3">
                  No {tournament.is_team_tournament ? "teams" : "players"} have joined this tournament yet.
                </p>
                {tournament.status === "upcoming" && (
                  <Button
                    className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-bold rounded-full"
                    onClick={handleJoinTournament}
                    disabled={isJoining || !isAuthenticated}
                  >
                    {isJoining ? <LoadingSpinner className="mr-2" /> : null}
                    {isJoining
                      ? "Joining..."
                      : `Be the First to Join${tournament.is_team_tournament ? " with Your Team" : ""}`}
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className={activeTab === "rules" ? "block" : "hidden"}>
            <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold flex items-center mb-3">
                  <Book className="w-4 h-4 mr-2" /> Tournament Rules
                </h3>

                <div className="prose prose-invert max-w-none text-sm">
                  <p className="whitespace-pre-line">{tournament.rules}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="font-bold mb-2">General Information</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <Gamepad className="w-4 h-4 mr-2 mt-0.5 text-[#00FFA9]" />
                      <span>
                        Game: <strong>{tournament.game}</strong>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-4 h-4 mr-2 mt-0.5 flex items-center justify-center text-[#00FFA9]">🎮</span>
                      <span>
                        Platform: <strong>{tournament.console}</strong>
                      </span>
                    </li>
                    {tournament.type === 1 && (
                      <>
                        <li className="flex items-start">
                          <Trophy className="w-4 h-4 mr-2 mt-0.5 text-[#FFD600]" />
                          <span>
                            Format: <strong>Single Elimination Bracket</strong>
                          </span>
                        </li>
                        {tournament.max_players > 2 && (
                          <li className="flex items-start">
                            <Swords className="w-4 h-4 mr-2 mt-0.5 text-[#FF007A]" />
                            <span>
                              Matches: <strong>Best of 3 (Finals: Best of 5)</strong>
                            </span>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MobileFooter />

      {/* Score Reporting Modal */}
      {isScoreModalOpen && selectedMatch && (
        <ScoreReportingModal
          match={selectedMatch}
          tournament={tournament}
          participants={tournament.is_team_tournament ? teams : players}
          isOpen={isScoreModalOpen}
          onClose={() => {
            setIsScoreModalOpen(false)
            setSelectedMatch(null)
          }}
          onSuccess={() => {
            setIsScoreModalOpen(false)
            setSelectedMatch(null)
            refreshData()
          }}
        />
      )}

      {/* Tournament Edit Modal */}
      {isEditModalOpen && tournament && (
        <TournamentEditModal
          tournament={tournament}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false)
            refreshData()
          }}
        />
      )}

      {/* Tournament Cancel Modal */}
      {isCancelModalOpen && tournament && (
        <TournamentCancelModal
          tournament={tournament}
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onSuccess={() => {
            setIsCancelModalOpen(false)
            router.push("/tournaments")
          }}
        />
      )}
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gamepad, Calendar, Users, Trophy, DollarSign, User, Book } from "lucide-react"
import { ReportScoreModal } from "@/components/report-score-modal"
import { Header } from "@/components/header"
import { useWallet } from "@solana/wallet-adapter-react"
import { SuccessModal } from "@/components/success-modal"
import { ErrorModal } from "@/components/error-modal"
import { updateTournamentBracket } from "@/lib/tournament-utils"
import { EditTournamentModal } from "@/components/tournament-edit-modal"
import { CancelTournamentModal } from "@/components/tournament-cancel-modal"
import { JoinTournamentModal } from "@/components/tournament-join-modal"
const moment = require("moment");

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
  start_time: string
  prize_type: string
  max_players: number
  image_url: string
  status: "upcoming" | "in-progress" | "completed" | "paid"
  host_id: string
}

interface TournamentPlayer {
  player_id: string
  joined_at: string
}

interface Match {
  id: number
  tournament_id: number
  round: number
  match_order: number
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  player1_score: number | null
  player2_score: number | null
  match_date: string | null
}

interface Player {
  publicKey: string
  username: string
  avatar_url: string
}

interface TournamentResult {
  player_id: string
  position: number
  prize_amount: number
}

interface Payment {
  id: string
  user_id: string
  amount: number
  status: "pending" | "completed" | "failed"
  transaction_hash: string | null
}

export default function TournamentPage() {
  const params = useParams()
  const { publicKey } = useWallet()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [tournamentWallet, setTournamentWallet]:any = useState(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [results, setResults] = useState<TournamentResult[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isReportScoreModalOpen, setIsReportScoreModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [host, setHost] = useState<Player | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  useEffect(() => {
    fetchTournamentData()
  }, [])

  const fetchTournamentData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("game_id", params.id)
        .single()
      
      if (tournamentError) throw tournamentError

      const { data: tournamentWallet, error: tournamentWalletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("tournament_id", params.id)
        .single()
      
      if (tournamentWalletError) throw tournamentWalletError

      const { data: matchesData, error: matchesError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", params.id)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true })

      if (matchesError) throw matchesError

      const { data: playersData, error: playersError } = await supabase
        .from("tournament_players")
        .select("player_id")
        .eq("tournament_id", params.id)

      if (playersError) throw playersError

      const playerIds = playersData.map((p) => p.player_id)
      const { data: playerDetails, error: playerDetailsError } = await supabase
        .from("users")
        .select("publicKey, username, avatar_url")
        .in("publicKey", playerIds)

      if (playerDetailsError) throw playerDetailsError

      const { data: hostData, error: hostError } = await supabase
        .from("users")
        .select("publicKey, username, avatar_url")
        .eq("publicKey", tournamentData.host_id)
        .single()

      if (hostError) throw hostError

      if (tournamentData.status === "completed" || tournamentData.status === "paid") {
        const { data: resultsData, error: resultsError } = await supabase
          .from("tournament_results")
          .select("*")
          .eq("tournament_id", params.id)
          .order("position", { ascending: true })

        if (resultsError) throw resultsError
        setResults(resultsData)

        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .eq("payment_type", "tournament")
          .eq("game_id", params.id)

        if (paymentsError) throw paymentsError
        setPayments(paymentsData)
      }

      if (publicKey) {
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("role")
          .eq("user_id", publicKey.toBase58())
          .single()

        if (adminError && adminError.code !== "PGRST116") throw adminError
        setIsAdmin(!!adminData)

        setIsCreator(tournamentData.host_id === publicKey.toBase58())
      }

      setTournament(tournamentData)
      setMatches(matchesData)
      setPlayers(playerDetails)
      setHost(hostData)
      setTournamentWallet(tournamentWallet)
    } catch (error) {
      console.error("Error fetching tournament data:", error)
      setError("Failed to fetch tournament data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReportScore = (match: Match) => {
    setSelectedMatch(match)
    setIsReportScoreModalOpen(true)
  }

  const submitScore = async (player1Score: number, player2Score: number) => {
    if (selectedMatch && tournament && (isAdmin || isCreator)) {
      if (player1Score === player2Score) {
        setErrorMessage("Scores cannot be tied. Please enter different scores for each player.")
        setShowErrorModal(true)
        return
      }

      setIsUpdating(true)
      const winnerId = player1Score > player2Score ? selectedMatch.player1_id : selectedMatch.player2_id
      try {
        const { error: updateError } = await supabase
          .from("tournament_matches")
          .update({
            player1_score: player1Score,
            player2_score: player2Score,
            winner_id: winnerId,
          })
          .eq("id", selectedMatch.id)

        if (updateError) throw updateError

        await updateTournamentBracket(supabase, tournament.game_id, selectedMatch.id, winnerId)

        if (tournament.status === "in-progress" && selectedMatch.round === Math.log2(tournament.max_players)) {
          try {
            const response = await fetch("/api/esports/tournament/payout", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tournamentId: tournament.game_id,
                winnerId: winnerId,
              }),
            })

            if (!response.ok) {
              throw new Error("Failed to process tournament payout")
            }

            const payoutResult = await response.json()
            console.log("Payout processed:", payoutResult)

            setSuccessMessage("The tournament has concluded and payouts have been processed.")
          } catch (error) {
            console.error("Error processing tournament payout:", error)
            setErrorMessage(
              "The match score was updated, but there was an error processing the tournament payout. Please contact support.",
            )
          }
        }

        setSuccessMessage("The match score has been successfully updated and the winner advanced.")
        setShowSuccessModal(true)

        await fetchTournamentData()
      } catch (error) {
        console.error("Error updating match score:", error)
        setErrorMessage("Failed to update the match score. Please try again.")
        setShowErrorModal(true)
      } finally {
        setIsUpdating(false)
        setIsReportScoreModalOpen(false)
      }
    } else {
      setErrorMessage("You don't have permission to report scores for this tournament.")
      setShowErrorModal(true)
    }
  }

  const getPlayerUsername = (playerId: string | null) => {
    if (!playerId) return "TBD"
    const player = players.find((p) => p.publicKey === playerId)
    return player ? player.username : playerId.slice(0, 6)
  }

  const getPaymentStatus = (playerId: string) => {
    const payment = payments.find((p) => p.user_id === playerId)
    if (!payment) return "Not processed"
    return payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
  }

  const confirmJoinTournament = async () => {
    if (!publicKey || !tournament) return
    
    setIsUpdating(true)
    try {
      const response = await fetch("/api/esports/tournament/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId: tournament.game_id,
          player: publicKey.toBase58(),
        }),
      })
      const data = await response.json()
      
      if (!data.success) {
        setErrorMessage(data.message)
        setShowErrorModal(true)
      }else{
        setSuccessMessage("You have successfully joined the tournament!")
        setShowSuccessModal(true)
        await fetchTournamentData()
      
      }

    } catch (error) {
      // console.error("Error joining tournament:", error)
      // setErrorMessage("Failed to join the tournament. Please try again.")
      // setShowErrorModal(true)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditTournament = async (data: any) => {
    // Replace any with the correct type if available
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/esports/tournament/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId: tournament.game_id,
          ...data,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update tournament")
      }

      setSuccessMessage("Tournament updated successfully")
      setShowSuccessModal(true)
      await fetchTournamentData()
    } catch (error) {
      console.error("Error updating tournament:", error)
      setErrorMessage("Failed to update the tournament. Please try again.")
      setShowErrorModal(true)
    } finally {
      setIsUpdating(false)
    }
  }
  
  const handleCancelTournament = async () => {
    
    setIsCancelModalOpen(true)
  }

  const handleJoinTournament = async () => {
    
    setIsJoinModalOpen(true)
  }

  const confirmCancelTournament = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/esports/tournament/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId: tournament?.game_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel tournament")
      }

      setSuccessMessage("Tournament canceled successfully. All players have been refunded.")
      setShowSuccessModal(true)
      await fetchTournamentData()
    } catch (error) {
      console.error("Error canceling tournament:", error)
      setErrorMessage("Failed to cancel the tournament. Please try again.")
      setShowErrorModal(true)
    } finally {
      setIsUpdating(false)
      setIsCancelModalOpen(false)
    }
  }

  const renderBracket = (round: number) => {
    const roundMatches = matches.filter((match) => match.round === round)
    return (
      <div className="flex flex-col space-y-4">
        {roundMatches.map((match) => (
          <Card
            key={match.id}
            className="w-64 bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg hover:shadow-primary/20 transition-shadow duration-300"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{getPlayerUsername(match.player1_id).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">{getPlayerUsername(match.player1_id)}</span>
                </div>
                <span className="text-lg font-bold">{match.player1_score !== null ? match.player1_score : "-"}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{getPlayerUsername(match.player2_id).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">
                    {match.player2_id ? getPlayerUsername(match.player2_id) : "Waiting"}
                  </span>
                </div>
                <span className="text-lg font-bold">{match.player2_score !== null ? match.player2_score : "-"}</span>
              </div>
              {tournament?.status === "in-progress" &&
                match.player1_id &&
                match.player2_id &&
                !match.winner_id &&
                (isAdmin || isCreator) && (
                  <Button
                    onClick={() => handleReportScore(match)}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Report Score"}
                  </Button>
                )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-400"></div>
        <p className="text-2xl font-bold ml-4">Loading tournament...</p>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <p className="text-2xl font-bold text-red-500">{error || "Tournament not found"}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="relative mb-12">
          <img
            src={tournament.image_url || "/placeholder.svg"}
            alt={tournament.game}
            className="w-full h-64 object-cover rounded-lg shadow-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent rounded-lg"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-4xl font-bold mb-2">{tournament.title}</h1>
            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                <Gamepad className="w-5 h-5 mr-2 inline" />
                {tournament.game}
              </Badge>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                <Calendar className="w-5 h-5 mr-2 inline" />
                {moment(tournament.start_date).format("MMMM D, YYYY h:mm A")}
              </Badge>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                <Users className="w-5 h-5 mr-2 inline" />
                {players.length} / {tournament.max_players} players
              </Badge>
              <Badge
                variant={
                  tournament.status === "upcoming"
                    ? "default"
                    : tournament.status === "in-progress"
                      ? "secondary"
                      : "outline"
                }
                className="text-lg px-3 py-1"
              >
                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Prize Pool Column */}
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-8 shadow-2xl">
            <CardContent>
              <h2 className="text-3xl font-bold mb-4 flex items-center">
                {/* <Trophy className="w-8 h-8 mr-2" /> */}
                Prize Pool
              </h2>
              <div className="text-6xl font-bold flex items-center">
                {/* <DollarSign className="w-12 h-12 mr-2" /> */}
                {(tournament.entry_fee * tournament.max_players * (tournament.prize_percentage / 100)).toLocaleString()} {tournament.prize_type=="GAMEr" && ('GAMEr')} {tournament.prize_type=="Solana" && ('SOL')}
              </div>
              <div className="mt-4">
                <p>1st Place: {tournament.first_place_percentage}%</p>
                <p>2nd Place: {tournament.second_place_percentage}%</p>
                <p>3rd Place: {tournament.third_place_percentage}%</p>
                <p>wallet: <b><a href={`https://solscan.io/account/${tournamentWallet.public_key}`} target="_blank" rel="noopener noreferrer">{`${tournamentWallet.public_key.slice(0, 4)}...${tournamentWallet.public_key.slice(-4)}`}</a></b></p>

              </div>
            </CardContent>
          </Card>

          {/* Host Column */}
          <Card className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-8 shadow-2xl">
            <CardContent>
              <h2 className="text-3xl font-bold mb-4 flex items-center">
                <User className="w-8 h-8 mr-2" />
                Host
              </h2>
              {host && (
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={host.avatar_url} alt={host.username} />
                    <AvatarFallback>{host.username.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-2xl font-bold">{host.username}</p>
                    <p className="text-sm opacity-75">{host.publicKey.slice(0, 8)}...</p>
                  </div>
                </div>
              )}
              {isCreator && tournament.status === "upcoming" && (
                <div className="mt-4 space-x-4">
                  <Button onClick={() => setIsEditModalOpen(true)} className="bg-blue-500 hover:bg-blue-600">
                    Edit Tournament
                  </Button>
                  <Button onClick={handleCancelTournament} className="bg-red-500 hover:bg-red-600">
                    Cancel Tournament
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rules Column */}
          <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-8 shadow-2xl">
            <CardContent>
              <h2 className="text-3xl font-bold mb-4 flex items-center">
                <Book className="w-8 h-8 mr-2" />
                Rules
              </h2>
              <div className="prose prose-invert">
                <p>{tournament.rules}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {tournament.status === "upcoming" && players.length < tournament.max_players && publicKey && (
          <Button
            onClick={handleJoinTournament}
            className="w-full mb-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 text-xl"
            disabled={isUpdating}
          >
            {isUpdating ? "Joining..." : "Join Tournament"}
          </Button>
        )}

        <h2 className="text-3xl font-bold mb-8">Tournament Bracket</h2>
        <div className="overflow-x-auto">
          <div className="flex space-x-8 pb-8">
            {Array.from({ length: Math.ceil(Math.log2(tournament.max_players)) }, (_, roundIndex) => (
              <div key={roundIndex} className="flex flex-col space-y-4">
                <h3 className="text-xl font-semibold mb-4">Round {roundIndex + 1}</h3>
                {renderBracket(roundIndex + 1)}
              </div>
            ))}
          </div>
        </div>

        <ReportScoreModal
          isOpen={isReportScoreModalOpen}
          onClose={() => setIsReportScoreModalOpen(false)}
          onSubmit={submitScore}
          player1Name={selectedMatch ? getPlayerUsername(selectedMatch.player1_id) : "Player 1"}
          player2Name={selectedMatch ? getPlayerUsername(selectedMatch.player2_id) : "Player 2"}
          isTournamentMatch={true}
          matchId={selectedMatch?.id.toString()}
        />
        <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
        <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
        <EditTournamentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditTournament}
          tournament={tournament}
        />
        <CancelTournamentModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={confirmCancelTournament}
          tournamentTitle={tournament?.title || ""}
        />
        <JoinTournamentModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onConfirm={confirmJoinTournament}
          tournamentId={tournament.game_id}
          tournamentName={tournament?.title || ""}
          entryFee={tournament.entry_fee}
        />
      </main>
    </div>
  )
}


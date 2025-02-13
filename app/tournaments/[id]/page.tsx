"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gamepad, Calendar, Users, Trophy, DollarSign, CheckCircle, XCircle, Loader, RefreshCw } from "lucide-react"
import { ReportScoreModal } from "@/components/report-score-modal"
import { Header } from "@/components/header"
import { useWallet } from "@solana/wallet-adapter-react"
import { SuccessModal } from "@/components/success-modal"
import { ErrorModal } from "@/components/error-modal"
import { updateTournamentBracket } from "@/lib/tournament-utils"

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
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  const [isUpdating, setIsUpdating] = useState(false)
  const [canReprocessPayouts, setCanReprocessPayouts] = useState(false)

  useEffect(() => {
    fetchTournamentData()
  }, [])

  const fetchTournamentData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*, status")
        .eq("game_id", params.id)
        .single()

      if (tournamentError) throw tournamentError

      // Fetch tournament matches
      const { data: matchesData, error: matchesError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", params.id)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true })

      if (matchesError) throw matchesError

      // Fetch tournament players
      const { data: playersData, error: playersError } = await supabase
        .from("tournament_players")
        .select("player_id")
        .eq("tournament_id", params.id)

      if (playersError) throw playersError

      // Fetch player details
      const playerIds = playersData.map((p) => p.player_id)
      const { data: playerDetails, error: playerDetailsError } = await supabase
        .from("users")
        .select("publicKey, username, avatar_url")
        .in("publicKey", playerIds)

      if (playerDetailsError) throw playerDetailsError

      // Fetch tournament results if the tournament is completed or paid
      if (tournamentData.status === "completed" || tournamentData.status === "paid") {
        const { data: resultsData, error: resultsError } = await supabase
          .from("tournament_results")
          .select("*")
          .eq("tournament_id", params.id)
          .order("position", { ascending: true })

        if (resultsError) throw resultsError
        setResults(resultsData)

        // Fetch payment information
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .eq("payment_type", "tournament")
          .eq("game_id", params.id)

        if (paymentsError) throw paymentsError
        setPayments(paymentsData)
      }
      
      if (publicKey) {
        // Check if the user is an admin
        // const { data: adminData, error: adminError } = await supabase
        //   .from("admins")
        //   .select("role")
        //   .eq("wallet", publicKey.toBase58())
        //   .single()
        
        // if (adminError && adminError.code !== "PGRST116") throw adminError
        // setIsAdmin(!!adminData)

        // Check if the user is the tournament creator
        setIsCreator(tournamentData.host_id === publicKey.toBase58())

        // Check if the user is a winner
        const isWinner = results.some((result) => result.player_id === publicKey.toBase58())

        // Set canReprocessPayouts based on user role and tournament status
        setCanReprocessPayouts(
          (isAdmin || isCreator || isWinner) &&
            (tournamentData.status === "completed" || tournamentData.status === "paid") &&
            payments.some((payment) => payment.status === "failed"),
        )
      }

      setTournament(tournamentData)
      setMatches(matchesData)
      setPlayers(playerDetails)
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
        // Update the current match score
        const { error: updateError } = await supabase
          .from("tournament_matches")
          .update({
            player1_score: player1Score,
            player2_score: player2Score,
            winner_id: winnerId,
          })
          .eq("id", selectedMatch.id)

        if (updateError) throw updateError

        // Update the tournament bracket
        await updateTournamentBracket(supabase, tournament.game_id, selectedMatch.id, winnerId)

        // Check if this was the final match
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

        // Refresh tournament data
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

  const handleReprocessPayouts = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/esports/tournament/reprocess-payouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tournamentId: tournament.game_id }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccessMessage("Payouts have been reprocessed successfully.")
        setShowSuccessModal(true)
        fetchTournamentData() // Refresh the tournament data
      } else {
        setErrorMessage(result.error || "Failed to reprocess payouts.")
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error("Error reprocessing payouts:", error)
      setErrorMessage("An error occurred while reprocessing payouts.")
      setShowErrorModal(true)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-primary" />
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
              {tournament.status === "in-progress" &&
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
                {new Date(tournament.start_date).toLocaleDateString()}
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

        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-8 mb-12 shadow-2xl">
          <h2 className="text-3xl font-bold mb-4 flex items-center">
            <Trophy className="w-8 h-8 mr-2" />
            {tournament.status === "completed" || tournament.status === "paid" ? "Winners" : "Prize Pool"}
          </h2>
          {tournament.status === "completed" || tournament.status === "paid" ? (
            <div className="grid grid-cols-3 gap-4">
              {results.map((result, index) => {
                const player = players.find((p) => p.publicKey === result.player_id)
                return (
                  player && (
                    <div key={index} className="flex flex-col items-center">
                      <Avatar className="w-16 h-16 mb-2">
                        <AvatarImage src={player.avatar_url} alt={player.username} />
                        <AvatarFallback>{player.username.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold">{player.username}</span>
                      <span className="text-sm">{["1st", "2nd", "3rd"][index]} Place</span>
                      <span className="text-lg font-bold">${result.prize_amount.toFixed(2)}</span>
                      <span className="text-sm mt-2">Payment Status: {getPaymentStatus(player.publicKey)}</span>
                      {getPaymentStatus(player.publicKey) === "Completed" && (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                      )}
                      {getPaymentStatus(player.publicKey) === "Failed" && (
                        <XCircle className="w-5 h-5 text-red-500 mt-1" />
                      )}
                    </div>
                  )
                )
              })}
            </div>
          ) : (
            <div className="text-6xl font-bold flex items-center">
              <DollarSign className="w-12 h-12 mr-2" />
              {(tournament.entry_fee * players.length * (tournament.prize_percentage / 100)).toLocaleString()}
            </div>
          )}
        </div>

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
        {showSuccessModal && (
          <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
        )}
        {showErrorModal && (
          <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
        )}
        {canReprocessPayouts && (
          <Card className="mt-8 bg-gradient-to-br from-yellow-900/30 to-red-900/30 border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Payout Reprocessing</h3>
              <p className="mb-4">Some payouts have failed. Click the button below to attempt reprocessing.</p>
              <Button
                onClick={handleReprocessPayouts}
                disabled={isUpdating}
                className="w-full bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600 text-white font-bold"
              >
                {isUpdating ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Reprocessing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reprocess Payouts
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}


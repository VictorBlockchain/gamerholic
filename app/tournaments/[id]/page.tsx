"use client"

import { useParams } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"
import { TournamentDetailDesktop } from "@/components/desktop/tournaments/TournamentDetail"
import { TournamentDetailMobile } from "@/components/mobile/tournaments/TournamentDetails"
import { useState, useEffect } from "react"
import {
  getTournamentById,
  getTournamentWallet,
  getTournamentMatches,
  getTournamentPlayers,
  getPlayerDetails,
  getPlayerRecords,
  getTournamentTeams
} from "@/lib/service-tourmanent"
import { getTeamById } from "@/lib/service-team"
import { supabase } from "@/lib/supabase"

export default function TournamentPage() {
  const params = useParams()
  const isMobile = useMobile()
  const [tournament, setTournament] = useState(null)
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [host, setHost] = useState(null)
  const [walletBalance, setWalletBalance] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [winner, setWinner] = useState(null)
  useEffect(() => {
    fetchTournamentData()
  }, [])

  const fetchTournamentData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Get tournament data
      const tournament:any = await getTournamentById(Number(params.id))
      if (!tournament) {
        throw new Error("Tournament not found")
      }
      
      // Get tournament wallet
      const wallet:any = await getTournamentWallet(Number(params.id))
      if (wallet) {
        setWalletBalance(wallet)
      }

      // Get matches
      const matchesData:any = await getTournamentMatches(Number(params.id))
      setMatches(matchesData)

      // Get participants (players or teams)
      let participantIds = []
      const participantDetails:any = []

      if (tournament.is_team_tournament) {
        // Get team IDs
        const teamIds = await getTournamentTeams(Number(params.id))
        participantIds = teamIds
        
        // Get team details
        for (const teamId of teamIds) {
          const team = await getTeamById(teamId)
          if (team) {
            participantDetails.push(team)
          }
        }

        setTeams(participantDetails)
      } else {
        // Get player IDs
        const playerIds = await getTournamentPlayers(Number(params.id))
        participantIds = playerIds

        if (playerIds.length > 0) {
          // Get player details
          const playerDetails = await getPlayerDetails(playerIds)
          
          // Get player records
          const playerRecords = await getPlayerRecords(playerIds, tournament.game)
          
          // Combine player details with records
          const enrichedPlayers:any = playerDetails.map((player) => {
            const record = playerRecords.find((r) => r.player === player.player) || {}
            return {
              ...player,
              wins: record.wins || 0,
              losses: record.losses || 0,
              win_streak: record.win_streak || 0,
              loss_streak: record.loss_streak || 0,
            }
          })
          
          setPlayers(enrichedPlayers)
        }
      }

      // Get host details
      const hostData = await getPlayerDetails([tournament.host_id])
      if (hostData.length > 0) {
        setHost(hostData[0])
      }

      // If tournament is completed, get winner
      if (tournament.status === "completed" || tournament.status === "paid") {
        const { data: resultsData } = await supabase
          .from("tournament_results")
          .select("*")
          .eq("tournament_id", params.id)
          .eq("position", 1)
          .single()

        if (resultsData) {
          if (tournament.is_team_tournament) {
            const team:any = await getTeamById(resultsData.player_id)
            if (team) {
              setWinner(team)
            }
          } else {
            const winnerDetails = await getPlayerDetails([resultsData.player_id])
            if (winnerDetails.length > 0) {
              setWinner(winnerDetails[0])
            }
          }
        }
      }

      setTournament(tournament)
    } catch (error:any) {
      console.error("Error fetching tournament data:", error)
      setError(error.message || "Failed to fetch tournament data")
    } finally {
      setIsLoading(false)
    }
  }

  const tournamentData = {
    tournament,
    matches,
    players,
    teams,
    host,
    walletBalance,
    winner,
    isLoading,
    error,
    refreshData: fetchTournamentData,
  }

  return isMobile ? <TournamentDetailMobile {...tournamentData} /> : <TournamentDetailDesktop {...tournamentData} />
}


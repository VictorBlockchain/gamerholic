"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gamepad, Calendar, Users, Trophy, PlusCircle } from "lucide-react"
import { JoinTournamentModal } from "./tournament-join-modal"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import moment from "moment"

interface Tournament {
  game_id: number
  title: string
  game: string
  console: string
  entry_fee: number
  prize_percentage: number
  start_date: string
  max_players: number
  prize_type: string
  status: "upcoming" | "in-progress" | "completed" | "paid"
  image_url: string
  money: number
}

export function TournamentList() {
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .neq("status", "completed") // Exclude tournaments with status 'completed'
        .order("start_date", { ascending: true })

      if (error) throw error

      setTournaments(data)
    } catch (error) {
      console.error("Error fetching tournaments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch tournaments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setIsJoinModalOpen(true)
  }

  const calculatePrizePool = async (tournament: Tournament) => {
    
    const { data:walletData, error: walletError } = await supabase
    .from("wallets")
    .select("*")
    .eq("tournament_id", tournament.game_id)
    .single()

    return tournament.entry_fee * tournament.max_players * (tournament.prize_percentage / 100) + walletData.solana
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading tournaments...</div>
  }

  if (tournaments.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20 p-8 text-center">
        <CardHeader>
          <CardTitle className="text-3xl mb-4">No Tournaments Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-6">
            There are no tournaments at the moment, but you can create one! As a tournament host, you'll earn 18% of the
            entry fees.
          </p>
          <p className="text-md mb-8">Create tournaments for Solana or GAMEr tokens and start earning today!</p>

          <Button
            className="text-lg px-6 py-3"
            onClick={() => document.dispatchEvent(new CustomEvent("switchToCreateTournament"))}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create a Tournament
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tournaments.map((tournament) => (
        <Card key={tournament.game_id} className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="relative">
            <Avatar className="w-full h-48 rounded-t-lg">
              <AvatarImage src={tournament.image_url} alt={tournament.game} className="object-cover" />
              <AvatarFallback>{tournament.game[0]}</AvatarFallback>
            </Avatar>
            <Badge
              className="absolute top-2 right-2"
              variant={
                tournament.status === "upcoming"
                  ? "default"
                  : tournament.status === "in-progress"
                    ? "secondary"
                    : "outline"
              }
            >
              {tournament.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl mb-2">{tournament.title}</CardTitle>
            <div className="space-y-2">
              <div className="flex items-center">
                <Gamepad className="w-4 h-4 mr-2" />
                <span>{tournament.game}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{moment(tournament.start_date).format("MMMM D, YYYY h:mm A")}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>{tournament.max_players} players</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                <span>
                  Prize Pool: {calculatePrizePool(tournament)}{" "}
                  {tournament.money === 1 ? "SOL" : "GAMER"}
                </span>
              </div>
            </div>
            <div className="mt-3">
              
              <Link href={`/tournaments/${tournament.game_id}`} passHref>
                <Button  className="flex-1 w-full">View Tournament</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
      {selectedTournament && (
        <JoinTournamentModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          tournamentId={selectedTournament.game_id.toString()}
          tournamentName={selectedTournament.title}
          entryFee={selectedTournament.entry_fee}
        />
      )}
    </div>
  )
}


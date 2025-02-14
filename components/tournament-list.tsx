"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gamepad, Calendar, Users, Trophy } from "lucide-react"
import { JoinTournamentModal } from "./tournament-join-modal"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
const moment = require("moment");

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
      const { data, error } = await supabase.from("tournaments").select("*").order("start_date", { ascending: true })

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

  const calculatePrizePool = (tournament: Tournament) => {
    return tournament.entry_fee * tournament.max_players * (tournament.prize_percentage / 100)
  }

  if (isLoading) {
    return <div>Loading tournaments...</div>
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
                <span>Prize Pool: {calculatePrizePool(tournament).toFixed(2)} {tournament.prize_type=='Solana' && ('SOL')} {tournament.prize_type=='GAMEr' && ('GAMEr')}</span>
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button
                className="flex-1"
                onClick={() => handleJoinTournament(tournament)}
                disabled={tournament.status !== "upcoming"}
              >
                {tournament.status === "upcoming"
                  ? "Join Tournament"
                  : tournament.status === "in-progress"
                    ? "In Progress"
                    : "Completed"}
              </Button>
              <Link href={`/tournaments/${tournament.game_id}`} passHref>
                <Button variant="outline">View Tournament</Button>
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


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

interface Tournament {
  id: string
  game_id: number
  title: string
  game: string
  console: string
  entryFee: number
  prizePool: number
  startDate: string
  playerCount: number
  maxPlayers: number
  status: "upcoming" | "in-progress" | "completed"
  imageUrl: string
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
      // TODO: Replace with actual API call
      const mockTournaments: Tournament[] = [
        {
          id: "1",
          game_id: 123456,
          title: "Fortnite Championship",
          game: "Fortnite",
          console: "PC",
          entryFee: 10,
          prizePool: 1000,
          startDate: "2023-07-15T18:00:00Z",
          playerCount: 64,
          maxPlayers: 128,
          status: "upcoming",
          imageUrl: "/placeholder.svg",
        },
        {
          id: "2",
          game_id: 234567,
          title: "Call of Duty: Warzone Showdown",
          game: "Call of Duty: Warzone",
          console: "PlayStation",
          entryFee: 15,
          prizePool: 1500,
          startDate: "2023-07-20T20:00:00Z",
          playerCount: 32,
          maxPlayers: 32,
          status: "in-progress",
          imageUrl: "/placeholder.svg",
        },
        // Add more mock tournaments as needed
      ]
      setTournaments(mockTournaments)
    } catch (error) {
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

  if (isLoading) {
    return <div>Loading tournaments...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tournaments.map((tournament) => (
        <Card key={tournament.id} className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="relative">
            <Avatar className="w-full h-48 rounded-t-lg">
              <AvatarImage src={tournament.imageUrl} alt={tournament.game} className="object-cover" />
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
                <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>
                  {tournament.playerCount} / {tournament.maxPlayers} players
                </span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                <span>Prize Pool: ${tournament.prizePool}</span>
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button
                className="flex-1"
                onClick={() => handleJoinTournament(tournament)}
                disabled={tournament.status !== "upcoming" || tournament.playerCount >= tournament.maxPlayers}
              >
                {tournament.status === "upcoming"
                  ? tournament.playerCount >= tournament.maxPlayers
                    ? "Full"
                    : "Join Tournament"
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
          tournamentId={selectedTournament.id}
          tournamentName={selectedTournament.title}
          entryFee={selectedTournament.entryFee}
        />
      )}
    </div>
  )
}


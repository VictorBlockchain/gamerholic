import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Trophy, PlusCircle } from "lucide-react"
import Image from "next/image"
import { NoGamesAvailable } from "@/components/no-games-available"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type React from "react"

interface Game {
  id: string
  game_id: number
  title: string
  thumbnail_image: string
  play_fee: number
  top_score: number
  top_scorer: string,
  users: {
    username: string
    avatar_url: string
  }
  boost: number
  category: string
}

interface GameGridProps {
  games: Game[]
  title: string
  icon: React.ReactNode
  className?: string
  showNoGamesMessage?: boolean
}

export function GameGrid({ games, title, icon, className, showNoGamesMessage = false }: GameGridProps) {
  
  return (
    <section className={`my-8 ${className}`}>
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-primary flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </h2>
      {games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <Card
              key={game.game_id}
              className={`game-card group hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${
                index % 3 === 0 ? "neon-border-1" : index % 3 === 1 ? "neon-border-2" : "neon-border-3"
              }`}
            >
              <div className="game-card-image relative overflow-hidden rounded-t-lg">
              <Link href={`/arcade/${game.game_id}`} className="text-primary hover:underline font-semibold">

                <Image
                  src={game.thumbnail_image || "/placeholder.svg"}
                  alt={game.title}
                  width={350}
                  height={200}
                  className="object-cover w-full h-48 transition-transform duration-300 transform group-hover:scale-110"
                />
                </Link>
              </div>
              <CardContent className="game-card-content p-4">
                <h3 className="game-card-title text-lg font-semibold mb-2 group-hover:text-secondary transition-colors duration-300">
                  {game.title}
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    0.10 SOL
                  </Badge>
                  <div className="game-card-info text-accent flex items-center">
                    <Trophy className="w-4 h-4 mr-1" />
                    {game.top_score}
                  </div>
                </div>
                {game.users && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Image
                          src={game.users.avatar_url || "/placeholder.svg"}
                          alt={game.users.username}
                          width={24}
                          height={24}
                          className="rounded-full mr-2"
                        />
                        <span className="text-xs text-muted-foreground">{game.users.username}</span>
                      </div>
                      <div className="game-card-info text-primary flex items-center">
                        <Zap className="w-4 h-4 mr-1" />
                        {game.boost}% Boost
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : showNoGamesMessage ? (
        <div className="flex flex-col items-center">
          <NoGamesAvailable />
          <Link href="/arcade-create" className="mt-6">
            <Button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create a New Game
            </Button>
          </Link>
        </div>
      ) : null}
    </section>
  )
}


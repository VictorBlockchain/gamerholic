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
  id: number
  title: string
  image: string
  playFee: number
  highScore: number
  highScorePlayer: {
    name: string
    avatar: string
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
              key={game.id}
              className={`game-card group hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${
                index % 3 === 0 ? "neon-border-1" : index % 3 === 1 ? "neon-border-2" : "neon-border-3"
              }`}
            >
              <div className="game-card-image relative overflow-hidden rounded-t-lg">
                <Image
                  src={
                    game.image
                      ? supabase.storage.from("game-images").getPublicUrl(game.image, {
                          transform: {
                            width: 350,
                            height: 200,
                            resize: "cover",
                          },
                        }).data.publicUrl
                      : "/placeholder.svg"
                  }
                  alt={game.title}
                  width={350}
                  height={200}
                  className="object-cover w-full h-48 transition-transform duration-300 transform group-hover:scale-110"
                />
              </div>
              <CardContent className="game-card-content p-4">
                <h3 className="game-card-title text-lg font-semibold mb-2 group-hover:text-secondary transition-colors duration-300">
                  {game.title}
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    {game.playFee} SOL
                  </Badge>
                  <div className="game-card-info text-accent flex items-center">
                    <Trophy className="w-4 h-4 mr-1" />
                    {game.highScore.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Image
                      src={game.highScorePlayer.avatar || "/placeholder.svg"}
                      alt={game.highScorePlayer.name}
                      width={24}
                      height={24}
                      className="rounded-full mr-2"
                    />
                    <span className="text-xs text-muted-foreground">{game.highScorePlayer.name}</span>
                  </div>
                  <div className="game-card-info text-primary flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    {game.boost}% Boost
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : showNoGamesMessage ? (
        <div className="flex flex-col items-center">
          <NoGamesAvailable />
          <Link href="/create-game" className="mt-6">
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


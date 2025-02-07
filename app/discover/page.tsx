"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { GameTable } from "@/components/game-table"
import { motion } from "framer-motion"

interface Game {
  id: string
  title: string
  image: string
  play_fee: number
  top_payout: number
  high_score: number
  top_scorer: string
  boosts: number
}

export default function DiscoverPage() {
  const [boostedGames, setBoostedGames] = useState<Game[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [games, setGames] = useState<Game[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    fetchBoostedGames()
    fetchGames()
  }, [])
  
  const fetchBoostedGames = async () => {
    const { data, error }:any = await supabase
      .from("games")
      .select("id, title, thumbnail_image, play_fee, top_payout, high_score, top_scorer, boosts")
      .gt("boosts", 0)
      .order("boosts", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching boosted games:", error)
    } else {
      setBoostedGames(data)
    }
  }
  
  const fetchGames = async () => {
    const { data, error }:any = await supabase
      .from("games")
      .select("id, title, thumbnail_image, play_fee, top_payout, high_score, top_scorer")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching games:", error)
    } else {
      setGames(data)
    }
  }
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <motion.h1
          className="text-4xl font-bold mb-6 text-primary neon-glow"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Discover Games
        </motion.h1>

        <motion.section
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-secondary">Boosted Games</h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4">
              {boostedGames.map((game) => (
                <Link href={`/play/${game.id}`} key={game.id}>
                  <Card className="w-64 game-card neon-border-1 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <CardContent className="p-4">
                      <div className="relative h-36 mb-2 rounded-md overflow-hidden">
                        <Image
                          src={game.image || "/placeholder.svg"}
                          alt={game.title}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md"
                        />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 truncate">{game.title}</h3>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                          {game.play_fee} SOL
                        </Badge>
                        <div className="flex items-center text-accent">
                          <Zap className="w-4 h-4 mr-1" />
                          {game.boosts}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-secondary">Search Games</h2>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full max-w-md bg-muted border-primary/20 focus:border-primary focus:ring-primary"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
        </motion.section>
        
      {games && games.length>0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-secondary">All Games</h2>
          <GameTable games={games} searchTerm={searchTerm} />
        </section>
      )}
      </main>
    </div>
  )
}
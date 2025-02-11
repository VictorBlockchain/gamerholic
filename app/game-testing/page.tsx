"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Header } from "@/components/header"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { GameTestingTable } from "@/components/game-testing-table"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { SuccessModal } from '@/components/success-modal'
import { ErrorModal } from '@/components/error-modal'

interface Game {
  id: string
  title: string
  thumbnail_image: string
  category: string
  created_at: string
  status: string
  tester: string | null
}

export default function GameTestingPage() {
  const { publicKey } = useWallet()
  const [games, setGames] = useState<Game[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")

  const { toast } = useToast()

  useEffect(() => {
    fetchGamesNeedingTest()
  }, [])
  
  const fetchGamesNeedingTest = async () => {
    const { data, error }:any = await supabase
      .from("arcade")
      .select("*")
      .eq("status", 1)
      .order("created_at", { ascending: false })
    
      console.log(data)
    if (error) {
      console.error("Error fetching games needing test:", error)
      toast({
        title: "Error",
        description: "Failed to fetch games for testing. Please try again.",
        variant: "destructive",
      })
    } else {
      setGames(data)
    }
  }

  const handleGameSelect = async (game: Game) => {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to select a game for testing.",
        variant: "destructive",
      })
      return
    }

    try {

      const response = await fetch("/api/games/test/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, user:publicKey }),
      })
      
      const result = await response.json()

      if (!result.success) {
        setShowErrorModal(false)
        setErrorMessage('error assigning tester')
      }
      
        setShowSuccessModal(true)
        setSuccessMessage('you are assigned as the tester')
      fetchGamesNeedingTest() // Refresh the list

    } catch (error) {
      console.error("Error assigning game for testing:", error)
      setShowErrorModal(false)
      setErrorMessage('error assigning tester')

    }
  }

  const filteredGames = games.filter((game) => game.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold mb-6 text-primary neon-glow text-center">Game Testing</h1>
        </motion.div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available Games for Testing</CardTitle>
            <CardDescription>Select a game to start testing and earn credits!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={fetchGamesNeedingTest}>Refresh List</Button>
            </div>
            <GameTestingTable games={filteredGames} onGameSelect={handleGameSelect} />
          </CardContent>
        </Card>
        {showSuccessModal && (
        <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
      )}
      {showErrorModal && (
        <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
      )}
      </main>

    </div>
  )
}


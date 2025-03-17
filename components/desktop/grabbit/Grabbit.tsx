"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Zap, Users, DollarSign, Trophy, PlusCircle, Gamepad2 } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { grabbitService } from "@/lib/services-grabbit"
import { GrabbitCreateModal } from "@/components/modals/grabbit-create-modal"
import { SuccessModal } from "@/components/modals/success-modal"
import { ErrorModal } from "@/components/modals/error-modal"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { FloatingElements } from "@/components/ui/floating-elements"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { CursorGlow } from "@/components/ui/cursor-glow"
import { MicroInteractions } from "@/components/ui/micro-interactions"

const GrabbitGameCard = ({ game }: any) => {
  const router = useRouter()
  const randomPageNumber = Math.floor(Math.random() * 11) + 1
  const imagePath = `/grabbit/grab${randomPageNumber}.jpg`
  
  return (
    <Card
      className="relative overflow-hidden group border border-[#fff] hover:border-primary/50 transition-all duration-300 cursor-pointer bg-gradient-to-br from-[#111] to-black rounded-xl"
      onClick={() => router.push(`/grabbit/${game.game_id}`)}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-30 group-hover:opacity-70 blur-md transition duration-300 rounded-xl"></div>
      <div className="relative">
        <CardHeader className="p-0">
          <div className="relative h-48 overflow-hidden rounded-t-xl">
            <img
              src={game.image || imagePath}
              alt={game.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <Badge className="bg-[#00FFA9] text-black font-bold mb-2">
                {game.title} {game.prize_token}
              </Badge>
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-[#00FFA9] border-[#00FFA9] bg-black/50 backdrop-blur-sm">
                  <Users className="w-4 h-4 mr-1" />
                  {game.players_ready}/{game.players_min}
                </Badge>
                <Badge variant="outline" className="text-[#FF007A] border-[#FF007A] bg-black/50 backdrop-blur-sm">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {game.entry_fee} SOL
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-gradient-to-b from-[#111] to-black">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              Players: {game.players_min}-{game.players_max}
            </p>
            <div className="text-xs text-[#00FFA9] font-semibold flex items-center">
              <Trophy className="w-3 h-3 mr-1" />
              Join Now
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

export default function DesktopGrabbit() {
  const [currentPage, setCurrentPage] = useState(1)
  const gamesPerPage = 9
  const [gamesData, setGamesData] = useState<any[]>([])
  const [showCreatePractice, setShowCreatePractice] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")

  const { isAuthenticated, player } = useUser()

  const indexOfLastGame = currentPage * gamesPerPage
  const indexOfFirstGame = indexOfLastGame - gamesPerPage
  const currentGames = gamesData.slice(indexOfFirstGame, indexOfLastGame)
  const totalPages = Math.ceil(gamesData.length / gamesPerPage)

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    const { gamesData, showCreatePractice } = await grabbitService.fetchGames()
    setGamesData(gamesData || [])
    setShowCreatePractice(showCreatePractice)
  }
  
  const handleCreatePractice = async () => {
    if (!player) return
    
    const data = await grabbitService.handleCreatePractice(player)
    console.log(data)
    if (data.success) {
      setSuccessMessage("Practice game created")
      setShowSuccessModal(true)
      fetchGames()
    } else {
      setErrorMessage(data.message || "Error creating practice game")
      setShowErrorModal(true)
    }
  }

  const handleCreateGame = async (gameData: any) => {
    const response = await grabbitService.handleCreateGame(gameData)

    if (response.success) {
      setSuccessMessage("Game created successfully")
      setShowSuccessModal(true)
      fetchGames()
    } else {
      setErrorMessage(response.message || "Error creating game")
      setShowErrorModal(true)
    }

    setShowCreateModal(false)
  }

  return (
    <div className="relative min-h-screen">
      <CursorGlow />
      <div className="container mx-auto p-4 space-y-12 relative z-10">
        <section className="mb-12 text-center mt-9">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-70 blur-lg"></div>
              <div className="relative bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] py-16 px-4 rounded-3xl border border-[#333]">
                <FloatingElements count={6} />

                <div className="relative z-10">
                  <AnimatedGradientText className="text-5xl md:text-6xl font-bold mb-6">
                    Grabbit Game
                  </AnimatedGradientText>

                  <h2 className="text-2xl md:text-3xl mb-8 text-white">
                    <Sparkles className="inline-block mr-2 h-8 w-8 text-[#00FFA9]" />
                    Win Crypto Prizes in Fast-Paced Multiplayer Action
                    <Sparkles className="inline-block ml-2 h-8 w-8 text-[#FF007A]" />
                  </h2>

                  <div className="flex flex-wrap justify-center gap-8 mb-10">
                    <MicroInteractions>
                      <div className="flex items-center bg-black/30 backdrop-blur-md px-5 py-3 rounded-full border border-[#333]">
                        <Zap className="h-6 w-6 mr-3 text-yellow-300" />
                        <span className="text-lg">Lightning Fast</span>
                      </div>
                    </MicroInteractions>

                    <MicroInteractions delay={0.1}>
                      <div className="flex items-center bg-black/30 backdrop-blur-md px-5 py-3 rounded-full border border-[#333]">
                        <Users className="h-6 w-6 mr-3 text-blue-300" />
                        <span className="text-lg">Multiplayer Action</span>
                      </div>
                    </MicroInteractions>

                    <MicroInteractions delay={0.2}>
                      <div className="flex items-center bg-black/30 backdrop-blur-md px-5 py-3 rounded-full border border-[#333]">
                        <Trophy className="h-6 w-6 mr-3 text-yellow-500" />
                        <span className="text-lg">Crypto Rewards</span>
                      </div>
                    </MicroInteractions>
                  </div>

                  {showCreatePractice && isAuthenticated && (
                    <div className="text-center mt-8">
                      <Button
                        onClick={handleCreatePractice}
                        className="bg-gradient-to-r from-[#FF007A] to-[#FF6B00] hover:from-[#D60067] hover:to-[#D65800] text-white font-medium rounded-full"
                      >
                        <Gamepad2 className="mr-2 h-5 w-5" />
                        Create Practice Game
                      </Button>
                    </div>
                  )}

                  {!isAuthenticated && (
                    <div className="text-center mt-8 bg-black/30 backdrop-blur-md px-6 py-4 rounded-xl inline-block">
                      <h3 className="text-xl text-[#00FFA9]">Connect wallet to create game</h3>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {gamesData && gamesData.length > 0 && (
          <ScrollReveal>
            <div className="space-y-8">
              <div className="text-center">
                <AnimatedGradientText className="text-4xl font-bold mb-2">Available Grabbit Games</AnimatedGradientText>
                <p className="text-gray-400 text-lg mb-8">Choose a game to join or create your own</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentGames.map((game: any) => (
                  <MicroInteractions key={game.game_id}>
                    <GrabbitGameCard game={game} />
                  </MicroInteractions>
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 p-0 ${currentPage === i + 1 ? "text-white" : "text-gray-400"}`}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl my-16">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-teal-500 opacity-70 blur-lg"></div>
            <div className="relative bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] p-10 rounded-3xl border border-[#333]">
              <div className="text-center space-y-6">
                <AnimatedGradientText className="text-4xl font-bold" fromColor="#00FFA9" toColor="#00C3FF">
                  Create Your Own Grabbit Game
                </AnimatedGradientText>

                <div className="max-w-3xl mx-auto">
                  <p className="text-xl text-gray-300 mb-8">
                    Create multi-player games to win Solana or other token prizes. Earn 10% of entry fees collected for
                    Solana prizes. Players must hold 1,000,000 or more of GAME tokens to play or create games.
                  </p>
                </div>
                
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-[#FF007A] to-[#FF6B00] hover:from-[#D60067] hover:to-[#D65800] text-white font-medium rounded-full"
                  disabled={!isAuthenticated}
                >
                  <PlusCircle className="mr-2 h-6 w-6" />
                  Create Grabbit Game
                </Button>

                {!isAuthenticated && <p className="text-yellow-400 mt-4">Connect your wallet to create games</p>}
              </div>
            </div>
          </div>
        </ScrollReveal> */}
      </div>

      {/* <GrabbitCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGame}
        publicKey={player}
      /> */}

      {showSuccessModal && (
        <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
      )}

      {showErrorModal && (
        <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
      )}
    </div>
  )
}


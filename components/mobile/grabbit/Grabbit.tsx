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
import { MicroInteractions } from "@/components/ui/micro-interactions"

const MobileGrabbitGameCard = ({ game }: any) => {
  const router = useRouter()
  const randomPageNumber = Math.floor(Math.random() * 6) + 1
  const imagePath = `/grab${randomPageNumber}.jpg`

  return (
    <Card
      className="relative overflow-hidden group border border-[#333] hover:border-primary/50 transition-all duration-300 cursor-pointer bg-gradient-to-br from-[#111] to-black rounded-xl"
      onClick={() => router.push(`/grabbit/${game.game_id}`)}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-30 group-hover:opacity-70 blur-md transition duration-300 rounded-xl"></div>
      <div className="relative">
        <CardHeader className="p-0">
          <div className="relative h-32 overflow-hidden rounded-t-xl">
            <img
              src={game.image || imagePath}
              alt={game.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            <div className="absolute bottom-2 left-2 right-2">
              <Badge className="bg-[#00FFA9] text-black text-xs font-bold mb-1">
                {game.title} {game.prize_token}
              </Badge>
              <div className="flex justify-between items-center">
                <Badge
                  variant="outline"
                  className="text-[#00FFA9] border-[#00FFA9] bg-black/50 backdrop-blur-sm text-xs"
                >
                  <Users className="w-3 h-3 mr-1" />
                  {game.players_ready}/{game.players_min}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[#FF007A] border-[#FF007A] bg-black/50 backdrop-blur-sm text-xs"
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  {game.entry_fee} SOL
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 bg-gradient-to-b from-[#111] to-black">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">
              Players: {game.players_min}-{game.players_max}
            </p>
            <div className="text-xs text-[#00FFA9] font-semibold flex items-center">
              <Trophy className="w-3 h-3 mr-1" />
              Join
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

export default function MobileGrabbit() {
  const [currentPage, setCurrentPage] = useState(1)
  const gamesPerPage = 6
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
    <div className="p-4 space-y-6 relative z-10">
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-70 blur-md"></div>
          <div className="relative bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] py-8 px-4 rounded-2xl border border-[#333]">
            <div className="relative z-10">
              <AnimatedGradientText className="text-3xl font-bold mb-3">Grabbit Game</AnimatedGradientText>

              <h2 className="text-lg mb-4 text-white">
                <Sparkles className="inline-block mr-1 h-4 w-4 text-[#00FFA9]" />
                Win Crypto Prizes
                <Sparkles className="inline-block ml-1 h-4 w-4 text-[#FF007A]" />
              </h2>

              <div className="flex flex-wrap justify-center gap-3 mb-5">
                <div className="flex items-center bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-[#333] text-sm">
                  <Zap className="h-3 w-3 mr-1 text-yellow-300" />
                  <span>Fast</span>
                </div>

                <div className="flex items-center bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-[#333] text-sm">
                  <Users className="h-3 w-3 mr-1 text-blue-300" />
                  <span>Multiplayer</span>
                </div>

                <div className="flex items-center bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-[#333] text-sm">
                  <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                  <span>Rewards</span>
                </div>
              </div>

              {showCreatePractice && isAuthenticated && (
                <div className="text-center mt-4">
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
                <div className="text-center mt-4 bg-black/30 backdrop-blur-md px-3 py-2 rounded-xl inline-block">
                  <p className="text-sm text-[#00FFA9]">Connect wallet to create game</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {gamesData && gamesData.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <AnimatedGradientText className="text-2xl font-bold mb-1">Available Games</AnimatedGradientText>
            <p className="text-gray-400 text-sm mb-4">Tap a game to join</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {currentGames.map((game: any) => (
              <MicroInteractions key={game.game_id}>
                <MobileGrabbitGameCard game={game} />
              </MicroInteractions>
            ))}
          </div>

          <div className="flex justify-center mt-4">
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 p-0 text-xs ${currentPage === i + 1 ? "text-white" : "text-gray-400"}`}
                  glowColor={currentPage === i + 1 ? "from-[#00FFA9] to-[#00C3FF]" : "from-gray-700 to-gray-600"}
                  pulseGlow={currentPage === i + 1}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* <div className="relative overflow-hidden rounded-2xl my-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-teal-500 opacity-70 blur-md"></div>
        <div className="relative bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] p-6 rounded-2xl border border-[#333]">
          <div className="text-center space-y-4">
            <AnimatedGradientText className="text-xl font-bold" fromColor="#00FFA9" toColor="#00C3FF">
              Create Your Own Game
            </AnimatedGradientText>
            
            <div>
              <p className="text-sm text-gray-300 mb-4">
                Create games to win Solana or other token prizes. Earn 10% of entry fees for Solana prizes. Requires
                1,000,000+ GAME tokens.
              </p>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              glowColor="from-green-500 to-teal-500"
              className="px-4 py-2 text-sm font-bold"
              pulseGlow
              disabled={!isAuthenticated}
            >
              <PlusCircle className="mr-1 h-4 w-4" />
              Create Game
            </Button>
            
            {!isAuthenticated && <p className="text-yellow-400 text-xs mt-2">Connect wallet to create games</p>}
          </div>
        </div>
      </div> */}

      <GrabbitCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGame}
        publicKey={player}
      />

      {showSuccessModal && (
        <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
      )}

      {showErrorModal && (
        <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
      )}
    </div>
  )
}


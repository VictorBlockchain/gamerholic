"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PrizeAvatar } from "@/components/prize-avatar"
import { ActionButtons } from "@/components/action-buttons"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  Users,
  Clock,
  Trophy,
  Coins,
  Hand,
  Grab,
  Footprints,
  AlertTriangle,
  Loader2,
  Wallet,
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useUser } from "@/contexts/user-context"
import { grabbitService, type GameData } from "@/lib/services-grabbit"
import { JoinGameModal } from "@/components/modals/grabbit-join-modal"
import { GrabbitClaimModal } from "@/components/modals/grabbit-claim-modal"
import { SuccessModal } from "@/components/modals/success-modal"
import { ErrorModal } from "@/components/modals/error-modal"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { MicroInteractions } from "@/components/ui/micro-interactions"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { CursorGlow } from "@/components/ui/cursor-glow"

interface GrabbitGameProps {
  gameId: string
}

export default function DesktopGrabbitGame({ gameId }: GrabbitGameProps) {
  const { player, profile } = useUser()
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [playerData, setPlayerData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("players")
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [gameWalletBalance, setGameWalletBalance] = useState(0)
  const [timeLeft, setTimeLeft] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  const [isClaiming, setIsClaiming] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const supabase = createClientComponentClient()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isLeaderRef = useRef(false)

  useEffect(() => {
    fetchNSetGame()
  }, [gameId])

  const fetchNSetGame = async () => {
    const { gameData, gameWalletBalance } = await grabbitService.fetchNSetGame(gameId)
    setGameData(gameData)
    setGameWalletBalance(gameWalletBalance)
  }
  
  useEffect(() => {
    const channel = supabase
      .channel("table-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grabbit",
          filter: `game_id=eq.${gameId}`,
        },
        (payload: any) => {
          const data = payload.new
          const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== null && value !== undefined),
          )

          setGameData((prevGameData: any) => {
            const updatedData = { ...prevGameData, ...filteredData }
            let timeL: any

            if (updatedData.status === 2) {
              timeL = grabbitService.calculateTimeDifference(updatedData.start_time)
              setTimeLeft(timeL)
            }
            if (updatedData.status === 3) {
              timeL = grabbitService.calculateTimeDifference(updatedData.end_time)
              setTimeLeft(timeL)
            }

            if (updatedData.players && player) {
              const playerObj = updatedData.players.find((player: any) => player.player === player.toString())
              if (playerObj) {
                setPlayerData(playerObj)
              }
            }
            return updatedData
          })
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [gameId, player, supabase])

  useEffect(() => {
    if (player) {
      tryBecomeLeader()
      const leaderCheckInterval = setInterval(tryBecomeLeader, 1000)
      const heartbeatInterval = setInterval(sendHeartbeat, 1000)

      return () => {
        clearInterval(leaderCheckInterval)
        clearInterval(heartbeatInterval)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [player, supabase])

  const tryBecomeLeader = async () => {
    if (!player) return

    const isLeader = await grabbitService.tryBecomeLeader(player, supabase)

    if (isLeader && !isLeaderRef.current) {
      isLeaderRef.current = true
      fetchGameData()

      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchGameData, 1000)
      }
    }
  }

  const sendHeartbeat = async () => {
    if (isLeaderRef.current && player) {
      await grabbitService.sendHeartbeat(player, supabase)
    }
  }

  const fetchGameData = async () => {
    if (!player) return
    await grabbitService.fetchGameData(gameId, player)
  }

  const handleSlap = async () => {
    if (!player) return

    const response = await grabbitService.handleSlap(gameId, player)

    setActionMessage(response.message || "")
    setTimeout(() => {
      setActionMessage("")
    }, 3000)
  }

  const handleGrab = async () => {
    if (!player || !profile) return

    const response = await grabbitService.handleGrab(
      gameId,
      player,
      profile.username || "",
      profile.avatar_url || "",
    )

    setActionMessage(response.message || "")
    setTimeout(() => {
      setActionMessage("")
    }, 3000)
  }

  const handleSneak = async () => {
    if (!player) return

    const response = await grabbitService.handleSneak(gameId, player)

    setActionMessage(response.message || "")
    setTimeout(() => {
      setActionMessage("")
    }, 3000)
  }

  const handleJoinGame = () => {
    setShowJoinModal(true)
  }

  const handleConfirmJoin = async () => {
    if (!player) return
    setIsJoining(true)
    const response = await grabbitService.handleConfirmJoin(gameId, player)
    if (response.success) {
      setSuccessMessage("You have joined the game")
      setShowSuccessModal(true)
      setPlayerData(response.data[0])
    } else {
      setErrorMessage(response.message || "Error joining game")
      setShowErrorModal(true)
    }
    setIsJoining(false)
    setShowJoinModal(false)
  }
  
  const handleReload = async () => {
    if (!player) return
    
    const response = await grabbitService.handleReload(gameId, player)
    setPlayerData(response.playerData)
    setGameData(response.gameData)
    
  }
  const handleClaimPrize = async () => {
    if (!player) return

    setIsClaiming(true)

    const response = await grabbitService.handleClaimPrize(gameId, player)

    if (response.success) {
      setSuccessMessage("Prize claimed successfully!")
      setShowSuccessModal(true)
      fetchNSetGame()
    } else {
      setErrorMessage(response.message || "Error claiming prize")
      setShowErrorModal(true)
    }

    setShowClaimModal(false)
    setIsClaiming(false)
  }

  if (!gameData) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md p-8 bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl relative overflow-hidden">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-30 blur-md"></div>
          <div className="relative flex flex-col items-center space-y-6">
            <Loader2 className="w-20 h-20 text-[#00FFA9] animate-spin" />
            <h2 className="text-3xl font-bold text-white animate-pulse">Loading Grabbit Game...</h2>
            <p className="text-center text-gray-300 text-lg">Get ready to grab, slap, and sneak your way to victory!</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <CursorGlow />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-8">
            <a href="/grabbit" className="inline-block">
              <AnimatedGradientText className="text-5xl font-bold mb-2">Grabbit</AnimatedGradientText>
            </a>
            <h2 className="text-2xl font-semibold text-white mb-2 animate-pulse">
              <Sparkles className="inline-block mr-2 text-[#00FFA9]" />
              Win Crypto Prizes!
              <Sparkles className="inline-block ml-2 text-[#FF007A]" />
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal>
            <Card className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl overflow-hidden relative">
              {/* <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-30 blur-md"></div> */}
              <CardContent className="p-8 relative">
                <MicroInteractions>
                  <div className="relative mb-8">
                    <PrizeAvatar
                      imageSrc={gameData.winner_avatar || gameData.image}
                      prizeName={gameData.title}
                      timeLeft={timeLeft}
                      winner={gameData.winner_name || "No winner yet"}
                      status={gameData.status}
                      prize_token={gameData.prize_token}
                    />
                  </div>
                </MicroInteractions>

                <div className="text-center mb-6">
                  <Badge className="text-lg px-4 py-2 bg-black/50 backdrop-blur-md border border-[#00FFA9] text-[#00FFA9]">
                    <Trophy className="inline-block mr-2 text-yellow-400" />
                    Prize: {gameWalletBalance || 0} SOL
                  </Badge>
                </div>

                {gameData.status === 4 && gameData.winner === player && !gameData.prize_claimed && (
                  <MicroInteractions>
                    <div className="text-center mb-6">
                      <Button
                        onClick={() => setShowClaimModal(true)}
                        className="w-full bg-gradient-to-r from-[#FF007A] to-[#FF6B00] hover:from-[#D60067] hover:to-[#D65800] text-white font-medium rounded-full"
                      >
                        <Trophy className="mr-2 h-5 w-5" />
                        Claim Your Prize
                      </Button>
                    </div>
                  </MicroInteractions>
                )}

                {gameData.status === 4 && gameData.prize_claimed && (
                  <MicroInteractions>
                    <div className="text-center mb-6">
                      <Button
                        className="w-full px-6 py-3 text-lg font-bold"
                        asChild
                      >
                        <a
                          href={`https://solscan.io/tx/${gameData.prize_claim_tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Wallet className="mr-2 h-5 w-5" />
                          Prize Claimed - View Transaction
                        </a>
                      </Button>
                    </div>
                  </MicroInteractions>
                )}

                {gameData.players &&
                  gameData.players.length > 0 &&
                  player &&
                  gameData.players.some((playerObj: any) => playerObj.player === player) && (
                    <>
                      <MicroInteractions>
                        <div className="mb-4">
                          <ActionButtons
                            onSlap={handleSlap}
                            onGrab={handleGrab}
                            onSneak={handleSneak}
                            grabs={playerData?.grabs}
                            slaps={playerData?.slaps}
                            sneaks={playerData?.sneaks}
                          />
                        </div>
                      </MicroInteractions>
                      <div className="mt-3">
                        <p className="text-center text-white p3 animate-pulse">{actionMessage}</p>
                      </div>
                    </>
                  )}

                {gameData.players &&
                  Array.isArray(gameData.players) &&
                  player &&
                  !gameData.players.some((playerObj: any) => playerObj.player === player) && (
                    <MicroInteractions>
                      <div>
                        <Button onClick={handleJoinGame} className="bg-[#111] hover:bg-[#222] text-white border border-[#00FFA9] rounded-full relative overflow-hidden group w-full">
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-50 transition-opacity"></span>
                          <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-transparent opacity-30 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                          <span className="relative">Join Game</span>
                        </Button>

                      </div>
                    </MicroInteractions>
                  )}
              </CardContent>
            </Card>
            <div className="space-y-2 mt-5">
                  <Button onClick={handleReload} className="bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 text-white rounded-full w-full">
                      Reload
                    </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Card className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl overflow-hidden relative">
              {/* <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-30 blur-md"></div> */}
              <CardContent className="p-8 relative">
                <Tabs defaultValue="players" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-black/50 backdrop-blur-md p-1 rounded-full border border-[#333]">
                    <TabsTrigger
                      value="players"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Players
                    </TabsTrigger>
                    <TabsTrigger
                      value="prize-info"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
                    >
                      <Trophy className="mr-2 h-5 w-5" />
                      Prize Info
                    </TabsTrigger>
                    <TabsTrigger
                      value="rules"
                      className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
                    >
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Rules
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="players">
                    <MicroInteractions>
                      <div className="bg-black/30 backdrop-blur-md p-4 rounded-xl border border-[#333] mb-4">
                        <p className="text-[#00FFA9] text-lg text-center font-bold mb-2">
                          Players: {gameData.players_ready} / {gameData.players_min} |{" "}
                          <small>{gameData.players_max} max</small>
                        </p>
                        <Progress
                          value={(gameData.players_ready / gameData.players_min) * 100}
                          className="w-full h-2 bg-[#333]"
                          indicatorClassName="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF]"
                        />
                      </div>
                    </MicroInteractions>

                    <ScrollArea className="h-[300px] w-full rounded-xl border border-[#333] bg-black/30 backdrop-blur-md p-4">
                      <div className="space-y-4">
                        {gameData && Array.isArray(gameData.players) && gameData.players.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                              <thead>
                                <tr className="border-b border-[#333]">
                                  <th className="p-2 text-center text-[#00FFA9]">Player</th>
                                  <th className="p-2 text-center text-[#00FFA9]">
                                    <Grab className="inline-block mr-1 h-4 w-4" />
                                    Grabs
                                  </th>
                                  <th className="p-2 text-center text-[#00FFA9]">
                                    <Hand className="inline-block mr-1 h-4 w-4" />
                                    Slaps
                                  </th>
                                  <th className="p-2 text-center text-[#00FFA9]">
                                    <Footprints className="inline-block mr-1 h-4 w-4" />
                                    Sneaks
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {gameData.players.map((data: any, index: number) => (
                                  <tr
                                    key={index}
                                    className={`border-b border-[#222] hover:bg-[#111] transition-colors ${
                                      data.player === player ? "bg-[#111]/50" : ""
                                    }`}
                                  >
                                    <td className="p-2 font-medium text-center">
                                      {data.player === player ? (
                                        <span className="text-[#00FFA9]">{data.player_name} (You)</span>
                                      ) : (
                                        data.player_name
                                      )}
                                    </td>
                                    <td className="p-2 text-center">{data.grabs_used || 0}</td>
                                    <td className="p-2 text-center">{data.slaps_used || 0}</td>
                                    <td className="p-2 text-center">{data.sneaks_used || 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center text-[#00FFA9] text-xl py-12">
                            <Users className="inline-block mr-2 h-6 w-6" />
                            No players yet
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="prize-info">
                    <div className="space-y-6 bg-black/30 backdrop-blur-md p-6 rounded-xl border border-[#333]">
                      <h3 className="text-2xl font-semibold text-[#00FFA9]">{gameData.title}</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black/50 p-4 rounded-xl border border-[#222] flex items-center">
                          <Coins className="mr-3 h-8 w-8 text-yellow-400" />
                          <div>
                            <p className="text-gray-400 text-sm">Prize Value</p>
                            <p className="text-xl font-bold text-white">{gameWalletBalance} SOL</p>
                          </div>
                        </div>

                        <div className="bg-black/50 p-4 rounded-xl border border-[#222] flex items-center">
                          <Clock className="mr-3 h-8 w-8 text-blue-400" />
                          <div>
                            <p className="text-gray-400 text-sm">Hold Time</p>
                            <p className="text-xl font-bold text-white">10s (3s for Sneak)</p>
                          </div>
                        </div>

                        <div className="bg-black/50 p-4 rounded-xl border border-[#222] flex items-center">
                          <Users className="mr-3 h-8 w-8 text-green-400" />
                          <div>
                            <p className="text-gray-400 text-sm">Players</p>
                            <p className="text-xl font-bold text-white">
                              {gameData.players_ready} / {gameData.players_max} (Min: {gameData.players_min})
                            </p>
                          </div>
                        </div>

                        {gameData.title !== "practice" && (
                          <div className="bg-black/50 p-4 rounded-xl border border-[#222] flex items-center">
                            <Wallet className="mr-3 h-8 w-8 text-purple-400" />
                            <div>
                              <p className="text-gray-400 text-sm">Wallet</p>
                              <a
                                href={`https://solscan.io/account/${gameData.wallet}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xl font-bold text-white hover:text-[#00FFA9] transition-colors"
                              >
                                {`${gameData.wallet.slice(0, 6)}...${gameData.wallet.slice(-4)}`}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6">
                        <p className="text-lg text-[#00FFA9] mb-3">Free Actions:</p>
                        <div className="flex space-x-4">
                          <Badge
                            variant="outline"
                            className="flex items-center bg-black/50 px-3 py-2 text-[#00FFA9] border-[#00FFA9]"
                          >
                            <Grab className="mr-2 h-5 w-5" />
                            Grabs: {gameData.free_grabs}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="flex items-center bg-black/50 px-3 py-2 text-[#FF007A] border-[#FF007A]"
                          >
                            <Hand className="mr-2 h-5 w-5" />
                            Slaps: {gameData.free_slaps}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="flex items-center bg-black/50 px-3 py-2 text-[#00C3FF] border-[#00C3FF]"
                          >
                            <Footprints className="mr-2 h-5 w-5" />
                            Sneaks: {gameData.free_sneaks}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="rules">
                    <ScrollArea className="h-[400px] w-full rounded-xl border border-[#333] bg-black/30 backdrop-blur-md p-6">
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold text-[#00FFA9] mb-2">How to Play Grabbit</h3>
                          <div className="h-1 w-24 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] mx-auto rounded-full"></div>
                        </div>

                        <p className="text-lg text-gray-300">
                          Grabbit is a fast-paced game where players compete to win crypto prizes. The objective is to
                          hold the prize when the timer hits zero.
                        </p>

                        <div className="space-y-4 mt-6">
                          <h4 className="text-xl font-semibold text-white">Game Actions:</h4>

                          <div className="bg-black/50 p-4 rounded-xl border border-[#222] flex items-start space-x-4">
                            <div className="bg-[#00FFA9]/20 p-3 rounded-full">
                              <Grab className="h-8 w-8 text-[#00FFA9]" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-[#00FFA9] mb-1">Grab</p>
                              <p className="text-gray-300">
                                Hold the prize for 10 seconds to win. If you successfully hold it for the full duration,
                                you'll win the prize!
                              </p>
                            </div>
                          </div>

                          <div className="bg-black/50 p-4 rounded-xl border border-[#222] flex items-start space-x-4">
                            <div className="bg-[#FF007A]/20 p-3 rounded-full">
                              <Hand className="h-8 w-8 text-[#FF007A]" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-[#FF007A] mb-1">Slap</p>
                              <p className="text-gray-300">
                                Knock the prize out of other players' hands. Use this to prevent others from winning
                                when they're close to the 10-second mark.
                              </p>
                            </div>
                          </div>

                          <div className="bg-black/50 p-4 rounded-xl border border-[#222] flex items-start space-x-4">
                            <div className="bg-[#00C3FF]/20 p-3 rounded-full">
                              <Footprints className="h-8 w-8 text-[#00C3FF]" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-[#00C3FF] mb-1">Sneak</p>
                              <p className="text-gray-300">
                                Grab the prize with only a 3-second timer. This is a faster way to win, but you have
                                limited sneaks available.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#00FFA9]/10 p-5 rounded-xl border border-[#00FFA9]/30 mt-6">
                          <p className="text-lg text-white">
                            <span className="text-[#00FFA9] font-bold">PRO TIP:</span> Use your limited actions wisely
                            to outmaneuver other players and claim the prize! Watch the other players and time your
                            actions strategically.
                          </p>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <JoinGameModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onJoin={handleConfirmJoin}
          gameData={gameData}
          isJoining={isJoining}
        />

        <GrabbitClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          onConfirm={handleClaimPrize}
          userName={profile?.username || ""}
          prizeAmount={gameWalletBalance}
          isClaiming={isClaiming}
        />

        {showSuccessModal && (
          <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
        )}

        {showErrorModal && (
          <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
        )}
      </div>
    </div>
  )
}


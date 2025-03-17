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

interface GrabbitGameProps {
  gameId: string
}

export default function MobileGrabbitGame({ gameId }: GrabbitGameProps) {
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
    setPlayerData([])
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
      <div className="px-4 py-6 flex items-center justify-center min-h-[50vh]">
        <Card className="w-full p-6 bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl relative overflow-hidden">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-30 blur-md"></div>
          <div className="relative flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-[#00FFA9] animate-spin" />
            <h2 className="text-xl font-bold text-white animate-pulse">Loading Grabbit Game...</h2>
            <p className="text-center text-gray-300 text-sm">Get ready to grab, slap, and sneak your way to victory!</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 relative z-10">
      <div className="text-center mb-6">
        <a href="/grabbit" className="inline-block">
          <AnimatedGradientText className="text-3xl font-bold mb-1">Grabbit</AnimatedGradientText>
        </a>
        <h2 className="text-lg font-semibold text-white mb-2 animate-pulse">
          <Sparkles className="inline-block mr-1 h-4 w-4 text-[#00FFA9]" />
          Win Crypto Prizes!
          <Sparkles className="inline-block ml-1 h-4 w-4 text-[#FF007A]" />
        </h2>
      </div>

      <MicroInteractions>
        <Card className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl overflow-hidden relative mb-4">
          {/* <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-30 blur-md"></div> */}
          <CardContent className="p-4 relative">
            <div className="relative mb-4">
              <PrizeAvatar
                imageSrc={gameData.winner_avatar || gameData.image}
                prizeName={gameData.title}
                timeLeft={timeLeft}
                winner={gameData.winner_name || "No winner yet"}
                status={gameData.status}
                prize_token={gameData.prize_token}
              />
            </div>
            <div className="text-center mb-4">
              <Badge className="text-md px-3 py-1 bg-black/50 backdrop-blur-md border border-[#00FFA9] text-[#00FFA9]">
                <Trophy className="inline-block mr-1 h-4 w-4 text-yellow-400" />
                Prize: {gameWalletBalance || 0} SOL
              </Badge>
            </div>
            {gameData.status === 4 && gameData.winner === player && !gameData.prize_claimed && (
              <div className="text-center mb-4">
                <Button
                  onClick={() => setShowClaimModal(true)}
                  className="w-full px-4 py-2 text-sm font-bold"
                >
                  <Trophy className="mr-1 h-4 w-4" />
                  Claim Your Prize
                </Button>
              </div>
            )}
            {gameData.status === 4 && gameData.prize_claimed && (
              <div className="text-center mb-4">
                <Button
                  className="w-full px-4 py-2 text-sm font-bold"
                  asChild
                  size="sm"
                >
                  <a
                    href={`https://solscan.io/tx/${gameData.prize_claim_tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Wallet className="mr-1 h-4 w-4" />
                    Prize Claimed
                  </a>
                </Button>
              </div>
            )}
            {gameData.players &&
              gameData.players.length > 0 &&
              player &&
              gameData.players.some((playerObj: any) => playerObj.player === player) && (
                <>
                  <div>
                    <ActionButtons
                      onSlap={handleSlap}
                      onGrab={handleGrab}
                      onSneak={handleSneak}
                      grabs={playerData?.grabs}
                      slaps={playerData?.slaps}
                      sneaks={playerData?.sneaks}
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-center text-white text-sm animate-pulse">{actionMessage}</p>
                  </div>
                </>
              )}
            {gameData.players &&
              Array.isArray(gameData.players) &&
              player &&
              !gameData.players.some((playerObj: any) => playerObj.player === player) && (
                <div>
                        <Button onClick={handleJoinGame} className="bg-[#111] hover:bg-[#222] text-white border border-[#00FFA9] rounded-full relative overflow-hidden group w-full">
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-50 transition-opacity"></span>
                          <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-transparent opacity-30 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                          <span className="relative">Join Game</span>
                        </Button>
                </div>
              )}
          </CardContent>
        </Card>
        <div className="space-y-2 mt-5 mb-5">
                  <Button onClick={handleReload} className="bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 text-white rounded-full w-full">
                      Reload
                    </Button>
            </div>
      </MicroInteractions>

      <MicroInteractions delay={0.2}>
        <Card className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl overflow-hidden relative">
          {/* <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-30 blur-md"></div> */}
          <CardContent className="p-4 relative">
            <Tabs defaultValue="players" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-3 bg-black/50 backdrop-blur-md p-1 rounded-full border border-[#333]">
                <TabsTrigger
                  value="players"
                  className="rounded-full text-xs data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
                >
                  <Users className="mr-1 h-3 w-3" />
                  Players
                </TabsTrigger>
                <TabsTrigger
                  value="prize-info"
                  className="rounded-full text-xs data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
                >
                  <Trophy className="mr-1 h-3 w-3" />
                  Prize
                </TabsTrigger>
                <TabsTrigger
                  value="rules"
                  className="rounded-full text-xs data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Rules
                </TabsTrigger>
              </TabsList>

              <TabsContent value="players">
                <div className="bg-black/30 backdrop-blur-md p-3 rounded-xl border border-[#333] mb-3">
                  <p className="text-[#00FFA9] text-sm text-center font-bold mb-1">
                    Players: {gameData.players_ready} / {gameData.players_min} |{" "}
                    <small>{gameData.players_max} max</small>
                  </p>
                  <Progress
                    value={(gameData.players_ready / gameData.players_min) * 100}
                    className="w-full h-2 bg-[#333]"
                    indicatorClassName="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF]"
                  />
                </div>

                <ScrollArea className="h-[200px] w-full rounded-xl border border-[#333] bg-black/30 backdrop-blur-md p-3">
                  <div className="space-y-3">
                    {gameData && Array.isArray(gameData.players) && gameData.players.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-[#333]">
                              <th className="p-1 text-center text-[#00FFA9]">Player</th>
                              <th className="p-1 text-center text-[#00FFA9]">
                                <Grab className="inline-block mr-1 h-3 w-3" />
                              </th>
                              <th className="p-1 text-center text-[#00FFA9]">
                                <Hand className="inline-block mr-1 h-3 w-3" />
                              </th>
                              <th className="p-1 text-center text-[#00FFA9]">
                                <Footprints className="inline-block mr-1 h-3 w-3" />
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
                                <td className="p-1 font-medium text-center text-xs">
                                  {data.player === player ? (
                                    <span className="text-[#00FFA9]">{data.player_name}</span>
                                  ) : (
                                    data.player_name
                                  )}
                                </td>
                                <td className="p-1 text-center text-xs">{data.grabs_used || 0}</td>
                                <td className="p-1 text-center text-xs">{data.slaps_used || 0}</td>
                                <td className="p-1 text-center text-xs">{data.sneaks_used || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-[#00FFA9] text-sm py-8">
                        <Users className="inline-block mr-1 h-4 w-4" />
                        No players yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="prize-info">
                <div className="space-y-3 text-sm bg-black/30 backdrop-blur-md p-4 rounded-xl border border-[#333]">
                  <h3 className="text-md font-semibold text-[#00FFA9]">{gameData.title}</h3>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/50 p-2 rounded-lg border border-[#222] flex items-center">
                      <Coins className="mr-2 h-5 w-5 text-yellow-400" />
                      <div>
                        <p className="text-gray-400 text-xs">Prize</p>
                        <p className="text-sm font-bold text-white">{gameWalletBalance}</p>
                      </div>
                    </div>

                    <div className="bg-black/50 p-2 rounded-lg border border-[#222] flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-gray-400 text-xs">Hold Time</p>
                        <p className="text-sm font-bold text-white">10s/3s</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/50 p-2 rounded-lg border border-[#222] flex items-center">
                    <Users className="mr-2 h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-gray-400 text-xs">Players</p>
                      <p className="text-sm font-bold text-white">
                        {gameData.players_ready} / {gameData.players_max} (Min: {gameData.players_min})
                      </p>
                    </div>
                  </div>

                  {gameData.title !== "practice" && (
                    <div className="bg-black/50 p-2 rounded-lg border border-[#222] flex items-center">
                      <Wallet className="mr-2 h-5 w-5 text-purple-400" />
                      <div>
                        <p className="text-gray-400 text-xs">Wallet</p>
                        <a
                          href={`https://solscan.io/account/${gameData.wallet}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-white hover:text-[#00FFA9] transition-colors"
                        >
                          {`${gameData.wallet.slice(0, 4)}...${gameData.wallet.slice(-4)}`}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <p className="text-xs text-[#00FFA9] mb-1">Free Actions:</p>
                    <div className="flex space-x-2">
                      <Badge
                        variant="outline"
                        className="flex items-center bg-black/50 px-2 py-1 text-xs text-[#00FFA9] border-[#00FFA9]"
                      >
                        <Grab className="mr-1 h-3 w-3" />
                        {gameData.free_grabs}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center bg-black/50 px-2 py-1 text-xs text-[#FF007A] border-[#FF007A]"
                      >
                        <Hand className="mr-1 h-3 w-3" />
                        {gameData.free_slaps}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center bg-black/50 px-2 py-1 text-xs text-[#00C3FF] border-[#00C3FF]"
                      >
                        <Footprints className="mr-1 h-3 w-3" />
                        {gameData.free_sneaks}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rules">
                <ScrollArea className="h-[200px] w-full rounded-xl border border-[#333] bg-black/30 backdrop-blur-md p-3">
                  <div className="space-y-3 text-sm">
                    <div className="text-center mb-3">
                      <h3 className="text-lg font-bold text-[#00FFA9] mb-1">How to Play</h3>
                      <div className="h-1 w-16 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] mx-auto rounded-full"></div>
                    </div>

                    <p className="text-gray-300">
                      Grabbit is a fast-paced game where players compete to win crypto prizes. The objective is to hold
                      the prize when the timer hits zero.
                    </p>

                    <div className="space-y-2 mt-3">
                      <h4 className="text-sm font-semibold text-white">Game Actions:</h4>

                      <div className="bg-black/50 p-2 rounded-lg border border-[#222] flex items-start space-x-2">
                        <div className="bg-[#00FFA9]/20 p-1 rounded-full">
                          <Grab className="h-4 w-4 text-[#00FFA9]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#00FFA9]">Grab</p>
                          <p className="text-xs text-gray-300">Hold the prize for 10 seconds to win.</p>
                        </div>
                      </div>

                      <div className="bg-black/50 p-2 rounded-lg border border-[#222] flex items-start space-x-2">
                        <div className="bg-[#FF007A]/20 p-1 rounded-full">
                          <Hand className="h-4 w-4 text-[#FF007A]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#FF007A]">Slap</p>
                          <p className="text-xs text-gray-300">Knock the prize out of other players' hands.</p>
                        </div>
                      </div>

                      <div className="bg-black/50 p-2 rounded-lg border border-[#222] flex items-start space-x-2">
                        <div className="bg-[#00C3FF]/20 p-1 rounded-full">
                          <Footprints className="h-4 w-4 text-[#00C3FF]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#00C3FF]">Sneak</p>
                          <p className="text-xs text-gray-300">Grab the prize with only a 3-second timer.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#00FFA9]/10 p-3 rounded-lg border border-[#00FFA9]/30 mt-3">
                      <p className="text-xs text-white">
                        <span className="text-[#00FFA9] font-bold">TIP:</span> Use your limited actions wisely to
                        outmaneuver other players!
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </MicroInteractions>

      <JoinGameModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleConfirmJoin}
        gameData={gameData}
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
  )
}


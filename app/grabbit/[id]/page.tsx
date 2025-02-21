"use client"

import { useEffect, useState, useRef } from "react"
import { Header } from "@/components/header"
import { useWallet } from "@solana/wallet-adapter-react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PrizeAvatar } from "@/components/prize-avatar"
import { ActionButtons } from "@/components/action-buttons"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { Button } from "@/components/ui/button"
import { JoinGameModal } from "@/components/join-grabbt-modal"
import { SuccessModal } from "@/components/success-modal"
import { ErrorModal } from "@/components/error-modal"
import { CreateGrabbitModal } from "@/components/create-grabbit-modal"
import { GrabbitClaimModal } from "@/components/grabbit-claim-modal"
import { balanceManager } from "@/lib/balance"
import { PlusCircle } from "lucide-react"
import moment from "moment"
import "moment-timezone"
import { useCallback } from "react"

const Balance = new balanceManager()
const GAME = ""
interface Player {
  id: string
  name: string
  avatar: string
}

interface Prize {
  token: string
  name: string
  amount: number
}

interface GameData {
  create_date: any
  created_by: string
  details: string
  end_time: any
  free_grabs: number
  free_slaps: number
  free_sneaks: number
  game_id: number
  grabs_to_join: number
  id: any
  image: string
  last_grab: any
  players: any
  players_max: number
  players_min: number
  players_ready: number
  prize_amount: number
  prize_token: string
  prize_token_name: string
  slapper: string
  start_time: any
  status: number
  title: string
  token_amount_to_join: number
  token_to_join: string
  wallet: string
  winner: string
  winner_avatar: string
  winner_name: string
}

export default function GrabbitGame() {
  const { publicKey }: any = useWallet()
  const [gameData, setGameData]: any = useState<GameData | null>(null)
  const [playerData, setPlayerData]: any = useState(null)
  const [activeTab, setActiveTab] = useState("players")
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [remainingGrabs, setRemainingGrabs]: any = useState(0)
  const [remainingSlaps, setRemainingSlaps]: any = useState(0)
  const [remainingSneaks, setRemainingSneaks]: any = useState(0)
  const [gamesData, setGamesData]: any = useState([])
  const params = useParams()
  const gameId = params.id as string
  const supabase = createClientComponentClient()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  const [userData, setUserData]: any = useState<Partial<User>>({})
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [user_id, setUserId]: any = useState("")
  const [user_name, setUserName]: any = useState("")
  const [user_avatar, setUserAvatar]: any = useState("")
  const [actionMessage, setActionMessage]: any = useState("")
  const [timeLeft, setTimeLeft] = useState("")
  const [payloads, setPayload] = useState<any | null>(null)
  const [gameWalletBalance, setGameWalletBalance]: any = useState(0)
  const [isClaiming, setIsClaiming] = useState(false)
  //polling
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isLeaderRef = useRef(false)

  useEffect(() => {
    if (publicKey) {
      fetchUser()
    }
  }, [publicKey])
  let isFetching = false

  const fetchUser = async () => {
    if (isFetching) return // Skip if a fetch is already in progress
    isFetching = true

    try {
      const { data, error } = await supabase.from("users").select("*").eq("publicKey", publicKey).single()

      if (error && error.code !== "PGRST116") {
        // Ignore "no rows" error
        console.error("Select Error:", error)
        return
      }

      if (!data) {
        const { error: insertError } = await supabase.from("users").insert([{ publicKey }])

        if (insertError) {
          console.error("Insert Error:", insertError)
        } else {
          setShowUserNameModal(true)
          console.log("New publicKey inserted into the database.")
        }
      } else {
        setUserId(data.id)
        if (!data.username) {
          setShowUserNameModal(true)
        } else {
          setUserName(data.username)
          setUserAvatar(data.avatar_url)
          setUserData({
            userid: data.id,
            username: data.username,
            deposit_wallet: data.deposit_wallet,
            avatar: data.avatar_url,
          })
        }
      }
    } finally {
      isFetching = false
    }
  }

  const fetchNSetGame = async () => {
    console.log("fetching")
    const { data, error } = await supabase.from("grabbit").select("*").eq("game_id", gameId).maybeSingle()
    // console.log(data)
    const balance = await Balance.getBalance(data.wallet)
    setGameData(data)
    setGameWalletBalance(balance / 10 ** 9)
    setPlayerData([])
  }
  useEffect(() => {
    fetchNSetGame()
  }, [gameId])
  
  useEffect(() => {
    const channel = supabase
      .channel("table-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public", // Schema name
          table: "grabbit", // Table name
          filter: `game_id=eq.${gameId}`, // Filter by game_id
        },
        (payload: any) => {
          const data = payload.new
          // console.log(data)
          const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== null && value !== undefined),
          )

          setGameData((prevGameData: any) => {
            const updatedData = { ...prevGameData, ...filteredData }
            let timeL: any

            if (updatedData.status === 2) {
              timeL = calculateTimeDifference(moment(updatedData.start_time))
              setTimeLeft(timeL)
            }
            if (updatedData.status === 3) {
              timeL = calculateTimeDifference(moment(updatedData.end_time))
              setTimeLeft(timeL)
            }

            const playerObj = updatedData.players.find((player: any) => player.player === publicKey.toString())
            if (playerObj) {
              setPlayerData(playerObj)
            }
            console.log(updatedData)
            return updatedData
          })
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe() // Unsubscribe when the component unmounts
    }
  }, [gameId, publicKey, supabase])

  const fetchGameData = async () => {
    try {
      const response = await fetch("/api/grabbit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          gameId: gameId,
          userId: publicKey,
        }),
      })
    } catch (err) {
      console.error("Error fetching game data:", err)
    }
  }

  const tryBecomeLeader = async () => {
    const now = moment.utc()
    const threeSecondsAgo = moment.utc(now).subtract(3, "seconds")

    const { data, error } = await supabase.from("poll_leader").select("*").maybeSingle()

    if (error && error.message !== "No rows found") {
      console.error("Error fetching leader:", error.message)
      return
    }
    
    if (data) {
      const lastActive = moment.utc(data.last_active)

      if (!data || lastActive.isBefore(threeSecondsAgo)) {
        const leaderId = data.id
        const { error: updateError } = await supabase
          .from("poll_leader")
          .update({
            public_key: publicKey,
            last_active: now.toISOString(),
          })
          .eq("id", leaderId)

        if (updateError) {
          console.error("Error updating leader:", updateError.message)
        } else {
          isLeaderRef.current = true
          fetchGameData()

          if (!intervalRef.current) {
            intervalRef.current = setInterval(fetchGameData, 1000)
          }
        }
      }
    } else {
      const { error: insertError } = await supabase.from("poll_leader").insert({
        public_key: publicKey,
        last_active: now.toISOString(),
      })

      if (insertError) {
        console.error("Error inserting leader:", insertError.message)
      } else {
        isLeaderRef.current = true
        fetchGameData()

        if (!intervalRef.current) {
          intervalRef.current = setInterval(fetchGameData, 1000)
        }
      }
    }
  }

  const sendHeartbeat = async () => {
    if (isLeaderRef.current) {
      const { error } = await supabase
        .from("poll_leader")
        .update({ last_active: moment.utc().toISOString() })
        .eq("public_key", publicKey)

      if (error) {
        console.error("Error sending heartbeat:", error.message)
      }
    }
  }

  useEffect(() => {
    tryBecomeLeader()

    const leaderCheckInterval = setInterval(tryBecomeLeader, 1000)

    const channel = supabase
      .channel("leader-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_leader" }, (payload: any) => {
        console.log("Leader change detected:", payload.new)

        if (payload.new.public_key !== publicKey) {
          console.log("Not the leader anymore.")
          isLeaderRef.current = false
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        } else {
          console.log("Is the leader now.")
          isLeaderRef.current = true
          if (!intervalRef.current) {
            intervalRef.current = setInterval(fetchGameData, 1000)
          }
        }
      })
      .subscribe()

    const heartbeatInterval = setInterval(sendHeartbeat, 1000)

    return () => {
      clearInterval(leaderCheckInterval)
      channel.unsubscribe()
      clearInterval(heartbeatInterval)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [publicKey, supabase])

  const fetchGames = async () => {
    const { data, error } = await supabase.from("grabbit").select(`*`).eq("status", 1)
    setGamesData(data)
  }

  const handleSlap = async () => {
    if (gameData.status == 1 || gameData.status == 2) {
      console.log(gameData)
      setErrorMessage("game hasn't started")
      setShowErrorModal(true)
    } else if (gameData.status == 3) {
      const response = await fetch("/api/grabbit/slap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: gameId,
          userId: publicKey,
        }),
      })

      const data = await response.json()
      setActionMessage(data.message)
      setTimeout(() => {
        setActionMessage("")
      }, 3000)
    } else if (gameData.status == 4) {
      setErrorMessage("game cover")
      setShowErrorModal(true)
    }
  }

  const handleGrab = async () => {
    if (gameData.status == 1 || gameData.status == 2) {
      setErrorMessage("game hasn't started")
      setShowErrorModal(true)
    } else if (gameData.status == 3) {
      const response = await fetch("/api/grabbit/grab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: gameId,
          userId: publicKey,
          username: user_name,
          avatar: user_avatar,
        }),
      })
      const data = await response.json()
      console.log(data)
      if (data.success) {
        fetchGameData()
      }
      setActionMessage(data.message)
      setTimeout(() => {
        setActionMessage("")
      }, 3000)
    } else if (gameData.status == 4) {
      setErrorMessage("game over")
      setShowErrorModal(true)
    }
  }

  const handleSneak = async () => {
    if (gameData.status == 1 || gameData.status == 2) {
      console.log(gameData)
      setErrorMessage("game hasn't started")
      setShowErrorModal(true)
    } else if (gameData.status == 3) {
      const response = await fetch("/api/grabbit/sneak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: gameId,
          userId: publicKey,
        }),
      })

      const data = await response.json()
      setActionMessage(data.message)
      setTimeout(() => {
        setActionMessage("")
      }, 3000)
    } else if (gameData.status == 4) {
      setErrorMessage("game over")
      setShowErrorModal(true)
    }
  }

  const handleJoinGame = () => {
    setShowJoinModal(true)
  }

  const handleConfirmJoin = async () => {
    setHasJoined(true)
    setShowJoinModal(false)
    console.log(gameData)
    if (gameData.playersReady + 1 == gameData.playersMax) {
      setErrorMessage("max players reached")
      setShowErrorModal(true)
    } else if (gameData.status == 3) {
      setErrorMessage("game started")
      setShowErrorModal(true)
    } else if (gameData.status == 4) {
      setErrorMessage("game over")
      setShowErrorModal(true)
    } else {
      let pass = 1
      const { data, error } = await supabase
        .from("grabbit_players")
        .select("*")
        .eq("game_id", gameId)
        .eq("player", publicKey)
        .eq("status", 1)
        .maybeSingle()

      if (data) {
        setErrorMessage("you are already in this game")
        setShowErrorModal(true)
        pass = 0
      }
      if (error) {
        console.log(error)
      }

      if (pass > 0) {
        const response = await fetch("/api/grabbit/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: gameId,
            publicKey: publicKey,
          }),
        })

        const resp = await response.json()
        if (resp.success) {
          setSuccessMessage("you are in")
          setShowSuccessModal(true)
        } else {
          setErrorMessage(resp.message)
          setShowErrorModal(true)
        }
      }
    }
  }

  const handleCreateGame = async (gData: any) => {
    // console.log(gData)
    if (gData) {
      const response = await fetch("/api/grabbit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gData,
        }),
      })

      const resp: any = await response.json()
      if (resp.success) {
        setSuccessMessage("game created")
        setShowSuccessModal(true)
      } else {
        setErrorMessage("error creating game")
        setShowErrorModal(true)
      }
    } else {
      setErrorMessage("error creating game")
      setShowErrorModal(true)
    }
  }

  const handleClaimPrize = async () => {
    setIsClaiming(true)
    try {
      console.log(gameId)
      const response = await fetch("/api/grabbit/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: gameId,
          user: publicKey,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSuccessMessage("Prize claimed successfully!")
        setShowSuccessModal(true)
        fetchNSetGame() // Refresh game data
      } else {
        setErrorMessage(data.message || "Error claiming prize")
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error("Error claiming prize:", error)
      setErrorMessage("An error occurred while claiming the prize")
      setShowErrorModal(true)
    }
    setShowClaimModal(false)
    setIsClaiming(false)

  }

  const calculateTimeDifference = (time: any) => {
    try {
      const timeNow = moment.utc()
      const startTime = moment.tz(time, "UTC")
      const differenceInSeconds = startTime.diff(timeNow, "seconds")
      return differenceInSeconds
    } catch (error) {
      console.error("Error calculating time difference:", error)
      return null
    }
  }

  const handleSuccessNotification = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessModal(true)
  }

  const handleErrorNotification = (message: string) => {
    setErrorMessage(message)
    setShowErrorModal(true)
  }

  const memoizedFetchGameData = useCallback(fetchGameData, [gameId, publicKey])
  const memoizedSendHeartbeat = useCallback(sendHeartbeat, [publicKey, supabase])

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md p-8 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border-primary/20">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <h2 className="text-2xl font-bold text-primary animate-pulse">Loading Grabbit Game...</h2>
              <p className="text-center text-primary/80">Get ready to grab, slap, and sneak your way to victory!</p>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-primary mb-2">
          <a href="/grabbit">Grabbit</a>
        </h1>
        <h2 className="text-2xl font-semibold text-center text-secondary mb-8 animate-pulse">
          <Sparkles className="inline-block mr-2" />
          Win Crypto Prizes!
          <Sparkles className="inline-block ml-2" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border-primary/20 overflow-hidden">
            <CardContent className="p-6">
              <div className="relative mb-6">
                <PrizeAvatar
                  imageSrc={gameData.winner_avatar || gameData.image}
                  prizeName={gameData.title}
                  timeLeft={timeLeft}
                  winner={gameData.winner_name || "No winner yet"}
                  status={gameData.status}
                />
              </div>
              <div className="text-center mb-6">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  <Trophy className="inline-block mr-2" />
                  Prize: {gameWalletBalance} SOL
                </Badge>
              </div>
              {gameData.status === 4 && gameData.winner === publicKey.toString() && !gameData.prize_claimed && (
                              <div className="text-center mb-6">
                
                <Button
                  onClick={() => setShowClaimModal(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Claim Your Prize
                </Button>
                </div>
              )}
              {gameData.status === 4 && gameData.prize_claimed && (
              <div className="text-center mb-6">
                
                <Button
                    asChild // This allows the Button component to wrap around an <a> tag
                  >
                    <a
                      href={`https://solscan.io/tx/${gameData.prize_claim_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                      Prize Claimed
                    </a>
                  </Button>
                </div>
              )}
              {gameData.players.length > 0 &&
                gameData.players.some((playerObj: any) => playerObj.player == publicKey) && (
                  <>
                    <div className="col-span-4">
                      <ActionButtons
                        onSlap={handleSlap}
                        onGrab={handleGrab}
                        onSneak={handleSneak}
                        grabs={playerData.grabs}
                        slaps={playerData.slaps}
                        sneaks={playerData.sneaks}
                      />
                    </div>
                    <div className="col-span-4 mt-3">
                      <p className="text-center text-white p3">{actionMessage}</p>
                    </div>
                  </>
                )}
              {gameData.players &&
                Array.isArray(gameData.players) &&
                !gameData.players.some((playerObj: any) => playerObj.player === publicKey.toString()) && (
                  <div className="col-span-12">
                    <Button
                      onClick={handleJoinGame}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Join Game
                    </Button>
                  </div>
                )}

              <JoinGameModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                onJoin={handleConfirmJoin}
                gameData={gameData}
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6">
              <Tabs defaultValue="players" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="players">
                    <Users className="mr-2" />
                    Players
                  </TabsTrigger>
                  <TabsTrigger value="prize-info">
                    <Trophy className="mr-2" />
                    Prize Info
                  </TabsTrigger>
                  <TabsTrigger value="rules">
                    <AlertTriangle className="mr-2" />
                    Rules
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="players">
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                      <p className="text-primary text-lg text-center">
                        Players: {gameData.players_ready} / {gameData.players_min} |{" "}
                        <small>{gameData.players_max} max</small>
                      </p>
                      <Progress value={(gameData.players_ready / gameData.players_min) * 100} className="w-full h-2" />
                      {gameData && Array.isArray(gameData.players) && gameData.players.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr>
                                <th className="p-2 text-center"></th>
                                <th className="p-2 text-center">Grabs</th>
                                <th className="p-2 text-center">Slaps</th>
                                <th className="p-2 text-center">Sneaks</th>
                              </tr>
                            </thead>

                            <tbody>
                              {gameData.players.map((data: any, index: number) => (
                                <tr key={index} className="border-b border-black-200 hover:bg-black-50">
                                  <td className="p-2 font-medium text-center">{data.player_name}</td>

                                  <td className="p-2 text-center">{data.grabs_used || 0}</td>

                                  <td className="p-2 text-center">{data.slaps_used || 0}</td>

                                  <td className="p-2 text-center">{data.sneaks_used || 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center text-primary h2">no players yet</div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="prize-info">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-primary">{gameData.title}</h3>
                    <p className="text-primary/80 flex items-center">
                      <Coins className="mr-2 h-5 w-5" />
                      Prize Value: {gameWalletBalance}
                    </p>
                    <p className="text-primary/80 flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      Hold Time: 10 seconds (3 seconds for Sneak)
                    </p>
                    <p className="text-primary/80 flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Players: {gameData.players_ready} / {gameData.players_max} (Min: {gameData.players_min})
                    </p>
                    <p className="text-primary/80 flex items-center">
                      <Wallet className="mr-2 h-5 w-5" />
                      wallet: {gameData.wallet}
                    </p>
                    <div className="space-y-2">
                      <p className="text-primary/80">Free Actions:</p>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="flex items-center">
                          <Grab className="mr-1 h-4 w-4" />
                          Grabs: {gameData.free_grabs}
                        </Badge>
                        <Badge variant="outline" className="flex items-center">
                          <Hand className="mr-1 h-4 w-4" />
                          Slaps: {gameData.free_slaps}
                        </Badge>
                        <Badge variant="outline" className="flex items-center">
                          <Footprints className="mr-1 h-4 w-4" />
                          Sneaks: {gameData.free_sneaks}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="rules">
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-primary">How to Play Grabbit</h3>
                      <p className="text-primary/80">
                        Grabbit is a fast-paced game where players compete to win crypto prizes. The objective is to
                        hold the prize when the timer hits zero.
                      </p>
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-primary">Actions:</h4>
                        <p className="text-primary/80 flex items-center">
                          <Grab className="mr-2 h-5 w-5" />
                          <strong>Grab:</strong> Hold the prize for 10 seconds to win.
                        </p>
                        <p className="text-primary/80 flex items-center">
                          <Hand className="mr-2 h-5 w-5" />
                          <strong>Slap:</strong> Knock the prize out of other players' hands.
                        </p>
                        <p className="text-primary/80 flex items-center">
                          <Footprints className="mr-2 h-5 w-5" />
                          <strong>Sneak:</strong> Grab the prize with only a 3-second timer.
                        </p>
                      </div>
                      <p className="text-primary/80">
                        Use your limited actions wisely to outmaneuver other players and claim the prize!
                      </p>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-green-900/50 to-teal-900/50 backdrop-blur-sm border-primary/20 my-12">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold text-primary mb-4">Create Your Own Grabbit Game</h2>
            <p className="text-xl text-primary/80 mb-6">
              create multi player games to win solana or other token prizes
              <br />
              earn a 10% of entry fee collected for solana prizes
              <br />
              players must hold 1,000,000 or more of GAME <br />
              tokens to play or create games
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <PlusCircle className="mr-2 h-6 w-6" />
              Create Grabbit Game
            </Button>
          </CardContent>
        </Card>
        
        {showSuccessModal && (
          <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
        )}
        {showErrorModal && (
          <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
        )}
        <CreateGrabbitModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateGame}
          publicKey={publicKey}
        />
        <GrabbitClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          onConfirm={handleClaimPrize}
          userName={user_name}
          prizeAmount={gameWalletBalance}
          isClaiming={isClaiming}
        />
      </main>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getBoostFee } from "@/lib/platformWallet"
import { PauseModal } from "@/components/pause-modal"
import { GamePreview } from "@/components/game-preview"

interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url: string
  score: number
  earnings: number
}

export default function PlayPage() {
  const { id } = useParams()
  const { publicKey } = useWallet()
  const [game, setGame] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userCredits, setUserCredits] = useState<number>(0)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<any[]>([])
  const [upvotes, setUpvotes] = useState(0)
  const [downvotes, setDownvotes] = useState(0)
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)
  const [boosts, setBoosts] = useState(0)
  const [boostFee, setBoostFee] = useState(0)
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false)
  const [pauseMessage, setPauseMessage] = useState("")
  const [gameInstance, setGameInstance] = useState<any>(null)

  useEffect(() => {
    if (id) {
      fetchGameData()
      fetchLeaderboard()
      fetchComments()
      fetchVotes()
      fetchBoosts()
      fetchBoostFee()
    }
    if (publicKey) {
      fetchUserCredits()
      fetchUserVote()
    }
  }, [id, publicKey])

  const fetchGameData = async () => {
    const { data, error } = await supabase.from("games").select("*").eq("id", id).single()
    if (error) console.error("Error fetching game data:", error)
    else setGame(data)
  }

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("user_id, users(username, avatar_url), score, earnings")
      .eq("game_id", id)
      .order("score", { ascending: false })
      .limit(10)
    if (error) console.error("Error fetching leaderboard:", error)
    else setLeaderboard(data)
  }

  const fetchUserCredits = async () => {
    const { data, error } = await supabase.from("users").select("credits").eq("id", publicKey!.toBase58()).single()
    if (error) console.error("Error fetching user credits:", error)
    else setUserCredits(data.credits)
  }

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*, users(username, avatar_url)")
      .eq("game_id", id)
      .order("created_at", { ascending: false })
    if (error) console.error("Error fetching comments:", error)
    else setComments(data)
  }

  const fetchVotes = async () => {
    const { data, error } = await supabase.from("games").select("upvotes, downvotes").eq("id", id).single()
    if (error) console.error("Error fetching votes:", error)
    else {
      setUpvotes(data.upvotes)
      setDownvotes(data.downvotes)
    }
  }

  const fetchUserVote = async () => {
    const { data, error } = await supabase
      .from("votes")
      .select("vote_type")
      .eq("game_id", id)
      .eq("user_id", publicKey!.toBase58())
      .single()
    if (error) console.error("Error fetching user vote:", error)
    else setUserVote(data?.vote_type)
  }

  const fetchBoosts = async () => {
    const { data, error } = await supabase.from("games").select("boosts").eq("id", id).single()
    if (error) console.error("Error fetching boosts:", error)
    else setBoosts(data.boosts)
  }

  const fetchBoostFee = async () => {
    try {
      const fee = await getBoostFee()
      setBoostFee(fee)
    } catch (error) {
      console.error("Error fetching boost fee:", error)
    }
  }

  const handlePlay = async () => {
    if (!publicKey) {
      alert("Please connect your wallet to play")
      return
    }
    if (userCredits < game.play_fee) {
      alert("Insufficient credits to play")
      return
    }
    const response = await fetch("/api/game/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: id, userId: publicKey.toBase58() }),
    })
    const data = await response.json()
    if (data.error) {
      if (data.isPaused) {
        setPauseMessage(data.error)
        setIsPauseModalOpen(true)
      } else {
        alert(data.error)
      }
    } else {
      if (gameInstance && typeof gameInstance.start === "function") {
        gameInstance.start()
      }
    }
  }

  const handleComment = async () => {
    if (!publicKey) {
      alert("Please connect your wallet to comment")
      return
    }
    const { error } = await supabase
      .from("comments")
      .insert({ game_id: id, user_id: publicKey.toBase58(), content: comment })
    if (error) console.error("Error posting comment:", error)
    else {
      setComment("")
      fetchComments()
    }
  }

  const handleVote = async (voteType: "up" | "down") => {
    if (!publicKey) {
      alert("Please connect your wallet to vote")
      return
    }
    const { error } = await supabase.rpc("vote_game", {
      p_game_id: id,
      p_user_id: publicKey.toBase58(),
      p_vote_type: voteType,
    })
    if (error) console.error("Error voting:", error)
    else {
      fetchVotes()
      fetchUserVote()
    }
  }

  const handleBoost = async () => {
    if (!publicKey) {
      alert("Please connect your wallet to boost")
      return
    }
    if (userCredits < boostFee) {
      alert(`Insufficient credits. You need ${boostFee} credits to boost.`)
      return
    }
    const { error } = await supabase.rpc("boost_game", {
      p_game_id: id,
      p_user_id: publicKey.toBase58(),
      p_boost_fee: boostFee,
    })
    if (error) {
      console.error("Error boosting game:", error)
      alert("Error boosting game. Please try again.")
    } else {
      alert("Game boosted successfully!")
      fetchBoosts()
      fetchUserCredits()
    }
  }

  if (!game) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{game.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-4">
                <GamePreview gameCode={game.game_code} gameCss={game.game_css} />
                <Button onClick={handlePlay} className="mt-4 w-full">
                  Play Now ({game.play_fee} credits)
                </Button>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleVote("up")} disabled={userVote === "up"}>
                      <ThumbsUp className={`mr-1 h-4 w-4 ${userVote === "up" ? "text-primary" : ""}`} />
                      {upvotes}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote("down")}
                      disabled={userVote === "down"}
                    >
                      <ThumbsDown className={`mr-1 h-4 w-4 ${userVote === "down" ? "text-primary" : ""}`} />
                      {downvotes}
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleBoost}>
                    <Zap className="mr-1 h-4 w-4" />
                    Boost ({boosts}) - {boostFee} credits
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-4">
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                  />
                  <Button onClick={handleComment}>Post</Button>
                </div>
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-2">
                      <Avatar>
                        <AvatarImage src={comment.users.avatar_url} />
                        <AvatarFallback>{comment.users.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{comment.users.username}</p>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.user_id} className="flex items-center space-x-2">
                      <span className="font-bold">{index + 1}.</span>
                      <Avatar>
                        <AvatarImage src={entry.avatar_url} />
                        <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{entry.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Score: {entry.score} | Earnings: {entry.earnings} credits
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <PauseModal isOpen={isPauseModalOpen} onClose={() => setIsPauseModalOpen(false)} message={pauseMessage} />
    </div>
  )
}


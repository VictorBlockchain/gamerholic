"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThumbsUp, ThumbsDown, Zap, Loader2, Trophy, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { PauseModal } from "@/components/pause-modal"
import { GamePreview } from "@/components/game-preview"
import React from "react"
import { SuccessModal } from '@/components/success-modal'
import { ErrorModal } from '@/components/error-modal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { balanceManager } from '@/lib/balance'
const solana = new balanceManager();

interface User {
  userid:string
  username: string
  deposit_wallet:string
  avatar:string
}
interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url: string
  score: number
  earnings: number
}
const GAME:any = process.env.NEXT_PUBLIC_GAMER

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
  const [loading, setLoading] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [user_id, setUserId]:any = useState('')
  const [user_name, setUserName]:any = useState('')
  const [user_avater, setUserAvatar]:any = useState('')
  const [avatarFile, setAvatarFile]:any = useState('')
  const [userData, setUserData]:any = useState<Partial<User>>({})
  
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
  
  let isFetching =false
  const fetchUser = async () => {
    if (isFetching) return; // Skip if a fetch is already in progress
    isFetching = true;
    
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("publicKey", publicKey)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
        console.error("Select Error:", error);
        return;
      }
      
      if (!data) {
        if(publicKey){
        
          const { error: insertError } = await supabase
          .from("users")
          .insert([{ publicKey }]);
        
              if (insertError) {
                console.error("Insert Error:", insertError);
              } else {
                setShowUserNameModal(true)
                console.log("New publicKey inserted into the database.");
              }
            } else {
                setUserId(data.id)
                if(!data.username){
                    setShowUserNameModal(true)
                }else{
                    setUserName(data.username)
                    setUserAvatar(data.avatar_url)
                    setUserData({
                        userid: data.id,
                        username: data.username,
                        deposit_wallet: data.deposit_wallet,
                        avatar: data.avatar,
                      });
                }
            //   console.log("publicKey already exists:", data);
            }
        }
    
    } finally {
      isFetching = false;
    }
  };
  
  const handleAvatarUpload = async (event:any) => {
    console.log("uploading")
    const file = event.target.files?.[0];
    if (file) {
      const fileName = `${Date.now()}_${file.name}`; // Unique filename
      const { data, error } = await supabase.storage
        .from('images') // Your bucket name
        .upload(fileName, file);
  
      if (error) {
        console.error("Upload Error:", error);
      } else {
        console.log("File uploaded successfully:", data);
        let url = 'https://bwvzhdrrqvrdnmywdrlm.supabase.co/storage/v1/object/public/'+data.fullPath
        await updateUserAvatar(publicKey, url);
      }
    }
  };
  
  const updateUserAvatar = async (publicKey:any, avatarUrl:any) => {
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('publicKey', publicKey);
      setAvatarFile(avatarUrl)
    if (error) {
      console.error("Error updating avatar:", error);
    } else {
      console.log("Avatar updated successfully!");
    }
  };

  const fetchGameData = async () => {
    const { data, error } = await supabase.from("arcade").select("*").eq("game_id", id).single()
    if (error) console.error("Error fetching game data:", error)
    else setGame(data)
    setLoading(false)
  }

  const fetchLeaderboard = async () => {
    const { data, error }: any = await supabase
      .from("arcade_leaderboard")
      .select("*")
      .eq("game_id", id)
      .order("score", { ascending: false })
      .limit(10)
    if (error) console.error("Error fetching leaderboard:", error)
    else setLeaderboard(data)
  }

  const fetchUserCredits = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("credits")
      .eq("publicKey", publicKey!.toBase58())
      .single()
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
    const { data, error } = await supabase.from("arcade").select("votes_up, votes_down").eq("game_id", id).single()
    if (error) console.error("Error fetching votes:", error)
    else {
      setUpvotes(data.votes_up)
      setDownvotes(data.votes_down)
    }
  }
  
  const fetchUserVote = async () => {
    const { data, error } = await supabase
      .from("votes")
      .select("vote_type")
      .eq("game_id", id)
      .eq("user_id", publicKey!.toBase58())
      .maybeSingle()
    if (error) console.error("Error fetching user vote:", error)
    else setUserVote(data?.vote_type)
  }

  const fetchBoosts = async () => {
    const { data, error } = await supabase.from("arcade").select("boosts").eq("game_id", id).single()
    if (error) console.error("Error fetching boosts:", error)
    else setBoosts(data.boosts)
  }

  const fetchBoostFee = async () => {
    try {
      // const fee = await getBoostFee()
      // setBoostFee(fee)
    } catch (error) {
      console.error("Error fetching boost fee:", error)
    }
  }

  const handlePlay = async (isFree: boolean) => {
    if (!publicKey) {
      alert("Please connect your wallet to play")
      return
    }
    // if (!isFree && userCredits < game.play_fee) {
    //   alert("Insufficient credits to play")
    //   return
    // }
    
    //check user game balance
    let GAMErBalance = await solana.getTokenBalance(userData.deposit_wallet,GAME)
    //check user sol balance
        GAMErBalance = GAMErBalance  / 10 ** 9
    
    if (!isFree) {

      if (GAMErBalance < game.play_fee) {
        setErrorMessage('you need more GAMEr tokens to play')
        setShowErrorModal(true)
        return
      }

      const response = await fetch("/api/arcade/start", {
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
        return
      }
    }
    setGameStarted(true)
    if (gameInstance && typeof gameInstance.start === "function") {
      gameInstance.start()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    )
  }

  if (!game) return <div>Game not found</div>

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text animate-pulse">
          🎮 High Score Arcade: Beat the Best, Win Big! 🏆
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    <span className="text-2xl font-bold text-white">Score: {score}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-6 h-6 text-blue-400" />
                    <span className="text-2xl font-bold text-white">Time: {Math.floor(timer)}s</span>
                  </div>
                </div>
                {!gameStarted ? (
                  <div className="flex justify-center">
                    <Image
                      src={game.full_size_image || "/placeholder.svg?height=600&width=800"}
                      alt={game.title}
                      width={800}
                      height={600}
                      className="rounded-lg shadow-lg"
                    />
                  </div>
                ) : (
                  <GamePreview
                    gameCode={game.game_code}
                    gameCss={game.game_css}
                    onScoreUpdate={setScore}
                    onTimerUpdate={setTimer}
                  />
                )}
                <div className="flex justify-center space-x-4 mt-4">
                  <Button
                    onClick={() => handlePlay(false)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    Play Now ({game.play_fee} credits)
                  </Button>
                  <Button onClick={() => handlePlay(true)} variant="outline">
                    Play Free
                  </Button>
                </div>
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
            <Tabs defaultValue="description" className="mt-6">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="rules">Rules</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>
              <TabsContent value="description">
                <Card>
                  <CardContent className="pt-6">
                    <p>
                      {game.description.split('\n').map((line:any, index:any) => (
                        <React.Fragment key={index}>
                          {line}
                          <br />
                        </React.Fragment>
                      ))}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="rules">
                <Card>
                  <CardContent className="pt-6">
                  <p>
                  {game.rules.split('\n').map((line:any, index:any) => (
                    <React.Fragment key={index}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="comments">
                <Card>
                  <CardContent className="pt-6">
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
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Top Payout Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length > 0 ? (
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
                ) : (
                  <div className="text-center py-8">
                    <p className="text-2xl font-bold text-primary mb-2">Be the First Champion!</p>
                    <p className="text-lg">Start playing now and get your score on the board!</p>
                  </div>
                )}
                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h3 className="font-bold text-lg mb-2 text-primary">Top Payout Explained:</h3>
                  <p className="text-sm">
                    If the top payout is the top 10 and you fail to beat the 8th score, players 1 - 8 earn a portion of
                    your play fee. Aim high and win big!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <PauseModal isOpen={isPauseModalOpen} onClose={() => setIsPauseModalOpen(false)} message={pauseMessage} />
      {showSuccessModal && (
          <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
        )}
        {showErrorModal && (
          <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
        )}
    </div>
  )
}


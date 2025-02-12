"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { GameGrid } from "@/components/game-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  PlusCircle,
  Wand2,
  Zap,
  Trophy,
  Flame,
  Gamepad2,
  TestTube,
  Coins,
  MessageSquare,
  Users,
  Target,
  Hand,
  Grab,
  ShoppingCart,
  Sparkles,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"

interface Game {
  id: string
  title: string
  image: string
  play_fee: number
  high_score: number
  high_score_player: string
  boost: number
  category: string
}

interface HomeContentProps {
  randomMerchImage: string
}

export function HomeContent({ randomMerchImage }: HomeContentProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const [testableGames, setTestableGames] = useState<Game[]>([])
  const { publicKey } = useWallet()
  const router = useRouter()
  
  useEffect(() => {
    fetchGames()
    fetchTestableGames()
  }, [])

  const fetchGames = async () => {
    // const { data, error } = await supabase.from("arcade").select("*").order("created_at", { ascending: false })
// Step 1: Fetch all arcade data
const { data: arcadeData, error: arcadeError } = await supabase
  .from("arcade")
  .select("*")
  .eq('status', 3)
  .order("created_at", { ascending: false });

    if (arcadeError) {
      console.error("Error fetching arcade data:", arcadeError);
    } else {
      // Extract unique top_scorer values from arcade data
      const topScorers = [...new Set(arcadeData.map(item => item.top_scorer))];
      
      // Step 2: Fetch users whose publicKey matches any of the top_scorer values
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("publicKey, avatar_url, username")
        .in('publicKey', topScorers); // Match publicKey against the list of top_scorers

      if (usersError) {
        console.error("Error fetching user data:", usersError);
      } else {
        // Create a map of users for quick lookup
        const usersMap = new Map(usersData.map(user => [user.publicKey, user]));

        // Step 3: Combine arcade data with corresponding user data
        const result = arcadeData.map(arcadeItem => {
          const user = usersMap.get(arcadeItem.top_scorer); // Find the user by top_scorer
          return {
            ...arcadeItem,
            user: user || null // Attach user data or null if no match is found
          };
        });
        setGames(result || [])

        // console.log("Result:", result);
      }
    }

  }

  const fetchTestableGames = async () => {
    const { data, error } = await supabase
      .from("arcade")
      .select("*")
      .eq("status",1)
      .order("created_at", { ascending: false })
      .limit(4)

    if (error) {
      console.error("Error fetching testable games:", error)
    } else {
      setTestableGames(data || [])
    }
  }

  const gameCategories = [
    { name: "Featured Games", games: games.slice(0, 12), icon: <Flame className="w-6 h-6 text-orange-500" /> },
    {
      name: "Strategy Games",
      games: games.filter((game) => game.category === "Strategy").slice(0, 12),
      icon: <Trophy className="w-6 h-6 text-yellow-500" />,
    },
    {
      name: "Puzzle Games",
      games: games.filter((game) => game.category === "Puzzle").slice(0, 12),
      icon: <Zap className="w-6 h-6 text-blue-500" />,
    },
    {
      name: "Shooter Games",
      games: games.filter((game) => game.category === "Shooter").slice(0, 12),
      icon: <Gamepad2 className="w-6 h-6 text-red-500" />,
    },
  ]

  useEffect(() => {
    let startY = 0
    let currentY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY
    }

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].pageY
      if (currentY - startY > 70 && window.scrollY === 0) {
        setIsRefreshing(true)
      }
    }

    const handleTouchEnd = () => {
      if (isRefreshing) {
        fetchGames()
        fetchTestableGames()
        setTimeout(() => {
          setIsRefreshing(false)
        }, 1000)
      }
    }
    
    document.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isRefreshing])
  
  const handleViewShop = () => {
    router.push("/shop")
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <Header />
      <div className={`pull-to-refresh ${isRefreshing ? "active" : ""}`} />
      <main className="container mx-auto px-4 py-8 pb-20">
        <Hero />
        <section className="my-16 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-8 shadow-2xl">
          <h2 className="text-3xl font-bold mb-6 text-primary text-center flex items-center justify-center">
            <Wand2 className="w-8 h-8 mr-2 text-purple-400" />
            Create Your AI-Powered Game
          </h2>
          <p className="text-lg mb-8 text-center max-w-2xl mx-auto text-gray-300">
            Harness the power of AI to bring your game ideas to life! Join the Gamerholic community and start creating
            innovative, engaging games with ease.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-purple-800/30 hover:bg-purple-800/50 transition-colors border border-purple-500/30">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Wand2 className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-purple-300">AI-Assisted Design</h3>
                <p className="text-sm text-gray-300">
                  Let AI help you design game mechanics, levels, and characters with ease.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-800/30 hover:bg-yellow-800/50 transition-colors border border-yellow-500/30">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Zap className="w-12 h-12 text-yellow-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-yellow-300">Rapid Prototyping</h3>
                <p className="text-sm text-gray-300">
                  Quickly turn your ideas into playable prototypes using AI-generated code.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-800/30 hover:bg-green-800/50 transition-colors border border-green-500/30">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Trophy className="w-12 h-12 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-green-300">Competitive Edge</h3>
                <p className="text-sm text-gray-300">
                  Stand out in the Gamerholic marketplace with unique, AI-enhanced gameplay.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-2xl font-semibold mb-4 text-center text-primary">Ready to revolutionize gaming?</h3>
            <Link href="/create-game">
              <Button className="px-8 py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <PlusCircle className="mr-2 h-6 w-6" />
                Start Creating Your Game
              </Button>
            </Link>
          </div>
        </section>
        <div className="space-y-12">
          {testableGames.length > 0 && (
            <GameGrid
              games={testableGames}
              title="Games Available for Testing"
              icon={<TestTube className="w-6 h-6 text-green-500" />}
              className="neon-border-1 bg-card/50 p-6 rounded-lg shadow-lg"
              showNoGamesMessage={false}
            />
          )}
          {gameCategories.map((category, index) => (
            <GameGrid
              key={category.name}
              games={category.games}
              title={category.name}
              icon={category.icon}
              className={`neon-border-${(index % 3) + 1} bg-card/50 p-6 rounded-lg shadow-lg`}
              showNoGamesMessage={true}
            />
          ))}
          <section className="my-16 bg-gradient-to-r from-blue-900/50 to-green-900/50 rounded-lg p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-primary text-center flex items-center justify-center">
              <TestTube className="w-8 h-8 mr-2 text-blue-400" />
              Get Paid to Test Games
            </h2>
            <p className="text-lg mb-8 text-center max-w-2xl mx-auto text-gray-300">
              Earn credits while helping improve the gaming experience! Test new games before they're released and
              provide valuable feedback to developers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-blue-800/30 hover:bg-blue-800/50 transition-colors border border-blue-500/30">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Gamepad2 className="w-12 h-12 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-blue-300">Play Unreleased Games</h3>
                  <p className="text-sm text-gray-300">
                    Be among the first to experience new and exciting games before they hit the market.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-green-800/30 hover:bg-green-800/50 transition-colors border border-green-500/30">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Coins className="w-12 h-12 text-green-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-green-300">Earn Credits</h3>
                  <p className="text-sm text-gray-300">
                    Get rewarded with credits for your time and effort in testing games.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-800/30 hover:bg-yellow-800/50 transition-colors border border-yellow-500/30">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <MessageSquare className="w-12 h-12 text-yellow-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-yellow-300">Provide Feedback</h3>
                  <p className="text-sm text-gray-300">
                    Help shape the future of games by providing valuable feedback to developers.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center">
              <Link href="/game-testing">
                <Button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <TestTube className="mr-2 h-5 w-5" />
                  Start Testing Games
                </Button>
              </Link>
            </div>
          </section>
          
                    {/* Gamerholic Merch Section */}
                    <section className="my-16 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-8 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
            <div className="flex flex-col lg:flex-row items-center justify-between relative z-10 gap-8">
              <div className="lg:w-1/2 w-full">
                <h2 className="text-4xl font-bold mb-6 text-primary bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                  <Sparkles className="inline-block mr-2 h-10 w-10 text-yellow-400" />
                  Gamerholic Merch
                </h2>
                <p className="text-2xl mb-6 text-gray-300 font-semibold">Wear Your Game, Own Your Style!</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Exclusive designs for true gamers</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Merch sold with proof of authenticity NFT</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Lock GAMEr tokens for exclusive discounts</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Limited edition drops for collectors</span>
                  </li>
                </ul>
                <Button onClick={handleViewShop} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <ShoppingCart className="mr-2 h-6 w-6" />
                  Shop Now
                </Button>
              </div>
              <div className="lg:w-1/2 w-full max-w-md mx-auto mt-8 lg:mt-0">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <div className="relative">
                    <div className="w-full aspect-square relative overflow-hidden rounded-lg">
                      <Image
                        src={randomMerchImage || "/placeholder.svg"}
                        alt="Gamerholic Merchandise"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg shadow-2xl transform transition-all duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-lg font-bold">Exclusive NFT Included</p>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs font-mono p-2 rounded">
                      #GamerNFT-
                      {Math.floor(Math.random() * 10000)
                        .toString()
                        .padStart(4, "0")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Esports Value Proposition Section */}
          <section className="my-16 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-primary text-center flex items-center justify-center">
              <Trophy className="w-8 h-8 mr-2 text-yellow-400" />
              Esports: Compete and Earn
            </h2>
            <p className="text-lg mb-8 text-center max-w-2xl mx-auto text-gray-300">
              Challenge other players, participate in tournaments, and earn cryptocurrency rewards in our exciting
              esports arena!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-purple-800/30 hover:bg-purple-800/50 transition-colors border border-purple-500/30">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Users className="w-12 h-12 text-purple-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-purple-300">Head-to-Head Matches</h3>
                  <p className="text-sm text-gray-300">
                    Challenge specific players to intense 1v1 matches across various games.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-blue-800/30 hover:bg-blue-800/50 transition-colors border border-blue-500/30">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Target className="w-12 h-12 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-blue-300">Tournaments</h3>
                  <p className="text-sm text-gray-300">
                    Participate in regular tournaments with larger prize pools and fierce competition.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-green-800/30 hover:bg-green-800/50 transition-colors border border-green-500/30">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Coins className="w-12 h-12 text-green-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-green-300">Crypto Rewards</h3>
                  <p className="text-sm text-gray-300">
                    Win matches and tournaments to earn cryptocurrency rewards directly to your wallet.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center">
              <Link href="/esports">
                <Button className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <Trophy className="mr-2 h-5 w-5" />
                  Enter Esports Arena
                </Button>
              </Link>
            </div>
          </section>

          {/* Grabbit Value Proposition Section */}
          <section className="my-16 bg-gradient-to-r from-cyan-900/50 to-emerald-900/50 rounded-lg p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-primary text-center flex items-center justify-center">
              <Grab className="w-8 h-8 mr-2 text-cyan-400" />
              Grabbit: Fast-Paced Crypto Fun
            </h2>
            <p className="text-lg mb-8 text-center max-w-2xl mx-auto text-gray-300">
              Experience the thrill of quick-fire gameplay and win crypto prizes in our exciting new game, Grabbit!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-cyan-800/30 hover:bg-cyan-800/50 transition-colors border border-cyan-500/30">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Hand className="w-12 h-12 text-cyan-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-cyan-300">Grab and Hold</h3>
                  <p className="text-sm text-gray-300">
                    Seize the prize and hold on tight for 10 seconds to claim your crypto reward!
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-800/30 hover:bg-emerald-800/50 transition-colors border border-emerald-500/30">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Zap className="w-12 h-12 text-emerald-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-emerald-300">Quick Actions</h3>
                  <p className="text-sm text-gray-300">
                    Use slaps and sneaks to outmaneuver your opponents and secure the prize.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-teal-800/30 hover:bg-teal-800/50 transition-colors border border-teal-500/30">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Coins className="w-12 h-12 text-teal-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-teal-300">Instant Rewards</h3>
                  <p className="text-sm text-gray-300">Win games to instantly receive crypto prizes in your wallet.</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center">
              <Link href="/games/grabbit">
                <Button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <Grab className="mr-2 h-5 w-5" />
                  Play Grabbit Now
                </Button>
              </Link>
            </div>
          </section>
        
        </div>
      </main>
    </div>
  )
}


"use client"

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { Sparkles, Zap,Users, DollarSign, Trophy } from "lucide-react"
import { Header } from '@/components/header'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useWallet } from '@solana/wallet-adapter-react'
import { SuccessModal } from '@/components/success-modal'
import { ErrorModal } from '@/components/error-modal'

// Mock data for available Grabbit games


const GrabbitGameCard = ({ game }:any) => {
  const router = useRouter()

  return (
    
    <Card
      className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border-primary/20 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/grabbit/${game.game_id}`)}
    >
      <CardHeader className="p-0">
        <img
          src={game.image || "/placeholder.svg"}
          alt={game.title}
          className="w-full h-40 object-cover rounded-t-lg"
        />
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-xl mb-2 text-primary">{game.title}</CardTitle>
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline" className="text-primary border-primary">
            <Users className="w-4 h-4 mr-1" />
            {game.players_ready}/{game.players_min} <small>({game.players_max}) max</small>
          </Badge>
          <Badge variant="outline" className="text-primary border-primary">
            <DollarSign className="w-4 h-4 mr-1" />
            {game.entry_fee} SOL
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <p className="text-sm text-primary/80">
          Players: {game.players_min}-{game.players_max}
        </p>
      </CardFooter>
    </Card>
  )
}

export default function GrabbitDiscovery() {
  const [currentPage, setCurrentPage]:any = useState(1)
  const gamesPerPage = 9
  
  const indexOfLastGame = currentPage * gamesPerPage
  const indexOfFirstGame = indexOfLastGame - gamesPerPage
  const [gamesData, setGamesData]:any = useState([])
  const totalPages = Math.ceil(gamesData.length / gamesPerPage)
  const { publicKey }:any = useWallet()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  const [showCreatePractice, setShowCreatePractice]:any = useState()
  
  const supabase = createClientComponentClient()
  
    useEffect(() => {
        
        fetchGames()
    }, [])
    let isFetching = false;

  const fetchGames = async () => {
    if (isFetching) return; // Skip if a fetch is already in progress
    isFetching = true;
    
    const { data, error } = await supabase
    .from("grabbit")
    .select(`*`)
    .eq("status", 1)
    setGamesData(data)
    
        const { count,  }:any = await supabase
        .from("grabbit")
        .select("id", { count: "exact" }) // Use `id` or any column name here; it doesn't matter for counting
        .eq("title", "practice")
        .eq('status', 1)
        
        if(count<1){
            setShowCreatePractice(true)
        }

  }
  
  const handleCreatePractice = async () => {
  
    const response = await fetch("/api/grabbit/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: publicKey
        
        })
    })
    const data = await response.json();
    console.log(data)
    if(data.success){
        setShowSuccessModal(true)
        setSuccessMessage('practice game created')
        fetchGames()
    }else{
        setShowErrorModal(true)
        setErrorMessage('error creating practice game')
    
    }
  
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
    <Header />
    <div className="container mx-auto p-4 space-y-8">
    <section className="mb-12 text-center mt-9">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16 px-4 rounded-lg shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-pulse">
            <Sparkles className="inline-block mr-2 h-8 w-8" />A Fun, Fast-Paced, Multiplayer Game
            <Sparkles className="inline-block ml-2 h-8 w-8" />
          </h2>
          <p className="text-2xl md:text-3xl mb-8">Win Solana & Other Crypto Prizes!</p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center">
              <Zap className="h-6 w-6 mr-2 text-yellow-300" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-2 text-blue-300" />
              <span>Multiplayer Action</span>
            </div>
            <div className="flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
              <span>Crypto Rewards</span>
            </div>
          </div>
          {showCreatePractice && publicKey  && (
                    <div className="text-center mt-8">
                    <Button className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded-full" onClick={handleCreatePractice} >
                        Create Practice Game
                    </Button>
                </div>
          )}
          {!publicKey  && (
                    <div className="text-center mt-8">
                    <h3 className="text-center">connect wallet to create game</h3>
                </div>
          )}
        
        </div>
      </section>
      {gamesData && gamesData.length> 0 && (
        <>
            <h1 className="text-3xl font-bold text-center text-primary mb-8">Available Grabbit Games</h1>
      
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gamesData.map((game:any) => (
                <GrabbitGameCard key={game.game_id} game={game} />
                ))}
            </div>
            
            <div className="flex justify-center mt-8">
                <Pagination currentpage={currentPage} totalpages={totalPages} />
                {/*original, removed due to brower error */}
                {/* <Pagination currentpage={currentPage} totalpages={totalPages} onPageChange={setCurrentPage} /> */}

            </div>
            
            <div className="text-center mt-8">
                <Link href="/grabbit">
                <Button className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded-full">
                    Back to Grabbit Home
                </Button>
                </Link>
            </div>
        </>
        )}
    
    </div>
    {showSuccessModal && (
        <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
      )}
      {showErrorModal && (
        <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
      )}
</div>
  )
}


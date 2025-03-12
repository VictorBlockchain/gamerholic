"use client"

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { Sparkles, Zap,Users, DollarSign, Trophy,Upload } from "lucide-react"
import { Header } from '@/components/header'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useWallet } from '@solana/wallet-adapter-react'
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
import {
  // getDepositWalletBalance,
  searchUsers,
  generateDepositWallet,
} from "@/lib/platformWallet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// Mock data for available Grabbit games

const GrabbitGameCard = ({ game }:any) => {
  const router = useRouter()
  
  const [userData, setUserData]:any = useState<Partial<User>>({})
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  const [avatarFile, setAvatarFile]:any = useState('')
  const randomPageNumber = Math.floor(Math.random() * 6) + 1;
  const imagePath = `/grab${randomPageNumber}.jpg`;

  return (
    
    <Card
      className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border-primary/20 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/grabbit/${game.game_id}`)}
    >
      <CardHeader className="p-0">
        <img
          src={game.image || imagePath}
          alt={game.title}
          className="w-full h-40 object-cover rounded-t-lg"
        />
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-xl mb-2 text-primary">{game.title} {game.prize_token}</CardTitle>
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

  const [userData, setUserData]:any = useState<Partial<User>>({})
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  const [showCreatePractice, setShowCreatePractice]:any = useState()
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [avatarFile, setAvatarFile]:any = useState('')
  
  const [user_id, setUserId]:any = useState('')
  const [user_name, setUserName]:any = useState('')
  const [user_avater, setUserAvatar]:any = useState('')


  const supabase = createClientComponentClient()
  
    useEffect(() => {
      fetchUser()
        fetchGames()
    }, [])
    let isFetchingUser = false;
    let isFetchingGames = false;
  
const fetchUser = async () => {
  if (isFetchingUser) return; // Skip if a fetch is already in progress
  isFetchingUser = true;
  
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
    isFetchingUser = false;
  }
};

  const fetchGames = async () => {
    if (isFetchingGames) return; // Skip if a fetch is already in progress
    isFetchingGames = true;
    
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
        
        if(count<2){
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
        .eq('publicKey', publicKey.toBase58());
        setAvatarFile(avatarUrl)
      if (error) {
        console.error("Error updating avatar:", error);
      } else {
        console.log("Avatar updated successfully!");
      }
    };
    
      const handleSetUserName = async () =>{
      
        let name = userData.name
        //check if username is taken
        let { data, error }:any = await supabase
        .from("users")
        .select("*")
        .eq("username", name)
        .maybeSingle()
        if(data){
          handleErrorNotification("user name taken")

        }else{
        
          let data_wallet:any = await generateDepositWallet(publicKey)
          if(data_wallet.success){
          
              const { data, error } = await supabase
              .from("users")
              .update({ username: name }) // Updating the username
              .eq("publicKey", publicKey.toBase58());       // Condition to match the publicKey
              console.log(publicKey.toBase58())
              if (!data) {
                  // console.error("Update Error:", error);
                  handleErrorNotification("theres an error " + error)
              } else {
                  // console.log("Username updated successfully:", data);
                  setShowUserNameModal(false)
                  handleSuccessNotification("user name updated")
              }
          
          }else{
              handleErrorNotification("theres an error " + data_wallet.message)
          
          }
        }
      
      
      }
    
      const handleSuccessNotification = (message: string) => {
        setSuccessMessage(message)
        setShowSuccessModal(true)
      }
      
      const handleErrorNotification = (message:string) => {
        setErrorMessage(message)
        setShowErrorModal(true)
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
    
    <Dialog open={showUserNameModal} onOpenChange={() => setShowUserNameModal(false)}>
      <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-primary">Profile Setup</DialogTitle>
          <DialogDescription>Complete your profile in 3 easy steps</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-primary mb-2">1. Set Your Avatar</h3>
              <div className="flex items-center space-x-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarFile} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                    {userData.name ? userData.name[0].toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors">
                      <Upload size={16} />
                      <span>Upload Avatar</span>
                    </div>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-primary mb-2">2. Set Your Username</h3>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={userData.name || ""}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  placeholder="e.g. CyberNinja"
                  className="bg-background/50 border-primary/20"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-primary mb-2">3. Generate Deposit Address</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Click 'Update Profile' to generate your unique deposit address.
              </p>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button onClick={() => setShowUserNameModal(false)} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSetUserName}
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Update Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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


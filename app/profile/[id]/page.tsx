"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { withdrawUserCredits, createDepositAddress, isValidPublicKey } from "@/lib/platformWallet"
import { DepositForm } from "@/components/deposit-form"
import { Loader2, Upload, Gamepad, Trophy, Coins, Zap, Star } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/components/ui/use-toast"
import { GamesBeingTested } from "@/components/games-being-tested"
import { WithdrawEarningsModal } from "@/components/withdraw-earnings-modal"
import { DepositModal } from "@/components/deposit-modal"
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

interface GameHistory {
  id: any
  title: any
  score: any
  play_date: any
}

interface CreatedGame {
  id: string
  title: string
  earnings: number
}

interface TestingGame {
  id: string
  title: string
  assigned_at: string
  status: string
}

export default function ProfilePage() {
  const { publicKey } = useWallet()
  const [username, setUsername] = useState("")
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [credits, setCredits] = useState(0)
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([])
  const [createdGames, setCreatedGames] = useState<CreatedGame[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [testerEarnings, setTesterEarnings] = useState(0)
  const [depositAddress, setDepositAddress] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false)
  const [gamesBeingTested, setGamesBeingTested] = useState<TestingGame[]>([])
  const [achievements, setAchievements] = useState([
    { id: 1, name: "First Win", description: "Win your first game", completed: true },
    { id: 2, name: "Big Spender", description: "Spend 1000 credits", completed: false },
    { id: 3, name: "Game Creator", description: "Create your first game", completed: false },
  ])
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  
  const [userData, setUserData]:any = useState<Partial<User>>({})
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  const [avatarFile, setAvatarFile]:any = useState('')
  const [balance, setBalance] = useState({ sol: 0, game: 0 })
  
  const [user_id, setUserId]:any = useState('')
  const [user_name, setUserName]:any = useState('')
  const [user_avater, setUserAvatar]:any = useState('')

  
  useEffect(() => {
    if (publicKey) {
      fetchUser()
      fetchGameHistory()
      fetchCreatedGames()
      fetchOrCreateDepositAddress()
      fetchGamesBeingTested()
    }
  }, [publicKey])
  let isFetching = false;

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
              setCredits(data.credits || 0)
              setTotalEarnings(data.total_earnings || 0)
              setTesterEarnings(data.tester_earnings || 0)
      
              setUserName(data.username)
              setAvatarUrl(data.avatar_url || "")
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


  const fetchGameHistory = async () => {
    const { data, error } = await supabase
      .from("game_history")
      .select("url_game_id, score, title, play_date")
      .eq("player", publicKey)
      .order("play_date", { ascending: false })
    
    if (error) {
      console.error("Error fetching game history:", error)
    } else {
      
      setGameHistory(
        data.map((item:any) => ({
          id: item.url_game_id,
          title: item.title,
          score: item.score,
          play_date: new Date(item.play_at).toLocaleString(),
        })),
      )
    }
  }

  const fetchCreatedGames = async () => {
    const { data, error }:any = await supabase
      .from("games")
      .select("id, title, creator_earnings")
      .eq("creator_wallet", publicKey!.toBase58())

    if (error) {
      console.error("Error fetching created games:", error)
    } else {
      setCreatedGames(data)
    }
  }

  const fetchGamesBeingTested = async () => {
    const { data, error } = await supabase
      .from("user_testing_games")
      .select("id, games(id, title), assigned_at, status")
      .eq("user_id", publicKey!.toBase58())
      .order("assigned_at", { ascending: false })

    if (error) {
      console.error("Error fetching games being tested:", error)
    } else {
      setGamesBeingTested(
        data.map((item) => ({
          id: item.games.id,
          title: item.games.title,
          assigned_at: new Date(item.assigned_at).toLocaleString(),
          status: item.status,
        })),
      )
    }
  }

  const handleUsernameChange = async () => {
    if (!publicKey) return

    try {
      const { error } = await supabase.from("users").update({ username }).eq("wallet", publicKey.toBase58())

      if (error) throw error

      toast({
        title: "Success",
        description: "Username updated successfully!",
      })
      await fetchUserData()
    } catch (error) {
      console.error("Error updating username:", error)
      toast({
        title: "Error",
        description: "Failed to update username. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File is too large. Maximum size is 5MB.",
          variant: "destructive",
        })
        return
      }
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Invalid file type. Please upload an image.",
          variant: "destructive",
        })
        return
      }

      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
      setErrorMessage(null)
    }
  }

  const handleUpdateProfile = async () => {
    if (!publicKey || !avatar) return

    setIsUploading(true)

    try {
      const fileExt = avatar.name.split(".").pop()
      const fileName = `${publicKey.toBase58()}-${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage.from("avatars").upload(fileName, avatar)

      if (error) throw error

      const {
        data: { publicUrl },
        error: urlError,
      } = supabase.storage.from("avatars").getPublicUrl(data.path)

      if (urlError) throw urlError

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("wallet", publicKey.toBase58())

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setAvatarPreview(null)
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
      await fetchUserData()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Error updating profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleWithdraw = async (amount: number) => {
    if (!publicKey) return

    try {
      const success = await withdrawUserCredits(publicKey.toBase58(), amount)
      if (success) {
        toast({
          title: "Success",
          description: `Successfully withdrawn ${amount} SOL`,
        })
        await fetchUserData()
      } else {
        toast({
          title: "Error",
          description: "Failed to withdraw earnings. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error withdrawing earnings:", error)
      toast({
        title: "Error",
        description: "Error withdrawing earnings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchOrCreateDepositAddress = async () => {
    if (!publicKey) return

    setIsGeneratingAddress(true)
    setErrorMessage(null)

    try {
      const userId = publicKey.toBase58()
      if (!isValidPublicKey(userId)) {
        throw new Error("Invalid public key")
      }

      const { data, error } = await supabase
        .from("users")
        .select("deposit_wallet")
        .eq("publicKey", userId)
        .single()
      
      if (error) {
        // if (error.code === "PGRST116") {
        //   const newAddress = await createDepositAddress(userId)
        //   setDepositAddress(newAddress)
        // } else {
        //   throw error
        // }
      } else {
        setDepositAddress(data.deposit_wallet)
      }

      toast({
        title: "Success",
        description: "Deposit address fetched successfully!",
      })
    } catch (error) {
      console.error("Error fetching or creating deposit address:", error)
      setErrorMessage("Unable to fetch or create deposit address. Please try again.")
      toast({
        title: "Error",
        description: "Unable to fetch or create deposit address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAddress(false)
    }
  }

  if (!publicKey) {
    return <div>Please connect your wallet to view your profile.</div>
  }

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
  
    const handleSetUserName = async () =>{
    
      let name = userData.name
      
      let data_wallet:any = await generateDepositWallet(publicKey)
      if(data_wallet.success){
      
          const { data, error } = await supabase
          .from("users")
          .update({ username: name }) // Updating the username
          .eq("publicKey", publicKey);       // Condition to match the publicKey
          
          if (error) {
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
  
    const handleSuccessNotification = (message: string) => {
      setSuccessMessage(message)
      setShowSuccessModal(true)
    }
    
    const handleErrorNotification = (message:string) => {
      setErrorMessage(message)
      setShowErrorModal(true)
    }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="relative h-64 rounded-lg overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-75"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-background">
                <AvatarImage src={avatarPreview || avatarUrl} alt={username} />
                <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h1 className="text-4xl font-bold text-white mb-2">{username}</h1>
              <p className="text-xl text-white">
                {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Game Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Games Played</p>
                  <p className="text-2xl font-bold">{gameHistory.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Games Created</p>
                  <p className="text-2xl font-bold">{createdGames.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Balance <small>SOL</small></CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-center">{credits}</p>
              <Button
                onClick={() => setIsDepositModalOpen(true)}
                className="w-full mt-4 bg-gradient-to-r from-red-400 to-blue-500 hover:from-red-500 hover:to-blue-600"
              >
                <Coins className="mr-2 h-4 w-4" /> Deposit
              </Button>
              {/* <Button onClick={() => setIsDepositModalOpen(true)}>
                      <Coins className="mr-2 h-4 w-4" />
                      Deposit SOL
                    </Button> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>GAME</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-center">{totalEarnings.toFixed(2)}</p>
              <Button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="w-full mt-4 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
              >
                <Coins className="mr-2 h-4 w-4" /> Withdraw
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Earnings <small>SOL</small></CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-center">{testerEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <Button
                    onClick={handleUsernameChange}
                    className="w-full bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600"
                  >
                    Update Username
                  </Button>
                  <div>
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-muted-foreground hover:border-primary transition-colors">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview || "/placeholder.svg"}
                            alt="Avatar preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <p>Upload new avatar</p>
                          </div>
                        )}
                      </div>
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      accept="image/*"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isUploading || !avatar}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Profile...
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                  {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="games">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Game History</CardTitle>
                </CardHeader>
                <CardContent>
                  {gameHistory.length > 0 ? (
                    <ul className="space-y-2">
                      {gameHistory.map((game) => (
                        <li
                          key={game.id}
                          className="flex justify-between items-center p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <div>
                            <Link href={`/play/${game.id}`} className="text-primary hover:underline font-semibold">
                              {game.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">{game.played_at}</p>
                          </div>
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                            <span>{game.score}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>You haven't played any games yet.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Created Games</CardTitle>
                </CardHeader>
                <CardContent>
                  {createdGames.length > 0 ? (
                    <ul className="space-y-2">
                      {createdGames.map((game) => (
                        <li
                          key={game.id}
                          className="flex justify-between items-center p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <Link href={`/play/${game.id}`} className="text-primary hover:underline font-semibold">
                            {game.title}
                          </Link>
                          <div className="flex items-center">
                            <Coins className="w-4 h-4 mr-1 text-green-500" />
                            <span>{game.earnings} credits</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>You haven't created any games yet.</p>
                  )}
                  <Button
                    asChild
                    className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  >
                    <Link href="/create-game">
                      <Gamepad className="mr-2 h-4 w-4" /> Create a New Game
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="testing">
            <Card>
              <CardHeader>
                <CardTitle>Games Being Tested</CardTitle>
              </CardHeader>
              <CardContent>
                <GamesBeingTested games={gamesBeingTested} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {achievements.map((achievement) => (
                    <li key={achievement.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <h3 className="font-semibold">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                      {achievement.completed ? (
                        <Star className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <Star className="w-6 h-6 text-muted-foreground" />
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Your wallet address: {publicKey.toBase58()}</p>
                {depositAddress ? (
                  <p className="mb-4">Deposit address: {depositAddress}</p>
                ) : (
                  <div className="mb-4">
                    <p className="mb-2">No deposit address found.</p>
                    <Button onClick={fetchOrCreateDepositAddress} disabled={isGeneratingAddress}>
                      {isGeneratingAddress ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Address...
                        </>
                      ) : (
                        "Generate Deposit Address"
                      )}
                    </Button>
                  </div>
                )}
                {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
                <DepositForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <WithdrawEarningsModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          onWithdraw={handleWithdraw}
          balance={balance}
        />
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          depositAddress={depositAddress}
        />
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

        <motion.div
          className="fixed bottom-8 right-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Button
            asChild
            className="rounded-full w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
          >
            <Link href="/discover">
              <Zap className="w-8 h-8" />
            </Link>
          </Button>
        </motion.div>
      </main>
    </div>
  )
}


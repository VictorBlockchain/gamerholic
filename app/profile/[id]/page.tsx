"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { withdrawUserCredits } from "@/lib/platformWallet"
import { Loader2, Upload, Gamepad, Trophy, Coins, Zap } from "lucide-react"
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
} from "@/components/ui/dialog"
import { generateDepositWallet } from "@/lib/platformWallet"
import { balanceManager } from "@/lib/balance"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
const GAMER = process.env.NEXT_PUBLIC_GAMERHOLIC;

const BALANCE = new balanceManager()

interface GameHistory {
  id: string
  title: string
  score: number
  play_date: string
}

interface CreatedGame {
  id: string
  title: string
  earnings: number
}

interface TestingGame {
  arcade_id: number
  title: string
  assigned_at: string
  status: string
  thumbnail: string
  category: string
  reward: number
}

interface User {
  id: string
  username: string
  avatar_url: string
  deposit_wallet: string
  balance_sol: number
  balance_game: number
}

interface EsportsRecord {
  game: string
  wins: number
  losses: number
  win_streak: number
  loss_streak: number
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
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [withdrawType, setWithdrawType] = useState<"sol" | "game">("sol")
  const [esportsRecords, setEsportsRecords] = useState<EsportsRecord[]>([])

  const [userData, setUserData]:any = useState<Partial<User>>({})
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("")
  const [avatarFile, setAvatarFile] = useState("")

  const params = useParams()
  const profileId = params.id as string

  useEffect(() => {
    if (publicKey) {
      fetchUser()
      fetchGameHistory()
      fetchCreatedGames()
      fetchGamesBeingTested()
      fetchEsportsRecords()
    }
  }, [publicKey])

  const fetchUser = async () => {
    if (!publicKey) return

    try {
      const { data, error } = await supabase.from("users").select("*").eq("publicKey", publicKey.toBase58()).single()

      if (error && error.code !== "PGRST116") {
        console.error("Select Error:", error)
        return
      }

      if (!data) {
        const { error: insertError } = await supabase.from("users").insert([{ publicKey: publicKey.toBase58() }])

        if (insertError) {
          console.error("Insert Error:", insertError)
        } else {
          setShowUserNameModal(true)
          console.log("New publicKey inserted into the database.")
        }
      } else {
        let balance_sol = 0
        let balance_gamer = 0
        if (data.deposit_wallet) {
          balance_sol = await BALANCE.getBalance(data.deposit_wallet)
          balance_gamer = await BALANCE.getTokenBalance(data.deposit_wallet, GAMER)

        }

        setUserData({
          id: data.id,
          username: data.username,
          deposit_wallet: data.deposit_wallet,
          avatar_url: data.avatar_url,
          balance_sol: balance_sol,
          balance_game: balance_gamer || 0,
        })
        setCredits(data.credits || 0)
        setTotalEarnings(data.total_earnings || 0)
        setTesterEarnings(data.tester_earnings || 0)
        setUsername(data.username || "")
        setAvatarUrl(data.avatar_url || "")
        if (!data.username) {
          setShowUserNameModal(true)
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const fetchGameHistory = async () => {
    if (!publicKey) return

    const { data, error } = await supabase
      .from("arcade_history")
      .select("game_id, score, title, play_date")
      .eq("player", publicKey.toBase58())
      .order("play_date", { ascending: false })

    if (error) {
      console.error("Error fetching game history:", error)
    } else {
      setGameHistory(
        data.map((item) => ({
          id: item.game_id,
          title: item.title,
          score: item.score,
          play_date: new Date(item.play_date).toLocaleString(),
        })),
      )
    }
  }

  const fetchCreatedGames = async () => {
    if (!publicKey) return

    const { data, error }: any = await supabase
      .from("arcade")
      .select("id, title, earnings_creator")
      .eq("creator", publicKey.toBase58())

    if (error) {
      console.error("Error fetching created games:", error)
    } else {
      setCreatedGames(data)
    }
  }

  const fetchGamesBeingTested = async () => {
    if (!publicKey) return

    const { data, error } = await supabase
      .from("arcade")
      .select("*")
      .eq("tester", publicKey.toBase58())
      .order("test_date", { ascending: false })

    if (error) {
      console.error("Error fetching games being tested:", error)
    } else {
      setGamesBeingTested(
        data.map((item) => ({
          arcade_id: item.arcade_id,
          title: item.title,
          assigned_at: new Date(item.test_date).toLocaleString(),
          status: item.status,
          thumbnail: item.thumbnail_image,
          category: item.category,
          reward: item.reward,
        })),
      )
    }
  }

  const fetchEsportsRecords = async () => {
    if (!publicKey) return

    const { data, error } = await supabase
      .from("esports_records")
      .select("game, wins, losses, win_streak, loss_streak")
      .eq("public_key", publicKey.toBase58())

    if (error) {
      console.error("Error fetching esports records:", error)
    } else {
      setEsportsRecords(data)
    }
  }

  const handleUsernameChange = async () => {
    if (!publicKey) return

    try {
      const { error } = await supabase.from("users").update({ username }).eq("publicKey", publicKey.toBase58())

      if (error) throw error

      toast({
        title: "Success",
        description: "Username updated successfully!",
      })
      await fetchUser()
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
      setErrorMessage("")
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
        .eq("publicKey", publicKey.toBase58())

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setAvatarPreview(null)
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
      await fetchUser()
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

  const fetchOrCreateDepositAddress = async () => {
    if (!publicKey) return

    setIsGeneratingAddress(true)
    setErrorMessage("")

    try {
      const userId = publicKey.toBase58()

      const { data, error }: any = await supabase
        .from("users")
        .select("deposit_wallet")
        .eq("publicKey", userId)
        .single()

      if (!data.deposit_wallet) {
        const response = await fetch("/api/generate_address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: userId,
            type: 1,
          }),
        })
        const resp = await response.json()
        if (resp.success) {
          setDepositAddress(resp.address)
        }
      }
      if (error) {
        throw error
      } else {
        setDepositAddress(data.deposit_wallet)
      }
    } catch (error) {
      setErrorMessage("Unable to fetch or create deposit address. Please try again.")
    } finally {
      setIsGeneratingAddress(false)
    }
  }

  const updateUserAvatar = async (publicKey: string, avatarUrl: string) => {
    const { error } = await supabase.from("users").update({ avatar_url: avatarUrl }).eq("publicKey", publicKey)
    setAvatarFile(avatarUrl)
    if (error) {
      console.error("Error updating avatar:", error)
    } else {
      console.log("Avatar updated successfully!")
    }
  }

  const handleSetUserName = async () => {
    if (!publicKey) return

    const name = userData.username

    const data_wallet = await generateDepositWallet(publicKey.toBase58())
    if (data_wallet.success) {
      const { data, error } = await supabase
        .from("users")
        .update({ username: name })
        .eq("publicKey", publicKey.toBase58())

      if (error) {
        handleErrorNotification("There's an error: " + error.message)
      } else {
        setShowUserNameModal(false)
        handleSuccessNotification("Username updated")
      }
    } else {
      handleErrorNotification("There's an error: " + data_wallet.message)
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

  const handleDeposit = (type: "sol" | "game") => {
    setIsDepositModalOpen(true)
  }

  const handleWithdraw = (type: "sol" | "game") => {
    setWithdrawType(type)
    setIsWithdrawModalOpen(true)
  }

  const handleWithdrawSubmit = async (amount: number, tokenAddres: any) => {
    if (!publicKey) return

    try {
      let type = 1;

      if (withdrawType != "sol") {
        type = 2
        }

        const response = await fetch("/api/profile/withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: publicKey,
            amount: amount,
            type: type,
            token: tokenAddres
          }),
        })
        const resp = await response.json()
        if(resp.success){
          await fetchUser()
          setIsWithdrawModalOpen(false)
          handleSuccessNotification('withdraw request processed')
    
        }
    } catch (error) {
      console.error("Error withdrawing:", error)
      toast({
        title: "Error",
        description: "Error withdrawing. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!publicKey) {
    return <div>Please connect your wallet to view your profile.</div>
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
              <CardTitle>
                Balance <small>SOL</small>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-center">{userData.balance_sol / 1_000_000_000 || 0}</p>
              <div className="flex justify-between mt-4">
                <Button onClick={() => handleDeposit("sol")} className="bg-green-500 hover:bg-green-600">
                  <Coins className="mr-2 h-4 w-4" /> Deposit
                </Button>
                <Button onClick={() => handleWithdraw("sol")} className="bg-red-500 hover:bg-red-600">
                  <Coins className="mr-2 h-4 w-4" /> Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>GAME</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-center">{userData.balance_game  || 0}</p>
              <div className="flex justify-between mt-4">
                <Button onClick={() => handleDeposit("game")} className="bg-green-500 hover:bg-green-600">
                  <Coins className="mr-2 h-4 w-4" /> Deposit
                </Button>
                <Button onClick={() => handleWithdraw("game")} className="bg-red-500 hover:bg-red-600">
                  <Coins className="mr-2 h-4 w-4" /> Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                Earnings <small>SOL</small>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-center">{testerEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="arcade">Arcade</TabsTrigger>
            <TabsTrigger value="testing">Arcade Testing</TabsTrigger>
            <TabsTrigger value="esports">Esports</TabsTrigger>
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
          <TabsContent value="arcade">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Arcade Play History</CardTitle>
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
                            <p className="text-sm text-muted-foreground">{game.play_date}</p>
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
                          <Link href={`/arcade/${game.id}`} className="text-primary hover:underline font-semibold">
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
                    <Link href="/arcade-create">
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
                <CardTitle>Arcade Games Being Tested</CardTitle>
              </CardHeader>
              <CardContent>
                <GamesBeingTested games={gamesBeingTested} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="esports">
            <Card>
              <CardHeader>
                <CardTitle>Esports Records</CardTitle>
              </CardHeader>
              <CardContent>
                {esportsRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game</TableHead>
                        <TableHead>Wins</TableHead>
                        <TableHead>Losses</TableHead>
                        <TableHead>Win Streak</TableHead>
                        <TableHead>Loss Streak</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {esportsRecords.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{record.game}</TableCell>
                          <TableCell>{record.wins}</TableCell>
                          <TableCell>{record.losses}</TableCell>
                          <TableCell>{record.win_streak}</TableCell>
                          <TableCell>{record.loss_streak}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>No esports records found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <CardTitle>Deposit Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                {userData.deposit_wallet ? (
                  <p className="mb-4">Deposit address: {userData.deposit_wallet}</p>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <WithdrawEarningsModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          onWithdraw={handleWithdrawSubmit}
          balance={withdrawType === "sol" ? userData.balance_sol || 0 : userData.balance_game || 0}
          type={withdrawType}
        />
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          depositAddress={userData.deposit_wallet || ""}
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
                        {userData.username ? userData.username[0].toUpperCase() : "?"}
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
                      value={userData.username || ""}
                      onChange={(e) => setUserData({ ...userData, username: e.target.value })}
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


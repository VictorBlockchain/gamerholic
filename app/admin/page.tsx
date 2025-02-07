"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import {
  getPlatformWalletBalance,
  getPlatformWallet,
  getTotalUserCredits,
  getGameStatistics,
  getFinancialStatistics,
  updatePayWallet,
  updatePlatformFees,
  searchUsers,
  generatePlatformWallet,
  processPlatformWithdrawal,
  addAdmin,
} from "@/lib/platformWallet"
import { useConnection } from "@solana/wallet-adapter-react"
import { motion } from "framer-motion"
import { Wallet, Settings, Users, GamepadIcon, Plus, RefreshCw, Search, AlertTriangle, Pause, Play } from "lucide-react"
import { toast } from "@/components/ui/use-toast"


export default function AdminPage() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [platformBalance, setPlatformBalance] = useState(0)
  const [totalUserCredits, setTotalUserCredits] = useState(0)
  const [gameStats, setGameStats] = useState([])
  const [financialStats, setFinancialStats] = useState({})
  const [platformWallet, setPlatformWallet] = useState("")
  const [gameCreationFee, setGameCreationFee] = useState(0)
  const [boostFee, setBoostFee] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [adminCredits, setAdminCredits] = useState(0)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [devFeePercentage, setDevFeePercentage] = useState(0)
  const [platformFeePercentage, setPlatformFeePercentage] = useState(0)
  const [topPlayerPercentage, setTopPlayerPercentage] = useState(0)
  const [supportTickets, setSupportTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [responseMessage, setResponseMessage] = useState("")
  const [isPlatformPaused, setIsPlatformPaused] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [newPlatformWallet, setNewPlatformWallet] = useState("")
  const [newAdminAddress, setNewAdminAddress]:any = useState("")
  const [newAdminRole, setNewAdminRole] = useState("admin")
  const [payWallet, setPaywallet] = useState('')
  
  useEffect(() => {
    if (publicKey) {
      // fetchData()
      // fetchSupportTickets()
      // checkSuperAdminStatus()
    }
  }, [publicKey])
  
  const fetchData = async () => {
    try {
      const data:any = await getPlatformWallet()
      setNewPlatformWallet(data.wallet_platform)
      setPaywallet(data.wallet_payment)
      let balance:any;
      if(data.success){
        balance = await getPlatformWalletBalance(data.wallet_platform)
        setPlatformBalance(balance || 0)
      }
      
      const credits = await getTotalUserCredits()
      setTotalUserCredits(credits)

      const stats:any = await getGameStatistics()
      setGameStats(stats)

      const financial = await getFinancialStatistics()
      setFinancialStats(financial)

      const { data: settings } = await supabase.from("platform_settings").select("*").single()
      setBoostFee(settings.boost_fee)
      setDevFeePercentage(settings.dev_fee_percentage)
      setPlatformFeePercentage(settings.platform_fee_percentage)
      setTopPlayerPercentage(settings.top_player_percentage)
      setIsPlatformPaused(settings.is_paused)
    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch admin data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchSupportTickets = async () => {
    const { data, error } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching support tickets:", error)
      toast({
        title: "Error",
        description: "Failed to fetch support tickets. Please try again.",
        variant: "destructive",
      })
    } else {
      setSupportTickets(data)
    }
  }

  const checkSuperAdminStatus = async () => {
    if (!publicKey) return
    const { data, error } = await supabase.rpc("is_super_admin", { user_id: publicKey.toBase58() })
    if (error) {
      console.error("Error checking super admin status:", error)
    } else {
      setIsSuperAdmin(data)
    }
  }

  const handleGeneratePlatformWallet = async () => {
    try {
      const data:any = await generatePlatformWallet()
      if(data.success){
        setNewPlatformWallet(data.message)
        toast({
          title: "Success",
          description: `New platform wallet generated. Public Key: ${data.message}`,
        })
      }else{
        toast({
          title: "error",
          description: `error: ${data.message}`,
        })
      }
     console.log(data)
    } catch (error) {
      console.error("Error generating platform wallet:", error)
      toast({
        title: "Error",
        description: "Failed to generate platform wallet. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const handleUpdatePayWallet = async () => {
    try {
      await updatePayWallet(payWallet)
      toast({
        title: "Success",
        description: "Platform wallet updated successfully",
      })
      fetchData()
    } catch (error) {
      console.error("Error updating platform wallet:", error)
      toast({
        title: "Error",
        description: "Failed to update platform wallet. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePlatformFees = async () => {
    try {
      await updatePlatformFees(devFeePercentage, platformFeePercentage, topPlayerPercentage, boostFee)
      toast({
        title: "Success",
        description: "Platform fees updated successfully",
      })
      fetchData()
    } catch (error) {
      console.error("Error updating platform fees:", error)
      toast({
        title: "Error",
        description: "Failed to update platform fees. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSearch = async () => {
    try {
      const results = await searchUsers(searchTerm)
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleWithdraw = async () => {
    const amount = Number.parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Invalid withdrawal amount",
        variant: "destructive",
      })
      return
    }

    try {
      const signature = await processPlatformWithdrawal(amount, publicKey!.toBase58())
      toast({
        title: "Success",
        description: `Successfully withdrawn ${amount} SOL. Transaction signature: ${signature}`,
      })
      setWithdrawAmount("")
      fetchData()
    } catch (error) {
      console.error("Error withdrawing SOL:", error)
      toast({
        title: "Error",
        description: "Failed to withdraw SOL. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTogglePlatformPause = async () => {
    try {
      const { data, error } = await supabase.rpc("toggle_platform_pause", {
        admin_user_id: publicKey!.toBase58(),
      })

      if (error) throw error

      setIsPlatformPaused(!isPlatformPaused)
      toast({
        title: "Success",
        description: `Platform ${isPlatformPaused ? "unpaused" : "paused"} successfully`,
      })
    } catch (error) {
      console.error("Error toggling platform pause:", error)
      toast({
        title: "Error",
        description: "Failed to toggle platform pause. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddAdmin = async () => {
    if (!isSuperAdmin) {
      toast({
        title: "Error",
        description: "Only super admins can add new admins",
        variant: "destructive",
      })
      return
    }

    try {
      await addAdmin(publicKey!.toBase58(), newAdminAddress, newAdminRole as "admin" | "super_admin")
      toast({
        title: "Success",
        description: "New admin added successfully",
      })
      setNewAdminAddress("")
      setNewAdminRole("admin")
    } catch (error) {
      console.error("Error adding new admin:", error)
      toast({
        title: "Error",
        description: "Failed to add new admin. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-6 text-primary neon-glow">Admin Dashboard</h1>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6">
              <p className="text-center text-lg">Please connect your wallet to access the admin dashboard.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <motion.h1
          className="text-4xl font-bold mb-8 text-primary neon-glow text-center"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Admin Dashboard
        </motion.h1>

        <Tabs defaultValue="platform" className="space-y-8">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 gap-4">
            <TabsTrigger value="platform" className="text-lg">
              <Wallet className="mr-2 h-5 w-5" />
              Platform Management
            </TabsTrigger>
            <TabsTrigger value="games" className="text-lg">
              <GamepadIcon className="mr-2 h-5 w-5" />
              Game Management
            </TabsTrigger>
            <TabsTrigger value="users" className="text-lg">
              <Users className="mr-2 h-5 w-5" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="support" className="text-lg">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Support Tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platform">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wallet className="mr-2 h-6 w-6 text-primary" />
                    Platform Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg">
                    Balance: <span className="font-bold text-primary">{platformBalance} SOL</span>
                  </p>
                  <p className="text-lg">
                    Total User Credits: <span className="font-bold text-primary">{totalUserCredits}</span>
                  </p>
                  {newPlatformWallet && (
                    <p className="text-lg">
                      Wallet: <span className="font-bold text-primary"><small>{newPlatformWallet}</small></span>
                    </p>
                  )}
                  <Button onClick={handleGeneratePlatformWallet} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Generate New Platform Wallet
                  </Button>
                    <div className="space-y-2">
                    <p className="text-lg">
                        Pay wallet: <span className="font-bold text-primary"><small>{payWallet}</small></span>
                      </p>
                      <div className="space-y-2 pb-2">
                        <Input
                          id="dev-fee"
                          type="text"
                          value={payWallet}
                          onChange={(e:any) => setPaywallet(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleUpdatePayWallet} className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Update Pay Wallet
                      </Button>
                    </div>

                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-900/30 to-teal-900/30 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-6 w-6 text-primary" />
                    Platform Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dev-fee">Developer Fee Percentage</Label>
                    <Input
                      id="dev-fee"
                      type="number"
                      value={devFeePercentage}
                      onChange={(e) => setDevFeePercentage(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-fee">Platform Fee Percentage</Label>
                    <Input
                      id="platform-fee"
                      type="number"
                      value={platformFeePercentage}
                      onChange={(e) => setPlatformFeePercentage(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="top-player-fee">Top Player Percentage</Label>
                    <Input
                      id="top-player-fee"
                      type="number"
                      value={topPlayerPercentage}
                      onChange={(e) => setTopPlayerPercentage(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boost-fee">Boost Fee (credits)</Label>
                    <Input
                      id="boost-fee"
                      type="number"
                      value={boostFee}
                      onChange={(e) => setBoostFee(Number(e.target.value))}
                    />
                  </div>
                  <Button onClick={handleUpdatePlatformFees} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update Platform Fees
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 bg-gradient-to-br from-red-900/30 to-orange-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-6 w-6 text-primary" />
                  Platform Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleTogglePlatformPause} className="w-full">
                  {isPlatformPaused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Unpause Platform
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Platform
                    </>
                  )}
                </Button>
                {isSuperAdmin && (
                  <div className="space-y-4">
                    <Label htmlFor="new-admin-address">New Admin Solana Address</Label>
                    <Input
                      id="new-admin-address"
                      value={newAdminAddress}
                      onChange={(e) => setNewAdminAddress(e.target.value)}
                      placeholder="Enter Solana address of new admin"
                    />
                    <Label htmlFor="new-admin-role">New Admin Role</Label>
                    <select
                      id="new-admin-role"
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      className="w-full p-2 rounded-md border border-input bg-background"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <Button onClick={handleAddAdmin} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Admin
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games">
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GamepadIcon className="mr-2 h-6 w-6 text-primary" />
                  Game Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead>Plays</TableHead>
                      <TableHead>Boosts</TableHead>
                      <TableHead>Upvotes</TableHead>
                      <TableHead>Downvotes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameStats.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell>{game.title}</TableCell>
                        <TableCell>{game.play_count}</TableCell>
                        <TableCell>{game.boost_count}</TableCell>
                        <TableCell>{game.upvotes}</TableCell>
                        <TableCell>{game.downvotes}</TableCell>
                        <TableCell>{game.is_paused ? "Paused" : "Active"}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleUpdateGameFees(game.id)}
                            className="mr-2"
                            variant="outline"
                            size="sm"
                          >
                            Update Fees
                          </Button>
                          <Button onClick={() => handleToggleGamePause(game.id)} variant="outline" size="sm">
                            {game.is_paused ? "Unpause" : "Pause"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-gradient-to-br from-indigo-900/30 to-blue-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-6 w-6 text-primary" />
                  User Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-4">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by wallet or username"
                    className="flex-1"
                  />
                  <Button onClick={handleSearch}>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Credits</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((user) => (
                        <TableRow key={user.wallet}>
                          <TableCell>{user.wallet}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.credits}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card className="bg-gradient-to-br from-yellow-900/30 to-red-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-6 w-6 text-primary" />
                  Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ticket List</h3>
                    <div className="h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {supportTickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell>{ticket.id}</TableCell>
                              <TableCell>{ticket.category}</TableCell>
                              <TableCell>{ticket.status}</TableCell>
                              <TableCell>
                                <Button onClick={() => setSelectedTicket(ticket)} variant="outline" size="sm">
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ticket Details</h3>
                    {selectedTicket ? (
                      <div className="space-y-4">
                        <p>
                          <strong>User ID:</strong> {selectedTicket.user_id}
                        </p>
                        <p>
                          <strong>Category:</strong> {selectedTicket.category}
                        </p>
                        {selectedTicket.game_id && (
                          <p>
                            <strong>Game ID:</strong> {selectedTicket.game_id}
                          </p>
                        )}
                        {selectedTicket.transaction_id && (
                          <p>
                            <strong>Transaction ID:</strong> {selectedTicket.transaction_id}
                          </p>
                        )}
                        <p>
                          <strong>Message:</strong> {selectedTicket.message}
                        </p>
                        <p>
                          <strong>Status:</strong> {selectedTicket.status}
                        </p>
                        {selectedTicket.status === "open" && (
                          <div className="space-y-2">
                            <Label htmlFor="response">Response</Label>
                            <Textarea
                              id="response"
                              value={responseMessage}
                              onChange={(e) => setResponseMessage(e.target.value)}
                              placeholder="Enter your response"
                              rows={4}
                            />
                            <Button onClick={() => handleResponseSubmit(selectedTicket.id)} className="w-full">
                              Submit Response & Close Ticket
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p>Select a ticket to view details</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}


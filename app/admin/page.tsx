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
  // updatePayWallet,
  updatePlatformFees,
  searchUsers,
  generatePlatformWallet,
  processPlatformWithdrawal,
  addAdmin,
  updateGameFees,
  getGamerTokenSettings,
  updateGamerTokenSettings,
  getApprovedTokens,
  addApprovedToken,
  updateApprovedToken,
  getWallets,
  refreshWallet,
} from "@/lib/platformWallet"
import { useConnection } from "@solana/wallet-adapter-react"
import { motion } from "framer-motion"
import {
  Wallet,
  Settings,
  Users,
  GamepadIcon,
  RefreshCw,
  Search,
  AlertTriangle,
  Pause,
  Play,
  Trash2,
  Edit,
  Package,
  Plus,
  Link,
  CopyIcon,
  Coins,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { AddProductModal } from "@/components/add-product-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Wallet {
  id: string
  type: "esports" | "tournament" | "arcade" | "grabbit"
  public_key: string
  game_id: string | null
  created_at: string
}

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
  const [newAdminAddress, setNewAdminAddress] = useState("")
  const [newAdminRole, setNewAdminRole] = useState("admin")
  const [payWallet, setPaywallet] = useState("")
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [products, setProducts] = useState([])
  const [editingProduct, setEditingProduct] = useState(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [wallets, setWallets] = useState<Wallet[]>([])

  // New state for GAMEr Tokens Settings
  const [minTokensArcade, setMinTokensArcade] = useState(0)
  const [minTokensEsports, setMinTokensEsports] = useState(0)
  const [minTokensTournaments, setMinTokensTournaments] = useState(0)
  const [minTokensGrabbit, setMinTokensGrabbit] = useState(0)

  // New state for Approved Tokens
  const [approvedTokens, setApprovedTokens] = useState([])
  const [newTokenName, setNewTokenName] = useState("")
  const [newTokenTicker, setNewTokenTicker] = useState("")
  const [newTokenAddress, setNewTokenAddress] = useState("")

  useEffect(() => {
    if (publicKey) {
      fetchData()
      fetchSupportTickets()
      checkSuperAdminStatus()
      fetchProducts()
      fetchGamerTokenSettings()
      fetchApprovedTokens()
      fetchWallets()
    }
  }, [publicKey])
  
  const fetchData = async () => {
    try {
      const data: any = await getPlatformWallet()
      setNewPlatformWallet(data.wallet_platform)
      setPaywallet(data.wallet_payment)
      let balance: any
      if (data.success) {
        balance = await getPlatformWalletBalance(data.wallet_platform)
        setPlatformBalance(balance || 0)
      }

      const credits = await getTotalUserCredits()
      setTotalUserCredits(credits)

      const stats: any = await getGameStatistics()
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
      const data: any = await generatePlatformWallet()
      if (data.success) {
        setNewPlatformWallet(data.message)
        toast({
          title: "Success",
          description: `New platform wallet generated. Public Key: ${data.message}`,
        })
      } else {
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
      // await updatePayWallet(payWallet)
      // toast({
      //   title: "Success",
      //   description: "Platform wallet updated successfully",
      // })
      // fetchData()
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
      const results:any = await searchUsers(searchTerm)
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

  const fetchProducts = async () => {
    try {
      const { data, error }:any = await supabase.from("shop_items").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddProduct = async (formData: FormData) => {
    try {
      // Convert FormData to a plain object
      const productData:any = Object.fromEntries(formData.entries())

      // Parse JSON strings back to arrays
      if (typeof productData.sizes === "string") {
        productData.sizes = JSON.parse(productData.sizes)
      }
      if (typeof productData.colors === "string") {
        productData.colors = JSON.parse(productData.colors)
      }

      // Handle file uploads
      const imageFiles = formData.getAll("images") as File[]
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const { data, error } = await supabase.storage
            .from("product-images")
            .upload(`${Date.now()}-${file.name}`, file)

          if (error) throw error

          const {
            data: { publicUrl },
          } = supabase.storage.from("product-images").getPublicUrl(data.path)

          return publicUrl
        }),
      )

      productData.images = imageUrls

      let result
      if (editingProduct) {
        result = await supabase.from("shop_items").update(productData).eq("id", editingProduct.id)
      } else {
        result = await supabase.from("shop_items").insert(productData)
      }

      if (result.error) throw result.error

      toast({
        title: "Success",
        description: editingProduct ? "Product updated successfully" : "Product added successfully",
      })
      fetchProducts()
      setShowAddProductModal(false)
      setEditingProduct(null)
    } catch (error) {
      console.error("Error adding/updating product:", error)
      toast({
        title: "Error",
        description: "Failed to add/update product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = (product:any) => {
    setEditingProduct(product)
    setShowAddProductModal(true)
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      const { error } = await supabase.from("shop_items").delete().eq("id", productToDelete.id)
      if (error) throw error

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteConfirmation(false)
      setProductToDelete(null)
    }
  }

  const handleToggleGamePause = async (gameId:any) => {
    try {
      const { data, error } = await supabase
        .from("games")
        .update({ is_paused: !gameStats.find((game) => game.id === gameId).is_paused })
        .eq("id", gameId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Game status updated successfully",
      })
      fetchData()
    } catch (error) {
      console.error("Error updating game status:", error)
      toast({
        title: "Error",
        description: "Failed to update game status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateGameFees = async (gameId:any) => {
    try {
      // await updateGameFees(gameId)
      // toast({
      //   title: "Success",
      //   description: "Game fees updated successfully",
      // })
      fetchData()
    } catch (error) {
      console.error("Error updating game fees:", error)
      toast({
        title: "Error",
        description: "Failed to update game fees. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleResponseSubmit = async (ticketId:any) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: "closed", admin_response: responseMessage })
        .eq("id", ticketId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Ticket response submitted and closed successfully",
      })
      setResponseMessage("")
      fetchSupportTickets()
      setSelectedTicket(null)
    } catch (error) {
      console.error("Error submitting ticket response:", error)
      toast({
        title: "Error",
        description: "Failed to submit ticket response. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchGamerTokenSettings = async () => {
    try {
      const settings = await getGamerTokenSettings()
      setMinTokensArcade(settings.min_tokens_arcade)
      setMinTokensEsports(settings.min_tokens_esports)
      setMinTokensTournaments(settings.min_tokens_tournaments)
      setMinTokensGrabbit(settings.min_tokens_grabbit)
    } catch (error) {
      console.error("Error fetching GAMEr token settings:", error)
      toast({
        title: "Error",
        description: "Failed to fetch GAMEr token settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchApprovedTokens = async () => {
    try {
      const tokens:any = await getApprovedTokens()
      setApprovedTokens(tokens)
    } catch (error) {
      console.error("Error fetching approved tokens:", error)
      toast({
        title: "Error",
        description: "Failed to fetch approved tokens. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateGamerTokenSettings = async () => {
    try {
      await updateGamerTokenSettings({
        min_tokens_arcade: minTokensArcade,
        min_tokens_esports: minTokensEsports,
        min_tokens_tournament: minTokensTournaments,
        min_tokens_grabbit: minTokensGrabbit,
      })
      toast({
        title: "Success",
        description: "GAMEr token settings updated successfully",
      })
    } catch (error) {
      console.error("Error updating GAMEr token settings:", error)
      toast({
        title: "Error",
        description: "Failed to update GAMEr token settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddApprovedToken = async () => {
    try {
      await addApprovedToken({
        name: newTokenName,
        ticker: newTokenTicker,
        address: newTokenAddress,
        status: "active",
      })
      toast({
        title: "Success",
        description: "New token added successfully",
      })
      setNewTokenName("")
      setNewTokenTicker("")
      setNewTokenAddress("")
      fetchApprovedTokens()
    } catch (error) {
      console.error("Error adding new approved token:", error)
      toast({
        title: "Error",
        description: "Failed to add new approved token. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const handleToggleTokenStatus = async (tokenId:any, currentStatus:any) => {
    try {
      await updateApprovedToken(tokenId, { status: currentStatus === 1 ? 0 : 1 })
      toast({
        title: "Success",
        description: "Token status updated successfully",
      })
      fetchApprovedTokens()
    } catch (error) {
      console.error("Error updating token status:", error)
      toast({
        title: "Error",
        description: "Failed to update token status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchWallets = async () => {
    try {
      const fetchedWallets = await getWallets()
      setWallets(fetchedWallets)
    } catch (error) {
      console.error("Error fetching wallets:", error)
      toast({
        title: "Error",
        description: "Failed to fetch wallets. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRefreshWallet = async (walletId: string) => {
    try {
      await refreshWallet(walletId)
      toast({
        title: "Success",
        description: "Wallet refreshed successfully",
      })
      fetchWallets()
    } catch (error) {
      console.error("Error refreshing wallet:", error)
      toast({
        title: "Error",
        description: "Failed to refresh wallet. Please try again.",
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
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-6 gap-4">
            <TabsTrigger value="platform" className="text-lg">
              <Wallet className="mr-2 h-5 w-5" />
              Platform
            </TabsTrigger>
            <TabsTrigger value="games" className="text-lg">
              <GamepadIcon className="mr-2 h-5 w-5" />
              Arcade
            </TabsTrigger>
            <TabsTrigger value="users" className="text-lg">
              <Users className="mr-2 h-5 w-5" />
              User
            </TabsTrigger>
            <TabsTrigger value="support" className="text-lg">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Support
            </TabsTrigger>
            <TabsTrigger value="shop" className="text-lg">
              <Package className="mr-2 h-5 w-5" />
              Shop
            </TabsTrigger>
            <TabsTrigger value="wallets" className="text-lg">
              <Wallet className="mr-2 h-5 w-5" />
              Wallet
            </TabsTrigger>
          </TabsList>

          {/* Platform Management Tab Content */}
          <TabsContent value="platform">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                      Wallet:{" "}
                      <span className="font-bold text-primary">
                        <small>{newPlatformWallet}</small>
                      </span>
                    </p>
                  )}
                  <Button onClick={handleGeneratePlatformWallet} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Generate New Platform Wallet
                  </Button>
                  <div className="space-y-2">
                    <p className="text-lg">
                      Pay wallet:{" "}
                      <span className="font-bold text-primary">
                        <small>{payWallet}</small>
                      </span>
                    </p>
                    <div className="space-y-2 pb-2">
                      <Input
                        id="dev-fee"
                        type="text"
                        value={payWallet}
                        onChange={(e: any) => setPaywallet(e.target.value)}
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

              {/* New GAMEr Tokens Settings card */}
              <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Coins className="mr-2 h-6 w-6 text-primary" />
                    GAMEr Tokens Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-tokens-arcade">Min Tokens for Arcade</Label>
                    <Input
                      id="min-tokens-arcade"
                      type="number"
                      value={minTokensArcade}
                      onChange={(e) => setMinTokensArcade(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-tokens-esports">Min Tokens for Esports</Label>
                    <Input
                      id="min-tokens-esports"
                      type="number"
                      value={minTokensEsports}
                      onChange={(e) => setMinTokensEsports(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-tokens-tournaments">Min Tokens for Tournaments</Label>
                    <Input
                      id="min-tokens-tournaments"
                      type="number"
                      value={minTokensTournaments}
                      onChange={(e) => setMinTokensTournaments(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-tokens-grabbit">Min Tokens for Grabbit</Label>
                    <Input
                      id="min-tokens-grabbit"
                      type="number"
                      value={minTokensGrabbit}
                      onChange={(e) => setMinTokensGrabbit(Number(e.target.value))}
                    />
                  </div>
                  <Button onClick={handleUpdateGamerTokenSettings} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update GAMEr Token Settings
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

            {/* Approved Tokens card */}
            <Card className="mt-8 bg-gradient-to-br from-pink-900/30 to-red-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coins className="mr-2 h-6 w-6 text-primary" />
                  Approved Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedTokens.map((token:any) => (
                      <TableRow key={token.id}>
                        <TableCell>{token.name}</TableCell>
                        <TableCell>{token.ticker}</TableCell>
                        <TableCell>{token.address}</TableCell>
                        <TableCell>{token.status}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleToggleTokenStatus(token.id, token.status)}
                            variant="outline"
                            size="sm"
                          >
                            {token.status === 1 ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="space-y-2">
                  <Label htmlFor="new-token-name">New Token Name</Label>
                  <Input
                    id="new-token-name"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="Enter token name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-token-ticker">New Token Ticker</Label>
                  <Input
                    id="new-token-ticker"
                    value={newTokenTicker}
                    onChange={(e) => setNewTokenTicker(e.target.value)}
                    placeholder="Enter token ticker"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-token-address">New Token Address</Label>
                  <Input
                    id="new-token-address"
                    value={newTokenAddress}
                    onChange={(e) => setNewTokenAddress(e.target.value)}
                    placeholder="Enter token address"
                  />
                </div>
                <Button onClick={handleAddApprovedToken} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Approved Token
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Game Management Tab Content */}
          <TabsContent value="games">
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GamepadIcon className="mr-2 h-6 w-6 text-primary" />
                  Arcade Statistics
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
                    {gameStats.map((game:any) => (
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

          {/* User Management Tab Content */}
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
                      {searchResults.map((user:any) => (
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

          {/* Support Tickets Tab Content */}
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
                          {supportTickets.map((ticket:any) => (
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

          {/* Shop Management Tab Content */}
          <TabsContent value="shop">
            <Card className="bg-gradient-to-br from-teal-900/30 to-emerald-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="mr-2 h-6 w-6 text-primary" />
                    Shop Management
                  </div>
                  <Button onClick={() => setShowAddProductModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>URL ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product:any) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <img
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{product.url_friendly_id}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(`/shop/${product.url_friendly_id}`)
                                toast({
                                  title: "Copied",
                                  description: "URL ID copied to clipboard",
                                })
                              }}
                            >
                              <Link className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit{" "}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProductToDelete(product)
                              setShowDeleteConfirmation(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Management Tab Content */}
          <TabsContent value="wallets">
            <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="mr-2 h-6 w-6 text-primary" />
                  Wallet Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Public Key</TableHead>
                      <TableHead>Game ID</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.map((wallet) => (
                      <TableRow key={wallet.id}>
                        <TableCell>{wallet.type}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>
                              {wallet.public_key.slice(0, 8)}...{wallet.public_key.slice(-8)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(wallet.public_key)
                                toast({
                                  title: "Copied",
                                  description: "Public key copied to clipboard",
                                })
                              }}
                            >
                              <CopyIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{wallet.game_id || "N/A"}</TableCell>
                        <TableCell>{new Date(wallet.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleRefreshWallet(wallet.id)}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => {
          setShowAddProductModal(false)
          setEditingProduct(null)
        }}
        onSubmit={handleAddProduct}
        editingProduct={editingProduct}
      />
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product from the shop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


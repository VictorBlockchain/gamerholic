"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
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
  CopyIcon,
  Coins,
  ExternalLink,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { supabase } from "@/lib/supabase"
import {
  getPlatformWalletBalance,
  getPlatformWallet,
  getTotalUserCredits,
  getGameStatistics,
  getFinancialStatistics,
  updatePlatformFees,
  searchUsers,
  generatePlatformWallet,
  processPlatformWithdrawal,
  addAdmin,
  getGamerTokenSettings,
  updateGamerTokenSettings,
  getApprovedTokens,
  addApprovedToken,
  updateApprovedToken,
  getWallets,
  refreshWallet,
} from "@/lib/service-admin"
import { AddProductModal } from "@/components/modals/add-product-modal"


interface IWallet {
  id: string
  type: "esports" | "tournament" | "arcade" | "grabbit"
  public_key: string
  game_id: string | null
  created_at: string
}

export function AdminDesktop() {
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
  const [wallets, setWallets] = useState<IWallet[]>([])
  const [showTicketDialog, setShowTicketDialog] = useState(false)

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
          title: "Error",
          description: `Error: ${data.message}`,
        })
      }
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
      // Implement updatePayWallet functionality
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
      const results: any = await searchUsers(searchTerm)
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
      const { data, error }: any = await supabase
        .from("shop_items")
        .select("*")
        .order("created_at", { ascending: false })
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
      const productData: any = Object.fromEntries(formData.entries())

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

  const handleEditProduct = (product: any) => {
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

  const handleToggleGamePause = async (gameId: any) => {
    try {
      const { data, error } = await supabase
        .from("games")
        .update({ is_paused: !gameStats.find((game: any) => game.id === gameId).is_paused })
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

  const handleUpdateGameFees = async (gameId: any) => {
    try {
      // Implement updateGameFees functionality
      toast({
        title: "Success",
        description: "Game fees updated successfully",
      })
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

  const handleResponseSubmit = async (ticketId: any) => {
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
      setShowTicketDialog(false)
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
      const tokens: any = await getApprovedTokens()
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

  const handleToggleTokenStatus = async (tokenId: any, currentStatus: any) => {
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Admin Access Required</CardTitle>
              <CardDescription className="text-gray-400">
                Please connect your wallet to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Admin Dashboard
          </h1>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-black/40 border-purple-500/50 text-purple-400 px-3 py-1">
              {isPlatformPaused ? "Platform Paused" : "Platform Active"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePlatformPause}
              className={`${
                isPlatformPaused
                  ? "border-green-500/50 text-green-400 hover:bg-green-500/20"
                  : "border-red-500/50 text-red-400 hover:bg-red-500/20"
              }`}
            >
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
          </div>
        </div>

        <Tabs defaultValue="platform" className="space-y-8">
          <TabsList className="grid grid-cols-6 gap-2 bg-black/40 p-1 rounded-lg border border-purple-500/20">
            <TabsTrigger
              value="platform"
              className="data-[state=active]:bg-purple-900/40 data-[state=active]:text-white"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Platform
            </TabsTrigger>
            <TabsTrigger value="games" className="data-[state=active]:bg-purple-900/40 data-[state=active]:text-white">
              <GamepadIcon className="mr-2 h-4 w-4" />
              Arcade
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-900/40 data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="data-[state=active]:bg-purple-900/40 data-[state=active]:text-white"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Support
            </TabsTrigger>
            <TabsTrigger value="shop" className="data-[state=active]:bg-purple-900/40 data-[state=active]:text-white">
              <Package className="mr-2 h-4 w-4" />
              Shop
            </TabsTrigger>
            <TabsTrigger
              value="wallets"
              className="data-[state=active]:bg-purple-900/40 data-[state=active]:text-white"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Wallets
            </TabsTrigger>
          </TabsList>

          {/* Platform Management Tab Content */}
          <TabsContent value="platform">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Wallet className="mr-2 h-5 w-5 text-purple-400" />
                    Platform Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-purple-900/20 rounded-md">
                    <span className="text-gray-300">Balance:</span>
                    <span className="font-bold text-white">{platformBalance} SOL</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-900/20 rounded-md">
                    <span className="text-gray-300">Total User Credits:</span>
                    <span className="font-bold text-white">{totalUserCredits}</span>
                  </div>

                  {newPlatformWallet && (
                    <div className="p-3 bg-purple-900/20 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Wallet:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-purple-400 hover:text-purple-300"
                          onClick={() => {
                            navigator.clipboard.writeText(newPlatformWallet)
                            toast({
                              title: "Copied",
                              description: "Wallet address copied to clipboard",
                            })
                          }}
                        >
                          <CopyIcon className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 break-all">{newPlatformWallet}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleGeneratePlatformWallet}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate New Platform Wallet
                  </Button>

                  <div className="space-y-3 mt-4">
                    <Label htmlFor="pay-wallet" className="text-gray-300">
                      Pay Wallet
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="pay-wallet"
                        type="text"
                        value={payWallet}
                        onChange={(e: any) => setPaywallet(e.target.value)}
                        className="bg-black/40 border-purple-500/30 text-white"
                      />
                      <Button
                        onClick={handleUpdatePayWallet}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <Label htmlFor="withdraw-amount" className="text-gray-300">
                      Withdraw SOL
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="withdraw-amount"
                        type="text"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Amount in SOL"
                        className="bg-black/40 border-purple-500/30 text-white"
                      />
                      <Button
                        onClick={handleWithdraw}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Settings className="mr-2 h-5 w-5 text-purple-400" />
                    Platform Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dev-fee" className="text-gray-300">
                      Developer Fee Percentage
                    </Label>
                    <Input
                      id="dev-fee"
                      type="number"
                      value={devFeePercentage}
                      onChange={(e) => setDevFeePercentage(Number(e.target.value))}
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-fee" className="text-gray-300">
                      Platform Fee Percentage
                    </Label>
                    <Input
                      id="platform-fee"
                      type="number"
                      value={platformFeePercentage}
                      onChange={(e) => setPlatformFeePercentage(Number(e.target.value))}
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="top-player-fee" className="text-gray-300">
                      Top Player Percentage
                    </Label>
                    <Input
                      id="top-player-fee"
                      type="number"
                      value={topPlayerPercentage}
                      onChange={(e) => setTopPlayerPercentage(Number(e.target.value))}
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boost-fee" className="text-gray-300">
                      Boost Fee (credits)
                    </Label>
                    <Input
                      id="boost-fee"
                      type="number"
                      value={boostFee}
                      onChange={(e) => setBoostFee(Number(e.target.value))}
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <Button
                    onClick={handleUpdatePlatformFees}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update Platform Fees
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Coins className="mr-2 h-5 w-5 text-purple-400" />
                    GAMEr Tokens Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-tokens-arcade" className="text-gray-300">
                      Min Tokens for Arcade
                    </Label>
                    <Input
                      id="min-tokens-arcade"
                      type="number"
                      value={minTokensArcade}
                      onChange={(e) => setMinTokensArcade(Number(e.target.value))}
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-tokens-esports" className="text-gray-300">
                      Min Tokens for Esports
                    </Label>
                    <Input
                      id="min-tokens-esports"
                      type="number"
                      value={minTokensEsports}
                      onChange={(e) => setMinTokensEsports(Number(e.target.value))}
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-tokens-tournaments" className="text-gray-300">
                      Min Tokens for Tournaments
                    </Label>
                    <Input
                      id="min-tokens-tournaments"
                      type="number"
                      value={minTokensTournaments}
                      onChange={(e) => setMinTokensTournaments(Number(e.target.value))}
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-tokens-grabbit" className="text-gray-300">
                      Min Tokens for Grabbit
                    </Label>
                    <Input
                      id="min-tokens-grabbit"
                      type="number"
                      value={minTokensGrabbit}
                      onChange={(e) => setMinTokensGrabbit(Number(e.target.value))}
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateGamerTokenSettings}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update GAMEr Token Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            {isSuperAdmin && (
              <Card className="mt-6 bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Users className="mr-2 h-5 w-5 text-purple-400" />
                    Admin Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-admin-address" className="text-gray-300">
                      New Admin Solana Address
                    </Label>
                    <Input
                      id="new-admin-address"
                      value={newAdminAddress}
                      onChange={(e) => setNewAdminAddress(e.target.value)}
                      placeholder="Enter Solana address of new admin"
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-admin-role" className="text-gray-300">
                      New Admin Role
                    </Label>
                    <select
                      id="new-admin-role"
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      className="w-full p-2 rounded-md border border-purple-500/30 bg-black/40 text-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <Button
                    onClick={handleAddAdmin}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Admin
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="mt-6 bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Coins className="mr-2 h-5 w-5 text-purple-400" />
                  Approved Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-purple-500/30 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-purple-900/30">
                      <TableRow>
                        <TableHead className="text-gray-300">Name</TableHead>
                        <TableHead className="text-gray-300">Ticker</TableHead>
                        <TableHead className="text-gray-300">Address</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedTokens.map((token: any) => (
                        <TableRow key={token.id} className="border-t border-purple-500/20 hover:bg-purple-900/10">
                          <TableCell className="text-white">{token.name}</TableCell>
                          <TableCell className="text-white">{token.ticker}</TableCell>
                          <TableCell className="text-gray-300">
                            <div className="flex items-center">
                              <span className="truncate max-w-[120px]">{token.address}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-6 w-6 p-0 text-purple-400 hover:text-purple-300"
                                onClick={() => {
                                  navigator.clipboard.writeText(token.address)
                                  toast({
                                    title: "Copied",
                                    description: "Token address copied to clipboard",
                                  })
                                }}
                              >
                                <CopyIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                token.status === 1
                                  ? "bg-green-900/20 text-green-400 border-green-500/30"
                                  : "bg-red-900/20 text-red-400 border-red-500/30"
                              }
                            >
                              {token.status === 1 ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleToggleTokenStatus(token.id, token.status)}
                              variant="outline"
                              size="sm"
                              className={
                                token.status === 1
                                  ? "border-red-500/30 text-red-400 hover:bg-red-900/20"
                                  : "border-green-500/30 text-green-400 hover:bg-green-900/20"
                              }
                            >
                              {token.status === 1 ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-token-name" className="text-gray-300">
                      New Token Name
                    </Label>
                    <Input
                      id="new-token-name"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                      placeholder="Enter token name"
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-token-ticker" className="text-gray-300">
                      New Token Ticker
                    </Label>
                    <Input
                      id="new-token-ticker"
                      value={newTokenTicker}
                      onChange={(e) => setNewTokenTicker(e.target.value)}
                      placeholder="Enter token ticker"
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-token-address" className="text-gray-300">
                      New Token Address
                    </Label>
                    <Input
                      id="new-token-address"
                      value={newTokenAddress}
                      onChange={(e) => setNewTokenAddress(e.target.value)}
                      placeholder="Enter token address"
                      className="bg-black/40 border-purple-500/30 text-white"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddApprovedToken}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Approved Token
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Game Management Tab Content */}
          <TabsContent value="games">
            <Card className="bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <GamepadIcon className="mr-2 h-5 w-5 text-purple-400" />
                  Arcade Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-purple-500/30 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-purple-900/30">
                      <TableRow>
                        <TableHead className="text-gray-300">Game</TableHead>
                        <TableHead className="text-gray-300">Plays</TableHead>
                        <TableHead className="text-gray-300">Boosts</TableHead>
                        <TableHead className="text-gray-300">Upvotes</TableHead>
                        <TableHead className="text-gray-300">Downvotes</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameStats.map((game: any) => (
                        <TableRow key={game.id} className="border-t border-purple-500/20 hover:bg-purple-900/10">
                          <TableCell className="text-white font-medium">{game.title}</TableCell>
                          <TableCell className="text-white">{game.play_count}</TableCell>
                          <TableCell className="text-white">{game.boost_count}</TableCell>
                          <TableCell className="text-white">{game.upvotes}</TableCell>
                          <TableCell className="text-white">{game.downvotes}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                game.is_paused
                                  ? "bg-red-900/20 text-red-400 border-red-500/30"
                                  : "bg-green-900/20 text-green-400 border-green-500/30"
                              }
                            >
                              {game.is_paused ? "Paused" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleUpdateGameFees(game.id)}
                                variant="outline"
                                size="sm"
                                className="border-purple-500/30 text-purple-400 hover:bg-purple-900/20"
                              >
                                <Settings className="h-3 w-3 mr-1" />
                                Fees
                              </Button>
                              <Button
                                onClick={() => handleToggleGamePause(game.id)}
                                variant="outline"
                                size="sm"
                                className={
                                  game.is_paused
                                    ? "border-green-500/30 text-green-400 hover:bg-green-900/20"
                                    : "border-red-500/30 text-red-400 hover:bg-red-900/20"
                                }
                              >
                                {game.is_paused ? (
                                  <>
                                    <Play className="h-3 w-3 mr-1" />
                                    Unpause
                                  </>
                                ) : (
                                  <>
                                    <Pause className="h-3 w-3 mr-1" />
                                    Pause
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab Content */}
          <TabsContent value="users">
            <Card className="bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Users className="mr-2 h-5 w-5 text-purple-400" />
                  User Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-6">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by wallet or username"
                    className="bg-black/40 border-purple-500/30 text-white"
                  />
                  <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="rounded-md border border-purple-500/30 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-purple-900/30">
                        <TableRow>
                          <TableHead className="text-gray-300">Wallet</TableHead>
                          <TableHead className="text-gray-300">Username</TableHead>
                          <TableHead className="text-gray-300">Credits</TableHead>
                          <TableHead className="text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((user: any) => (
                          <TableRow key={user.wallet} className="border-t border-purple-500/20 hover:bg-purple-900/10">
                            <TableCell className="text-gray-300">
                              <div className="flex items-center">
                                <span className="truncate max-w-[120px]">{user.wallet}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 h-6 w-6 p-0 text-purple-400 hover:text-purple-300"
                                  onClick={() => {
                                    navigator.clipboard.writeText(user.wallet)
                                    toast({
                                      title: "Copied",
                                      description: "Wallet address copied to clipboard",
                                    })
                                  }}
                                >
                                  <CopyIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-white font-medium">{user.username || "N/A"}</TableCell>
                            <TableCell className="text-white">{user.credits}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-purple-500/30 text-purple-400 hover:bg-purple-900/20"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  searchTerm && (
                    <div className="text-center py-8 text-gray-400">No users found matching "{searchTerm}"</div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tickets Tab Content */}
          <TabsContent value="support">
            <Card className="bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <AlertTriangle className="mr-2 h-5 w-5 text-purple-400" />
                  Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-purple-500/30 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-purple-900/30">
                      <TableRow>
                        <TableHead className="text-gray-300">ID</TableHead>
                        <TableHead className="text-gray-300">User</TableHead>
                        <TableHead className="text-gray-300">Category</TableHead>
                        <TableHead className="text-gray-300">Created</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supportTickets.map((ticket: any) => (
                        <TableRow key={ticket.id} className="border-t border-purple-500/20 hover:bg-purple-900/10">
                          <TableCell className="text-white font-medium">#{ticket.id}</TableCell>
                          <TableCell className="text-gray-300">
                            <div className="flex items-center">
                              <span className="truncate max-w-[120px]">{ticket.user_id}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">{ticket.category}</TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                ticket.status === "open"
                                  ? "bg-green-900/20 text-green-400 border-green-500/30"
                                  : "bg-gray-900/20 text-gray-400 border-gray-500/30"
                              }
                            >
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => {
                                setSelectedTicket(ticket)
                                setShowTicketDialog(true)
                              }}
                              variant="outline"
                              size="sm"
                              className="border-purple-500/30 text-purple-400 hover:bg-purple-900/20"
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {supportTickets.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No support tickets found</div>
                )}
              </CardContent>
            </Card>

            <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
              <DialogContent className="bg-black/90 border border-purple-500/30 text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl text-white">Ticket #{selectedTicket?.id}</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Created on {selectedTicket && new Date(selectedTicket.created_at).toLocaleString()}
                  </DialogDescription>
                </DialogHeader>

                {selectedTicket && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">User ID</p>
                        <p className="text-white break-all">{selectedTicket.user_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Category</p>
                        <p className="text-white">{selectedTicket.category}</p>
                      </div>
                    </div>

                    {selectedTicket.game_id && (
                      <div>
                        <p className="text-gray-400 text-sm">Game ID</p>
                        <p className="text-white">{selectedTicket.game_id}</p>
                      </div>
                    )}

                    {selectedTicket.transaction_id && (
                      <div>
                        <p className="text-gray-400 text-sm">Transaction ID</p>
                        <p className="text-white break-all">{selectedTicket.transaction_id}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-gray-400 text-sm">Message</p>
                      <div className="mt-1 p-3 bg-purple-900/10 rounded-md text-white">{selectedTicket.message}</div>
                    </div>

                    {selectedTicket.status === "open" ? (
                      <div className="space-y-2">
                        <Label htmlFor="response" className="text-gray-300">
                          Response
                        </Label>
                        <Textarea
                          id="response"
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder="Enter your response"
                          rows={4}
                          className="bg-black/40 border-purple-500/30 text-white"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-400 text-sm">Admin Response</p>
                        <div className="mt-1 p-3 bg-purple-900/10 rounded-md text-white">
                          {selectedTicket.admin_response || "No response provided"}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter>
                  {selectedTicket?.status === "open" ? (
                    <Button
                      onClick={() => handleResponseSubmit(selectedTicket.id)}
                      disabled={!responseMessage.trim()}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      Submit Response & Close Ticket
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowTicketDialog(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      Close
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Shop Management Tab Content */}
          <TabsContent value="shop">
            <Card className="bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center">
                    <Package className="mr-2 h-5 w-5 text-purple-400" />
                    Shop Management
                  </div>
                  <Button
                    onClick={() => setShowAddProductModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-purple-500/30 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-purple-900/30">
                      <TableRow>
                        <TableHead className="text-gray-300">Image</TableHead>
                        <TableHead className="text-gray-300">Name</TableHead>
                        <TableHead className="text-gray-300">Price</TableHead>
                        <TableHead className="text-gray-300">Category</TableHead>
                        <TableHead className="text-gray-300">Stock</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product: any) => (
                        <TableRow key={product.id} className="border-t border-purple-500/20 hover:bg-purple-900/10">
                          <TableCell>
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-purple-900/20">
                              <img
                                src={product.images?.[0] || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-white font-medium">{product.name}</TableCell>
                          <TableCell className="text-white">${product.price?.toFixed(2)}</TableCell>
                          <TableCell className="text-white">{product.category}</TableCell>
                          <TableCell className="text-white">{product.stock_quantity}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-purple-500/30 text-purple-400 hover:bg-purple-900/20"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/30 text-red-400 hover:bg-red-900/20"
                                onClick={() => {
                                  setProductToDelete(product)
                                  setShowDeleteConfirmation(true)
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {products.length === 0 && <div className="text-center py-8 text-gray-400">No products found</div>}
              </CardContent>
            </Card>

            <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
              <AlertDialogContent className="bg-black/90 border border-red-500/30 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete Product</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Are you sure you want to delete this product? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border border-gray-500/30 text-gray-300 hover:bg-gray-900/30">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-600 hover:bg-red-700 text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Wallet Management Tab Content */}
          <TabsContent value="wallets">
            <Card className="bg-black/60 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Wallet className="mr-2 h-5 w-5 text-purple-400" />
                  Wallet Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-purple-500/30 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-purple-900/30">
                      <TableRow>
                        <TableHead className="text-gray-300">Type</TableHead>
                        <TableHead className="text-gray-300">Public Key</TableHead>
                        <TableHead className="text-gray-300">Game ID</TableHead>
                        <TableHead className="text-gray-300">Created At</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wallets.map((wallet) => (
                        <TableRow key={wallet.id} className="border-t border-purple-500/20 hover:bg-purple-900/10">
                          <TableCell className="text-white font-medium capitalize">{wallet.type}</TableCell>
                          <TableCell className="text-gray-300">
                            <div className="flex items-center">
                              <span className="truncate max-w-[120px]">
                                {wallet.public_key.slice(0, 8)}...{wallet.public_key.slice(-8)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-6 w-6 p-0 text-purple-400 hover:text-purple-300"
                                onClick={() => {
                                  navigator.clipboard.writeText(wallet.public_key)
                                  toast({
                                    title: "Copied",
                                    description: "Public key copied to clipboard",
                                  })
                                }}
                              >
                                <CopyIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">{wallet.game_id || "N/A"}</TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(wallet.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-purple-500/30 text-purple-400 hover:bg-purple-900/20"
                              onClick={() => handleRefreshWallet(wallet.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Refresh
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {wallets.length === 0 && <div className="text-center py-8 text-gray-400">No wallets found</div>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
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


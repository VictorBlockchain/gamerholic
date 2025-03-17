"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletStatus } from "@/components/ui/wallet-status"
import { ArrowDownToLine, ArrowUpToLine, Copy, ExternalLink, RefreshCcw } from "lucide-react"
import { updateWalletBalance } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import { MobileNavigation } from "@/components/mobile/mobile-navigation"
import { useUser } from "@/contexts/user-context"
import { WithdrawModal } from "@/components/modals/withdraw-modal"

export function WalletMobile() {
  const { isAuthenticated, player, profile, balance } = useUser()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawToken, setWithdrawToken] = useState<"SOL" | "GAMER">("SOL")

  useEffect(() => {
    if (isAuthenticated && player) {
      fetchBalance()
    }
  }, [isAuthenticated, player])

  const fetchBalance = async () => {
    if (!player) return

    setLoading(true)
    try {
      const response: any = await updateWalletBalance(profile.wallet_players[0].wallet, 1)
    } catch (error) {
      console.error("Error fetching balance:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = () => {
    if (player) {
      navigator.clipboard.writeText(player.toString())
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const handleWithdraw = (currency: "SOL" | "GAMER") => {
    setWithdrawToken(currency)
    setIsWithdrawModalOpen(true)
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  return (
    <div className="pb-20">
      <div className="container px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Wallet</h1>

        <WalletStatus />

        {isAuthenticated && player && profile && (
          <div className="mt-4 space-y-4">
            <Card className="bg-black/30 border border-[#333]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Wallet Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between bg-[#111] rounded-lg p-3">
                  <code className="text-sm font-mono text-gray-300">
                    {truncateAddress(profile.wallet_players[0].wallet.toString())}
                  </code>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyAddress}
                      className="h-8 w-8 text-gray-400 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={() =>
                        window.open(
                          `https://solscan.io/account/${profile.wallet_players[0].wallet.toString()}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full border-[#333] text-white hover:bg-white/5 rounded-full"
              onClick={fetchBalance}
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Balance
            </Button>

            <Tabs defaultValue="balance" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#111]">
                <TabsTrigger value="balance">Balance</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="balance" className="pt-4">
                <div className="space-y-4">
                  {/* SOL Balance */}
                  <Card className="bg-black/30 border border-[#333]">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#9945FF]/20 flex items-center justify-center">
                            <img src="/solana-logo.svg" alt="Solana" className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-medium">Solana</h3>
                            <p className="text-sm text-gray-400">SOL</p>
                          </div>
                        </div>
                        {balance && <span className="text-2xl font-bold">{balance.solana.toFixed(4)}</span>}{" "}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="bg-[#9945FF] hover:bg-[#9945FF]/80 text-white rounded-full"
                          onClick={() => handleWithdraw("SOL")}
                        >
                          <ArrowUpToLine className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                        <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                          <ArrowDownToLine className="h-4 w-4 mr-2" />
                          Deposit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* GAMER Balance */}
                  <Card className="bg-black/30 border border-[#333]">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#00FFA9]/20 flex items-center justify-center">
                            <img src="/placeholder.svg?height=24&width=24" alt="Gamer" className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-medium">Gamer Token</h3>
                            <p className="text-sm text-gray-400">GAMER</p>
                          </div>
                        </div>
                        {balance && <span className="text-2xl font-bold">{balance.gamer.toFixed(2)}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="bg-[#00FFA9] hover:bg-[#00FFA9]/80 text-black rounded-full"
                          onClick={() => handleWithdraw("GAMER")}
                        >
                          <ArrowUpToLine className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                        <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                          <ArrowDownToLine className="h-4 w-4 mr-2" />
                          Deposit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="pt-4">
                <Card className="bg-black/30 border border-[#333]">
                  <CardContent className="p-6 min-h-[200px] flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-400 mb-2">No transactions found</p>
                      <p className="text-sm text-gray-500">Your transaction history will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
        {isWithdrawModalOpen && (
          <WithdrawModal
            isOpen={isWithdrawModalOpen}
            onClose={() => setIsWithdrawModalOpen(false)}
            tokenType={withdrawToken}
            balance={withdrawToken === "SOL" ? balance?.solana || 0 : balance?.gamer || 0}
          />
        )}
      </div>

      <MobileNavigation />
    </div>
  )
}


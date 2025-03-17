"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletStatus } from "@/components/ui/wallet-status"
import { ArrowDownToLine, ArrowUpToLine, Copy, ExternalLink, RefreshCcw } from "lucide-react"
import { updateWalletBalance } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { WithdrawModal } from "@/components/modals/withdraw-modal"

export function WalletDesktop() {
  const { isAuthenticated, player, profile, balance } = useUser()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawToken, setWithdrawToken] = useState<"SOL" | "GAMER">("SOL")

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Wallet Status */}
        <div className="lg:col-span-1">
          <WalletStatus className="h-full" />

          {isAuthenticated && player && profile && (
            <div className="mt-4 space-y-4">
              <Card className="bg-black/30 border border-[#333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Wallet Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between bg-[#111] rounded-lg p-3">
                    <code className="text-sm font-mono text-gray-300 truncate">
                      {profile.wallet_players[0].wallet.toString()}
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
            </div>
          )}
        </div>

        {/* Right Column - Balance and Actions */}
        <div className="lg:col-span-2">
          <Card className="bg-black/30 border border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl">Your Wallet</CardTitle>
              <CardDescription className="text-gray-400">Manage your crypto assets</CardDescription>
            </CardHeader>
            <CardContent>
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Connect your wallet to view your balance and make transactions</p>
                </div>
              ) : (
                <Tabs defaultValue="balance" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-[#111]">
                    <TabsTrigger value="balance">Balance</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="balance" className="pt-4">
                    <div className="space-y-6">
                      {/* SOL Balance */}
                      <div className="bg-[#111] rounded-lg p-6">
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
                          {balance && <span className="text-2xl font-bold">{balance.solana.toFixed(4)}</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-[#9945FF] hover:bg-[#9945FF]/80 text-white rounded-full"
                            onClick={() => handleWithdraw("SOL")}
                          >
                            <ArrowUpToLine className="h-4 w-4 mr-2" />
                            Withdraw
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-[#333] text-white hover:bg-white/5 rounded-full"
                          >
                            <ArrowDownToLine className="h-4 w-4 mr-2" />
                            Deposit
                          </Button>
                        </div>
                      </div>

                      {/* GAMER Balance */}
                      <div className="bg-[#111] rounded-lg p-6">
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
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-[#00FFA9] hover:bg-[#00FFA9]/80 text-black rounded-full"
                            onClick={() => handleWithdraw("GAMER")}
                          >
                            <ArrowUpToLine className="h-4 w-4 mr-2" />
                            Withdraw
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-[#333] text-white hover:bg-white/5 rounded-full"
                          >
                            <ArrowDownToLine className="h-4 w-4 mr-2" />
                            Deposit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="transactions" className="pt-4">
                    <div className="bg-[#111] rounded-lg p-6 min-h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-gray-400 mb-2">No transactions found</p>
                        <p className="text-sm text-gray-500">Your transaction history will appear here</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {isWithdrawModalOpen && (
        <WithdrawModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          tokenType={withdrawToken}
          balance={withdrawToken === "SOL" ? balance?.solana || 0 : balance?.gamer || 0}
        />
      )}
    </div>
  )
}


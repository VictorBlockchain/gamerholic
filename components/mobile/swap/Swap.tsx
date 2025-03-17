"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownUp, Info, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SwapQRModal } from "@/components/modals/swap-qr-modal"
import { SwapConfirmModal } from "@/components/modals/swap-confirm-modal"
import { SwapHistoryItem } from "@/components/swap/swap-history-item"
import { useWallet } from "@solana/wallet-adapter-react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

// Mock exchange rates - in a real app, these would come from an API
const MOCK_RATES = {
  solToGamer: 100, // 1 SOL = 100 GAMER
  gamerToSol: 0.01, // 1 GAMER = 0.01 SOL
  minSol: 0.05,
  minGamer: 5,
  fee: 0.5, // 0.5%
}

// Mock transaction history
const MOCK_HISTORY = [
  {
    id: "tx1",
    fromCurrency: "SOL",
    toCurrency: "GAMER",
    fromAmount: 1,
    toAmount: 100,
    status: "completed",
    date: new Date(Date.now() - 86400000),
    txHash: "5UygUu8rHFTHrzHS1uJH7LfGqzArhVZwQZYkBuVbNBTk",
  },
  {
    id: "tx2",
    fromCurrency: "GAMER",
    toCurrency: "SOL",
    fromAmount: 50,
    toAmount: 0.5,
    status: "pending",
    date: new Date(),
    txHash: "3xGUygUu8rHFTHrzHS1uJH7LfGqzArhVZwQZYkBuVbNBTk",
  },
]

export function SwapMobile() {
  const { toast } = useToast()
  const { publicKey } = useWallet()
  const [fromCurrency, setFromCurrency] = useState<"SOL" | "GAMER">("SOL")
  const [toCurrency, setToCurrency] = useState<"SOL" | "GAMER">("GAMER")
  const [fromAmount, setFromAmount] = useState<string>("")
  const [toAmount, setToAmount] = useState<string>("")
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [swapExpiry, setSwapExpiry] = useState<Date | null>(null)
  const [history, setHistory] = useState(MOCK_HISTORY)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("swap")

  // Calculate the exchange rate based on the selected currencies
  const getExchangeRate = () => {
    if (fromCurrency === "SOL" && toCurrency === "GAMER") {
      return MOCK_RATES.solToGamer
    } else {
      return MOCK_RATES.gamerToSol
    }
  }

  // Calculate the minimum amount based on the selected from currency
  const getMinAmount = () => {
    if (fromCurrency === "SOL") {
      return MOCK_RATES.minSol
    } else {
      return MOCK_RATES.minGamer
    }
  }

  // Handle currency swap
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency as "SOL" | "GAMER")
    setToCurrency(fromCurrency as "SOL" | "GAMER")
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  // Handle from amount change
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      const exchangeRate = getExchangeRate()
      setToAmount((numValue * exchangeRate).toFixed(toCurrency === "SOL" ? 6 : 2))
    } else {
      setToAmount("")
    }
  }

  // Handle to amount change
  const handleToAmountChange = (value: string) => {
    setToAmount(value)
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      const exchangeRate = 1 / getExchangeRate()
      setFromAmount((numValue * exchangeRate).toFixed(fromCurrency === "SOL" ? 6 : 2))
    } else {
      setFromAmount("")
    }
  }

  // Validate the swap
  const validateSwap = () => {
    if (!fromAmount || !toAmount) {
      toast({
        title: "Error",
        description: "Please enter an amount to swap",
        variant: "destructive",
      })
      return false
    }

    const numFromAmount = Number.parseFloat(fromAmount)
    if (isNaN(numFromAmount) || numFromAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return false
    }

    const minAmount = getMinAmount()
    if (numFromAmount < minAmount) {
      toast({
        title: "Error",
        description: `Minimum amount is ${minAmount} ${fromCurrency}`,
        variant: "destructive",
      })
      return false
    }

    if (!publicKey) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Handle swap initiation
  const handleSwap = () => {
    if (!validateSwap()) return

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsConfirmModalOpen(true)
    }, 1500)
  }

  // Handle swap confirmation
  const handleConfirmSwap = () => {
    setIsConfirmModalOpen(false)
    setIsSwapping(true)
    setIsQRModalOpen(true)

    // Set expiry time to 15 minutes from now
    const expiryTime = new Date()
    expiryTime.setMinutes(expiryTime.getMinutes() + 15)
    setSwapExpiry(expiryTime)

    // Simulate a new pending transaction
    const newTx = {
      id: `tx${Date.now()}`,
      fromCurrency,
      toCurrency,
      fromAmount: Number.parseFloat(fromAmount),
      toAmount: Number.parseFloat(toAmount),
      status: "pending",
      date: new Date(),
      txHash: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    }

    setHistory([newTx, ...history])
  }

  // Handle swap completion
  const handleSwapComplete = () => {
    setIsSwapping(false)
    setIsQRModalOpen(false)
    toast({
      title: "Swap Initiated",
      description: "Your swap has been initiated and will be processed shortly",
    })

    // Update the latest transaction to completed after a delay
    setTimeout(() => {
      setHistory((prev) => [{ ...prev[0], status: "completed" }, ...prev.slice(1)])
    }, 30000)
  }

  // Handle swap expiry
  const handleSwapExpiry = () => {
    setIsSwapping(false)
    setIsQRModalOpen(false)
    toast({
      title: "Swap Expired",
      description: "Your swap request has expired. Please try again.",
      variant: "destructive",
    })

    // Update the latest transaction to failed
    setHistory((prev) => [{ ...prev[0], status: "failed" }, ...prev.slice(1)])
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-4 px-4">
        <Tabs defaultValue="swap" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1A1A1A] border border-[#333]">
            <TabsTrigger value="swap" className="data-[state=active]:bg-[#252525]" onClick={() => setActiveTab("swap")}>
              Swap
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-[#252525]"
              onClick={() => setActiveTab("history")}
            >
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swap" className="mt-4">
            <Card className="bg-[#111] border-[#333] shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Swap Tokens</CardTitle>
                <CardDescription className="text-gray-400">
                  Exchange Solana for Gamer tokens and vice versa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* From Currency */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-400">From</label>
                      <span className="text-xs text-gray-500">
                        Min: {getMinAmount()} {fromCurrency}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={fromAmount}
                          onChange={(e) => handleFromAmountChange(e.target.value)}
                          className="bg-[#1A1A1A] border-[#333] text-white"
                        />
                      </div>
                      <div className="w-24">
                        <select
                          value={fromCurrency}
                          onChange={(e) => setFromCurrency(e.target.value as "SOL" | "GAMER")}
                          className="w-full h-10 px-3 rounded-md bg-[#1A1A1A] border border-[#333] text-white"
                        >
                          <option value="SOL">SOL</option>
                          <option value="GAMER">GAMER</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSwapCurrencies}
                      className="rounded-full bg-[#1A1A1A] border-[#333] hover:bg-[#252525]"
                    >
                      <ArrowDownUp className="h-4 w-4 text-[#00FFA9]" />
                    </Button>
                  </div>

                  {/* To Currency */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-400">To (Estimated)</label>
                      <span className="text-xs text-gray-500">Fee: {MOCK_RATES.fee}%</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={toAmount}
                          onChange={(e) => handleToAmountChange(e.target.value)}
                          className="bg-[#1A1A1A] border-[#333] text-white"
                        />
                      </div>
                      <div className="w-24">
                        <select
                          value={toCurrency}
                          onChange={(e) => setToCurrency(e.target.value as "SOL" | "GAMER")}
                          className="w-full h-10 px-3 rounded-md bg-[#1A1A1A] border border-[#333] text-white"
                        >
                          <option value="GAMER">GAMER</option>
                          <option value="SOL">SOL</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Exchange Rate */}
                  <div className="bg-[#1A1A1A] p-4 rounded-md border border-[#333]">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-400">Exchange Rate</div>
                      <div className="text-sm text-white flex items-center">
                        1 {fromCurrency} = {getExchangeRate()} {toCurrency}
                        <TooltipProvider>
                          <Tooltip content="Rates are updated every 5 minutes">
                            <TooltipTrigger>
                              <Info className="h-4 w-4 ml-2 text-gray-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Rates are updated every 5 minutes.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSwap}
                  className="w-full bg-gradient-to-r from-[#9945FF] to-[#00FFA9] hover:opacity-90 text-black font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </div>
                  ) : (
                    "Swap Tokens"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="bg-[#111] border-[#333] shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="grid grid-cols-3 bg-[#1A1A1A] border border-[#333]">
                    <TabsTrigger value="all" className="data-[state=active]:bg-[#252525]">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:bg-[#252525]">
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="data-[state=active]:bg-[#252525]">
                      Completed
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="mt-4 space-y-4">
                    {history.length > 0 ? (
                      history.map((tx) => <SwapHistoryItem key={tx.id} transaction={tx} />)
                    ) : (
                      <div className="text-center py-6 text-gray-500">No transactions yet</div>
                    )}
                  </TabsContent>
                  <TabsContent value="pending" className="mt-4 space-y-4">
                    {history.filter((tx) => tx.status === "pending").length > 0 ? (
                      history
                        .filter((tx) => tx.status === "pending")
                        .map((tx) => <SwapHistoryItem key={tx.id} transaction={tx} />)
                    ) : (
                      <div className="text-center py-6 text-gray-500">No pending transactions</div>
                    )}
                  </TabsContent>
                  <TabsContent value="completed" className="mt-4 space-y-4">
                    {history.filter((tx) => tx.status === "completed").length > 0 ? (
                      history
                        .filter((tx) => tx.status === "completed")
                        .map((tx) => <SwapHistoryItem key={tx.id} transaction={tx} />)
                    ) : (
                      <div className="text-center py-6 text-gray-500">No completed transactions</div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* QR Code Modal */}
        <SwapQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
          fromAmount={fromAmount}
          toAmount={toAmount}
          expiryTime={swapExpiry}
          onComplete={handleSwapComplete}
          onExpire={handleSwapExpiry}
        />

        {/* Confirm Swap Modal */}
        <SwapConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmSwap}
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
          fromAmount={fromAmount}
          toAmount={toAmount}
          exchangeRate={getExchangeRate()}
          fee={MOCK_RATES.fee}
        />
      </div>
    </TooltipProvider>
  )
}


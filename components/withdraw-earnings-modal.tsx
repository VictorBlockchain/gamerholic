"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Coins, AlertCircle } from "lucide-react"

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  onWithdraw: (amount: number, tokenAddress: string) => Promise<void>
  balance: { sol: number; game: number }
}

const GAME_TOKEN_ADDRESS = "YOUR_GAME_TOKEN_ADDRESS_HERE" // Replace with actual GAME token address

export function WithdrawEarningsModal({ isOpen, onClose, onWithdraw, balance }: WithdrawModalProps) {
  const [amount, setAmount] = useState("")
  const [tokenType, setTokenType] = useState("game")
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const { toast } = useToast()
  
  const handleWithdraw = async () => {
    const withdrawAmount = Number.parseFloat(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      })
      return
    }

    let tokenAddress = GAME_TOKEN_ADDRESS
    if (tokenType === "sol") {
      tokenAddress = "SOL"
    } else if (tokenType === "custom" && customTokenAddress) {
      tokenAddress = customTokenAddress
    }

    try {
      await onWithdraw(withdrawAmount, tokenAddress)
      toast({
        title: "Withdrawal Initiated",
        description: `Withdrawing ${withdrawAmount} ${tokenType.toUpperCase()}`,
      })
      onClose()
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "There was an error processing your withdrawal. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center">
            <Coins className="mr-2 h-6 w-6" />
            Withdraw Funds
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sol-balance" className="text-primary">
                SOL Balance
              </Label>
              {/* <Input id="sol-balance" value={balance.sol.toFixed(4)} disabled className="bg-background/50" /> */}
            </div>
            <div>
              <Label htmlFor="game-balance" className="text-primary">
                GAME Balance
              </Label>
              {/* <Input id="game-balance" value={balance.game.toFixed(4)} disabled className="bg-background/50" /> */}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount" className="text-primary">
              Withdraw Amount
            </Label>
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <RadioGroup value={tokenType} onValueChange={setTokenType} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="game" id="game" className="peer sr-only" />
              <Label
                htmlFor="game"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background/50 p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span>GAME</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="sol" id="sol" className="peer sr-only" />
              <Label
                htmlFor="sol"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background/50 p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span>SOL</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="custom" id="custom" className="peer sr-only" />
              <Label
                htmlFor="custom"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background/50 p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span>Custom</span>
              </Label>
            </div>
          </RadioGroup>
          {tokenType === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom-token-address" className="text-primary">
                Custom Token Address
              </Label>
              <Input
                id="custom-token-address"
                placeholder="Enter token address"
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
                className="bg-background/50"
              />
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <p>Withdrawals are processed as Solana blockchain allows</p>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleWithdraw} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Withdraw
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { ArrowUpToLine, AlertCircle } from "lucide-react"

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  tokenType: "SOL" | "GAMER"
  balance: number
}

export function WithdrawModal({ isOpen, onClose, tokenType, balance }: WithdrawModalProps) {
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [address, setAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError(null)
    }
  }

  const validateForm = () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return false
    }

    if (Number.parseFloat(amount) > balance) {
      setError(`Insufficient balance. You have ${balance} ${tokenType} available.`)
      return false
    }

    if (!address || address.trim().length < 32) {
      setError("Please enter a valid Solana address")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Here you would implement the actual withdrawal logic
      // For now, we'll just simulate a successful withdrawal
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Withdrawal Initiated",
        description: `Your withdrawal of ${amount} ${tokenType} to ${address.slice(0, 6)}...${address.slice(-4)} has been initiated.`,
      })

      // Reset form and close modal
      setAmount("")
      setAddress("")
      onClose()
    } catch (error) {
      console.error("Error processing withdrawal:", error)
      setError("An error occurred while processing your withdrawal. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMaxAmount = () => {
    setAmount(balance.toString())
    setError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-[#333] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <ArrowUpToLine className="h-5 w-5 mr-2 text-[#00FFA9]" />
            Withdraw {tokenType}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-sm text-gray-400">
                Amount
              </Label>
              <div className="relative mt-1">
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="bg-[#222] border-[#444] pr-16"
                  placeholder={`0.00 ${tokenType}`}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-1 top-1 h-7 text-xs text-[#00FFA9] hover:text-[#00D48F] hover:bg-[#00FFA9]/10"
                  onClick={handleMaxAmount}
                >
                  MAX
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: {balance} {tokenType}
              </p>
            </div>

            <div>
              <Label htmlFor="address" className="text-sm text-gray-400">
                Destination Address
              </Label>
              <Input
                id="address"
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                  setError(null)
                }}
                className="bg-[#222] border-[#444] mt-1"
                placeholder="Solana address"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div className="bg-[#222] rounded-md p-4 text-sm">
              <h4 className="font-medium mb-2">Withdrawal Information</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Network fees will be deducted from your withdrawal amount</li>
                <li>• Withdrawals typically process within 5-10 minutes</li>
                <li>• Double-check your destination address before confirming</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              className={`w-full sm:w-auto font-bold rounded-full ${
                tokenType === "SOL"
                  ? "bg-[#9945FF] hover:bg-[#8A3DEE] text-white"
                  : "bg-[#00FFA9] hover:bg-[#00D48F] text-black"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
              {isSubmitting ? "Processing..." : "Confirm Withdrawal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


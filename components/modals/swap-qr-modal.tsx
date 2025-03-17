"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "@/components/ui/countdown-timer"
import { useEffect, useState } from "react"
import QRCode from "react-qr-code"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SwapQRModalProps {
  isOpen: boolean
  onClose: () => void
  fromCurrency: string
  toCurrency: string
  fromAmount: string
  toAmount: string
  expiryTime: Date | null
  onComplete: () => void
  onExpire: () => void
}

export function SwapQRModal({
  isOpen,
  onClose,
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
  expiryTime,
  onComplete,
  onExpire,
}: SwapQRModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [depositAddress, setDepositAddress] = useState("")

  // Generate a mock deposit address
  useEffect(() => {
    if (isOpen) {
      // In a real app, this would come from the API
      setDepositAddress("8xGUygUu8rHFTHrzHS1uJH7LfGqzArhVZwQZYkBuVbNBTk")
    }
  }, [isOpen])

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress)
    setCopied(true)
    toast({
      title: "Address Copied",
      description: "Deposit address copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  // Mock QR code value - in a real app, this would be a proper payment URL
  const qrValue = `solana:${depositAddress}?amount=${fromAmount}&label=Swap%20to%20${toCurrency}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#111] border-[#333] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Complete Your Swap</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 p-4">
          {/* Countdown Timer */}
          {expiryTime && (
            <div className="w-full">
              <p className="text-center text-gray-400 mb-2">Time Remaining</p>
              <CountdownTimer targetDate={expiryTime} onComplete={onExpire} className="scale-75" />
            </div>
          )}

          {/* Swap Details */}
          <div className="bg-[#1A1A1A] p-4 rounded-md border border-[#333] w-full">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">You Send</span>
              <span className="font-medium">
                {fromAmount} {fromCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">You Receive</span>
              <span className="font-medium">
                {toAmount} {toCurrency}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-md">
            <QRCode value={qrValue} size={200} />
          </div>

          {/* Deposit Address */}
          <div className="w-full">
            <p className="text-sm text-gray-400 mb-2">Send {fromCurrency} to this address:</p>
            <div className="flex">
              <div className="bg-[#1A1A1A] border border-[#333] rounded-l-md p-2 flex-1 overflow-hidden">
                <p className="text-sm truncate">{depositAddress}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-l-none bg-[#1A1A1A] border border-[#333] border-l-0 hover:bg-[#252525]"
                onClick={handleCopyAddress}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-400 text-center">
            <p>
              Send exactly{" "}
              <span className="text-white font-medium">
                {fromAmount} {fromCurrency}
              </span>{" "}
              to the address above.
            </p>
            <p className="mt-1">Your {toCurrency} will be sent to your wallet automatically after confirmation.</p>
          </div>

          {/* Complete Button - In a real app, this would be triggered by blockchain confirmation */}
          <Button
            className="w-full bg-gradient-to-r from-[#9945FF] to-[#00FFA9] hover:opacity-90 text-black font-bold"
            onClick={onComplete}
          >
            I've Sent the Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


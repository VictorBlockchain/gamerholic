"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  depositAddress: string
}

export function DepositModal({ isOpen, onClose, depositAddress }: DepositModalProps) {
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress)
    setIsCopied(true)
    toast({
      title: "Address Copied",
      description: "The deposit address has been copied to your clipboard.",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Deposit SOL</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={depositAddress} size={200} />
          </div>
          <div className="w-full bg-background/50 p-4 rounded-lg">
            <p className="text-sm text-primary/80 mb-2">Your Deposit Address:</p>
            <div className="flex items-center space-x-2">
              <p className="text-primary font-mono text-sm break-all">{depositAddress}</p>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={handleCopyAddress}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-primary/80 text-center">
            Send SOL to this address to deposit funds into your account.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}


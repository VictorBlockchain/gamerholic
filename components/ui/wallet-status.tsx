"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WalletStatusProps {
  showBalance?: boolean
  showDisconnect?: boolean
  className?: string
}

export function WalletStatus({ showBalance = true, showDisconnect = true, className }: WalletStatusProps) {
  const { connected, connecting, publicKey, disconnect } = useWallet()

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (connecting) {
    return (
      <div className={cn("bg-black/30 rounded-lg border border-[#333] p-6", className)}>
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-[#00FFA9] animate-spin" />
          <div>
            <h4 className="font-medium">Connecting Wallet</h4>
            <p className="text-sm text-gray-400">Please approve the connection request</p>
          </div>
        </div>
      </div>
    )
  }

  if (!connected || !publicKey) {
    return (
      <div className={cn("bg-black/30 rounded-lg border border-[#333] p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h4 className="font-medium">Wallet Not Connected</h4>
              <p className="text-sm text-gray-400">Connect your wallet to continue</p>
            </div>
          </div>
          <Badge className="bg-[#222] text-gray-300">Disconnected</Badge>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-black/30 rounded-lg border border-[#333] p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00FFA9]/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#00FFA9]" />
          </div>
          <div>
            <h4 className="font-medium">Wallet Connected</h4>
            <p className="text-sm text-gray-400">Phantom Wallet</p>
          </div>
        </div>
        <Badge className="bg-[#00FFA9] text-black">Connected</Badge>
      </div>
      <div className="p-3 bg-[#111] rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Address</span>
          <span className="text-sm font-mono">{truncateAddress(publicKey.toString())}</span>
        </div>
      </div>
      {/* {showBalance && (
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-400">Balance</span>
          <span className="text-lg font-bold text-[#00FFA9]">-- SOL</span>
        </div>
      )} */}
      {showDisconnect && (
        <Button
          onClick={disconnect}
          variant="outline"
          className="w-full border-[#333] text-white hover:bg-white/5 rounded-full"
        >
          Disconnect Wallet
        </Button>
      )}
    </div>
  )
}


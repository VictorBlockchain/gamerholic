"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { AuthButton } from "@/components/connect-wallet-button"
import { Cpu, Wallet, Shield, Zap } from "lucide-react"
import Image from "next/image"

interface WalletConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    if (open) {
      // Trigger animation after modal opens
      const timer = setTimeout(() => setAnimateIn(true), 100)
      return () => clearTimeout(timer)
    } else {
      setAnimateIn(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-black/95 border border-[#222] overflow-hidden p-0">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00FFA9]/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#00C3FF]/20 rounded-full blur-3xl"></div>
        </div>

        {/* Header with glow effect */}
        <div className="relative z-10 bg-gradient-to-b from-black/80 to-transparent pt-6 px-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0  rounded-lg"></div>
              <div className="relative w-10 h-10 rounded-lg flex items-center justify-center">
                            <Image
                                src="/logo.png"
                                alt="Gamerholic Logo"
                                layout="fill"
                                objectFit="cover"
                              />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-white">GAMERHOLIC</DialogTitle>
          </div>
          <DialogDescription className="text-xl font-medium text-white/90 mb-4">Connect Your Wallet</DialogDescription>
        </div>

        {/* Content with features */}
        <div className="px-6 py-4 relative z-10">
          <div
            className={`grid grid-cols-2 gap-4 mb-6 transition-all duration-500 ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
              <Wallet className="h-6 w-6 text-[#00FFA9] mb-2" />
              <h3 className="font-medium text-white">Secure Transactions</h3>
              <p className="text-sm text-white/70">Your funds, your control</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
              <Zap className="h-6 w-6 text-[#00C3FF] mb-2" />
              <h3 className="font-medium text-white">Instant Access</h3>
              <p className="text-sm text-white/70">Play, compete, and earn</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
              <Shield className="h-6 w-6 text-[#00FFA9] mb-2" />
              <h3 className="font-medium text-white">Safe & Secure</h3>
              <p className="text-sm text-white/70">Industry-standard security</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
              <Cpu className="h-6 w-6 text-[#00C3FF] mb-2" />
              <h3 className="font-medium text-white">Web3 Gaming</h3>
              <p className="text-sm text-white/70">The future of gaming</p>
            </div>
          </div>

          {/* Wallet connection options */}
          <div
            className={`mt-6 p-5 text-center rounded-lg bg-gradient-to-br from-black/80 to-black/40 border border-[#333] transition-all duration-700 delay-200 ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            <h3 className="text-center text-white font-medium mb-4">Choose your wallet</h3>
            <AuthButton />
          </div>

          {/* Supported wallets */}
          <div
            className={`mt-6 text-center transition-all duration-1000 delay-300 ${animateIn ? "opacity-100" : "opacity-0"}`}
          >
            {/* <p className="text-xs text-white/50 mb-2">Supported wallets</p>
            <div className="flex justify-center items-center gap-4">
              <div className="w-6 h-6 bg-white rounded-full"></div>
              <div className="w-6 h-6 bg-white rounded-full"></div>
              <div className="w-6 h-6 bg-white rounded-full"></div>
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </div> */}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent p-6 mt-4">
          <p className="text-xs text-center text-white/50">
            By connecting your wallet, you agree to our <span className="text-[#00FFA9]">Terms of Service</span> and{" "}
            <span className="text-[#00FFA9]">Privacy Policy</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}


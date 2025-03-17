"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, Menu, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import Image from "next/image";
import { useUser } from "@/contexts/user-context"
import { useWallet } from "@solana/wallet-adapter-react" // Import useWallet
import { WalletConnectModal } from "@/components/modals/wallet-connect-modal"

interface MobileHeaderProps {
  scrolled?: boolean
}

export function MobileHeader({ scrolled = false }: MobileHeaderProps) {
    const { isAuthenticated, player, profile, balance } = useUser()
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationCount] = useState(3)
    const { disconnect }: any = useWallet() // Added disconnect
    const [walletModalOpen, setWalletModalOpen] = useState(false)
  
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-black/80 backdrop-blur-md border-b border-[#222]" : "bg-transparent",
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-lg"></div>
            <div className="relative w-8 h-8 rounded-lg flex items-center justify-center">
            <Image
                src="/logo.png"
                alt="Gamerholic Logo"
                layout="fill"
                objectFit="cover"
              />
            </div>
          </div>
          <span
            className={cn(
              "text-xl font-bold tracking-tight transition-opacity duration-300",
              scrolled ? "opacity-0 w-0" : "opacity-100",
            )}
          >
            GAMERHOLIC
          </span>
        </Link>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
        
          {/* <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF007A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-[#FF007A] text-white text-xs items-center justify-center">
                  {notificationCount}
                </span>
              </span>
            )}
          </Button> */}
          
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {menuOpen && (
          <div className="fixed inset-0 top-16 bg-black/95 backdrop-blur-md z-40">
          <div className="container mx-auto px-4 py-8 overflow-auto max-h-[calc(100vh-4rem)]">
          {isAuthenticated && player && profile && (

            <div className="flex flex-col items-center justify-center space-y-4 mb-4 p-8 order-b border-[#333]">
              {/* Circular Avatar */}
                <>
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#00FFA9]">
                    <img
                      src={profile.avatar}
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-white text-2xl font-semibold mb-4">
                    {profile.name}
                  </div>
                </>
            </div>
          )}

            <nav className="flex flex-col space-y-6">
              <Link
                href="/mobile"
                className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-[#333]"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-lg font-medium">Home</span>
                {/* <Badge className="bg-[#00FFA9] text-black">Active</Badge> */}
              </Link>

              <Link
                href="/esports"
                className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-[#333]"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-lg font-medium">Esports</span>
              </Link>

              <Link
                href="/tournament"
                className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-[#333]"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-lg font-medium">Tournaments</span>
                {/* <Badge className="bg-[#FF007A] text-white">3 Live</Badge> */}
              </Link>
              
              <Link
                href="/grabbit"
                className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-[#333]"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-lg font-medium">Grabbit</span>
              </Link>
              
              <Link
                href="/shop"
                className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-[#333]"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-lg font-medium">Shop</span>
              </Link>
              <Link
                href="/wallet"
                className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-[#333]"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-lg font-medium">Wallet</span>
              </Link>
            </nav>
            {isAuthenticated && (
              <div className="mt-8 pt-8 border-t border-[#333]">
                <Button onClick={disconnect} className="w-full bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full">
                  Log Out
                </Button>
              </div>
            )}
            {!isAuthenticated && (
              <div className="mt-8 pt-8 border-t border-[#333]">
                <Button
                  variant="outline"
                  className="w-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] text-black font-semibold hover:opacity-90"
                  onClick={() => setWalletModalOpen(true)}
                >
                  Connect Wallet
                </Button>
              </div>
            )}
            <WalletConnectModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
          </div>
          </div>
      )}
    </header>
  )
}


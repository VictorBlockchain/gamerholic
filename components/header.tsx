"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, User, ChevronDown, TestTube } from "lucide-react"
import Image from "next/image"
import { WalletDisplay } from "@/components/wallet-display"
import { AuthButton } from "@/components/auth-button"
import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { balanceManager } from "@/lib/balance"
const BALANCE = new balanceManager()
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const { publicKey } = useWallet()

  useEffect(() => {
    if (publicKey) {
      fetchBalace()
      // Fetch notifications
      // This is a placeholder and should be replaced with actual API call
      setNotifications([
        { id: 1, type: "earnings", message: "You earned 10 credits!" },
        { id: 2, type: "leaderboard", message: "You've been overtaken on the leaderboard!" },
      ])
    }
  }, [publicKey])
  
  const fetchBalace = async()=>{
    let balance = await BALANCE.getBalance(publicKey)
    console.log(balance)
  }
  const ProfileMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <User className="h-5 w-5" />
          <ChevronDown className="h-3 w-3 absolute bottom-0 right-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/profile/${publicKey}`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-support-tickets">Support Tickets</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <AuthButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image src="/logo.png" alt="Gamerholic Logo" layout="fill" objectFit="cover" />
            </div>
            <span className="text-xl font-bold text-primary neon-glow sm:block hidden">Gamerholic</span>
          </Link>
          <div className="flex items-center gap-4">
            {publicKey && (
              <>
                <WalletDisplay />
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-accent animate-pulse" />
                  )}
                </Button>
                <ProfileMenu />
              </>
            )}
            {!publicKey && <AuthButton />}
          </div>
        </div>
        {mobileMenuOpen && publicKey && (
          <div className="py-4 space-y-4 sm:hidden">
            <WalletDisplay />
            <AuthButton />
          </div>
        )}
      </div>
    </header>
  )
}


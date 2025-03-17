"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, ChevronDown, X, Menu, LogOut, Cpu } from "lucide-react" // Added LogOut icon
import { useState, useCallback, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { WalletConnectModal } from "@/components/modals/wallet-connect-modal"
import { useUser } from "@/contexts/user-context"
import { ProfileUpdateModal, type UserData } from "@/components/modals/profile-update-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useWallet } from "@solana/wallet-adapter-react" // Import useWallet

export function Header() {
  const { isAuthenticated, player, profile, balance, isLoading } = useUser()
  const [isLoaded, setIsLoaded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showProfileUpdate, setShowProfileUpdate] = useState(false)
  const [userData, setUserData] = useState<UserData>({})
  const { disconnect }: any = useWallet() // Added disconnect
  const [walletModalOpen, setWalletModalOpen] = useState(false)

  const isMobile = useMobile()
  useEffect(() => {
    if (!isLoading && !profile && player) {
      setShowProfileUpdate(true)
    }
  }, [isLoading, profile, player])

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  const handleLogout = () => {
    disconnect() // Disconnect the Solana wallet
    // Optionally, you can also clear any local state or Supabase session here
  }

  const ProfileMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          {profile?.avatar ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image src={profile.avatar || "/placeholder.svg"} alt="User Avatar" layout="fill" objectFit="cover" />
            </div>
          ) : (
            <User className="h-5 w-5" />
          )}
          <ChevronDown className="h-3 w-3 absolute bottom-0 right-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {profile?.name && (
          <DropdownMenuItem className="flex items-center gap-2">
            <span className="font-semibold">{profile.name}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2">
          <span className="font-semibold">
            {player ? `${player.slice(0, 4)}...${player.slice(-4)}` : "Not Connected"}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={`/profile/${player}`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-support-tickets">Support Tickets</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Logout Button */}
        <DropdownMenuItem onClick={handleLogout}>
          <div className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  return (
    <header className="relative z-10 border-b border-[#222] backdrop-blur-md bg-black/30">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-lg"></div>
            <div className="relative w-10 h-10 rounded-lg flex items-center justify-center">
                          <Image
                              src="/logo.png"
                              alt="Gamerholic Logo"
                              layout="fill"
                              objectFit="cover"
                            />
            </div>
          </div>
          <Link href="/" className="text-2xl font-bold tracking-tight">
            GAMERHOLIC
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/arcade"
            className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm uppercase tracking-wider font-medium"
          >
            Arcade
          </Link>
          <Link
            href="/esports"
            className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm uppercase tracking-wider font-medium"
          >
            Esports
          </Link>
          <Link
            href="/tournaments"
            className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm uppercase tracking-wider font-medium"
          >
            Tournaments
          </Link>
          <Link
            href="/grabbit"
            className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm uppercase tracking-wider font-medium"
          >
            Grabbit
          </Link>
          <Link
            href="/shop"
            className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm uppercase tracking-wider font-medium"
          >
            Shop
          </Link>
          <Link
            href="/wallet"
            className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm uppercase tracking-wider font-medium"
          >
            Wallet
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <>
            {!isAuthenticated ? (
              <Button
                variant="outline"
                className="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] text-black font-semibold hover:opacity-90"
                onClick={() => setWalletModalOpen(true)}
              >
                Connect Wallet
              </Button>
            ) : (
              <ProfileMenu />
            )}
            <WalletConnectModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
          </>

          <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && isMobile && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-[#222] z-20">
          <nav className="container mx-auto py-6 px-4 flex flex-col space-y-4">
            <Link
              href="/"
              className="text-gray-300 hover:text-[#00FFA9] transition-colors text-lg py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-300 hover:text-[#00FFA9] transition-colors text-lg py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="#"
              className="text-gray-300 hover:text-[#00FFA9] transition-colors text-lg py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create
            </Link>
            <Link
              href="/tournaments"
              className="text-gray-300 hover:text-[#00FFA9] transition-colors text-lg py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tournaments
            </Link>
            <Link
              href="/profile"
              className="text-gray-300 hover:text-[#00FFA9] transition-colors text-lg py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profile
            </Link>
          </nav>
        </div>
      )}
      <ProfileUpdateModal
        open={showProfileUpdate}
        onOpenChange={setShowProfileUpdate}
        userData={userData}
        setUserData={setUserData}
        playerAddress={player || ""}
        onSuccess={() => {
          // Refresh user data after update
        }}
      />
    </header>
  )
}


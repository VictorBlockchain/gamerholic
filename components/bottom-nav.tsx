"use client"

import { useState } from "react"
import { Home, Search, PlusCircle, Gamepad, Trophy, Zap, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PopupMenu } from "@/components/popup-menu"
import { cn } from "@/lib/utils"
import { useWallet } from '@solana/wallet-adapter-react'

export function BottomNav() {
  const pathname = usePathname()
  const [activePopup, setActivePopup]:any = useState<string | null>(null)
  const { publicKey }:any = useWallet()

  const createItems = [
    { label: "Arcade Game", href: "/create-game", icon: <Gamepad className="h-6 w-6" /> },
    { label: "Esports", href: "/esports", icon: <Trophy className="h-6 w-6" /> },
    { label: "Grabbit Game", href: "/grabbit", icon: <Zap className="h-6 w-6" /> },
  ]

  const discoverItems = [
    { label: "Arcade Games", href: "/discover", icon: <Gamepad className="h-6 w-6" /> },
    { label: "Esports", href: "/esports", icon: <Trophy className="h-6 w-6" /> },
    { label: "Grabbit Games", href: "/grabbit", icon: <Zap className="h-6 w-6" /> },
  ]

  const gamesItems = [
    { label: "Arcade Games", href: "/discover", icon: <Gamepad className="h-6 w-6" /> },
    { label: "Esports", href: "/esports", icon: <Trophy className="h-6 w-6" /> },
    { label: "Grabbit", href: "/grabbit", icon: <Zap className="h-6 w-6" /> },
  ]

  const handlePopupToggle = (popupName: string) => {
    setActivePopup(activePopup === popupName ? null : popupName)
  }
  
  // Removed useEffect hook

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-primary/20 py-2 px-4 sm:hidden">
      <ul className="flex justify-around items-center">
        <li>
          <Link
            href="/"
            className={`flex flex-col items-center ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Home size={24} className="text-primary" />
            <span className="text-xs mt-1">Home</span>
          </Link>
        </li>
        <li>
          <button
            onClick={() => handlePopupToggle("discover")}
            className={cn("flex flex-col items-center", activePopup === "discover" && "text-primary")}
          >
            <Search className="h-6 w-6 text-primary" />
            <span className="text-xs mt-1">Discover</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => handlePopupToggle("create")}
            className={cn("flex flex-col items-center", activePopup === "create" && "text-primary")}
          >
            <PlusCircle className="h-6 w-6 text-primary" />
            <span className="text-xs mt-1">Create</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => handlePopupToggle("games")}
            className={cn("flex flex-col items-center", activePopup === "games" && "text-primary")}
          >
            <Gamepad className="h-6 w-6 text-primary" />
            <span className="text-xs mt-1">Games</span>
          </button>
        </li>
        {publicKey && (
                <li>
                <Link
                  href={`/profile/${publicKey}`}
                  className={`flex flex-col items-center ${pathname === "/profile" ? "text-primary" : "text-muted-foreground"}`}
                >
                  <User size={24} className="text-primary" />
                  <span className="text-xs mt-1">Profile</span>
                </Link>
              </li>
        )}
      </ul>
      <PopupMenu
        items={createItems}
        isOpen={activePopup === "create"}
        onClose={() => setActivePopup(null)}
        setActivePopup={setActivePopup}
      />
      <PopupMenu
        items={discoverItems}
        isOpen={activePopup === "discover"}
        onClose={() => setActivePopup(null)}
        setActivePopup={setActivePopup}
      />
      <PopupMenu
        items={gamesItems}
        isOpen={activePopup === "games"}
        onClose={() => setActivePopup(null)}
        setActivePopup={setActivePopup}
      />
    </nav>
  )
}


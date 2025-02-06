"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, PlusCircle, Gamepad, Trophy, Zap, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { PopupMenu } from "@/components/popup-menu"

export function BottomNav() {
  const pathname = usePathname()
  const [activePopup, setActivePopup] = useState<string | null>(null)

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

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background to-background/80 backdrop-blur-lg border-t border-primary/10 z-50">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className={cn("flex flex-col items-center", pathname === "/" && "text-primary")}>
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <button
            onClick={() => handlePopupToggle("discover")}
            className={cn("flex flex-col items-center", activePopup === "discover" && "text-primary")}
          >
            <Search className="h-6 w-6" />
            <span className="text-xs mt-1">Discover</span>
          </button>
          <button
            onClick={() => handlePopupToggle("create")}
            className={cn("flex flex-col items-center", activePopup === "create" && "text-primary")}
          >
            <PlusCircle className="h-6 w-6" />
            <span className="text-xs mt-1">Create</span>
          </button>
          <button
            onClick={() => handlePopupToggle("games")}
            className={cn("flex flex-col items-center", activePopup === "games" && "text-primary")}
          >
            <Gamepad className="h-6 w-6" />
            <span className="text-xs mt-1">Games</span>
          </button>
          <Link
            href="/profile"
            className={`flex flex-col items-center ${pathname === "/profile" ? "text-primary" : "text-muted-foreground"}`}
          >
            <User size={24} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
      <PopupMenu items={createItems} isOpen={activePopup === "create"} onClose={() => setActivePopup(null)} />
      <PopupMenu items={discoverItems} isOpen={activePopup === "discover"} onClose={() => setActivePopup(null)} />
      <PopupMenu items={gamesItems} isOpen={activePopup === "games"} onClose={() => setActivePopup(null)} />
    </>
  )
}


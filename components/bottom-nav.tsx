"use client"

import { Home, Search, Gamepad, User, PlusCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-primary/20 py-2 px-4 sm:hidden">
      <ul className="flex justify-around items-center">
        <li>
          <Link
            href="/"
            className={`flex flex-col items-center ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Home size={24} />
            <span className="text-xs mt-1">Home</span>
          </Link>
        </li>
        <li>
          <Link
            href="/discover"
            className={`flex flex-col items-center ${pathname === "/discover" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Search size={24} />
            <span className="text-xs mt-1">Discover</span>
          </Link>
        </li>
        <li>
          <Link
            href="/create-game"
            className={`flex flex-col items-center ${pathname === "/create-game" ? "text-primary" : "text-muted-foreground"}`}
          >
            <PlusCircle size={24} />
            <span className="text-xs mt-1">Create</span>
          </Link>
        </li>
        <li>
          <Link
            href="/games"
            className={`flex flex-col items-center ${pathname === "/games" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Gamepad size={24} />
            <span className="text-xs mt-1">Games</span>
          </Link>
        </li>
        <li>
          <Link
            href="/profile"
            className={`flex flex-col items-center ${pathname === "/profile" ? "text-primary" : "text-muted-foreground"}`}
          >
            <User size={24} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  )
}


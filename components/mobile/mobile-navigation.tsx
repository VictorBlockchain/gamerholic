"use client"
import { useState } from "react"
import { Home, Compass, Trophy, User, Menu, Gamepad, Gamepad2, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// interface MobileNavigationProps {
//   activeTab: string
//   setActiveTab: (tab: string) => void
// }

export function MobileNavigation() {
  const [activeTab, setActiveTab]:any = useState(1)
  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      href: "/",
    },
    {
      id: "esports",
      label: "Esports",
      icon: Gamepad,
      href: "#",
    },
    {
      id: "tournaments",
      label: "Tournaments",
      icon: Trophy,
      href: "#",
    },
    {
      id: "grabbit",
      label: "Grabbit",
      icon: Gamepad2,
      href: "#",
    },
    {
      id: "wallet",
      label: "Wallet",
      icon: Wallet,
      href: "#",
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-black/80 backdrop-blur-md border-t border-[#222]">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="flex-1 h-full"
                onClick={(e) => {
                  if (tab.href === "#") {
                    e.preventDefault()
                  }
                  setActiveTab(tab.id)
                }}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div
                    className={cn(
                      "relative flex items-center justify-center",
                      isActive &&
                        "before:content-[''] before:absolute before:-top-3 before:w-1 before:h-1 before:bg-[#00FFA9] before:rounded-full",
                    )}
                  >
                    {isActive && <div className="absolute -inset-2 bg-[#00FFA9] opacity-10 rounded-full blur-sm"></div>}
                    <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-[#00FFA9]" : "text-gray-500")} />
                  </div>
                  <span className={cn("text-xs mt-1 transition-colors", isActive ? "text-[#00FFA9]" : "text-gray-500")}>
                    {tab.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}


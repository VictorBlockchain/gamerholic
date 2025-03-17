"use client"

import { useState, useEffect } from "react"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { MobileNavigation } from "@/components/mobile/mobile-navigation"
import { MobileFooter } from "@/components/mobile/mobile-footer"
import { PageBackground } from "@/components/layout/page-background"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, Trophy, Zap, Flame, ChevronRight, Star } from "lucide-react"
import Image from "next/image"
import { useMobile } from "@/hooks/use-mobile"

export function HomeMobile() {
  const [activeTab, setActiveTab] = useState("home")
  const [scrolled, setScrolled] = useState(false)
  const isMobile = useMobile()
  
  // Handle scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-16 md:pb-0">
      
      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-4 relative z-10">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-gray-400">Ready to play?</p>
            </div>
            <Avatar className="h-10 w-10 border-2 border-[#00FFA9]">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@username" />
              <AvatarFallback className="bg-[#222]">JD</AvatarFallback>
            </Avatar>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="w-8 h-8 rounded-full bg-[#00FFA9]/20 flex items-center justify-center mb-2">
                  <Trophy className="w-4 h-4 text-[#00FFA9]" />
                </div>
                <p className="text-xs text-gray-400">ACTIVE TOURNAMENTS</p>
                <p className="text-xl font-bold">3</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="w-8 h-8 rounded-full bg-[#FF007A]/20 flex items-center justify-center mb-2">
                  <Gamepad2 className="w-4 h-4 text-[#FF007A]" />
                </div>
                <p className="text-xs text-gray-400">GAMES PLAYED</p>
                <p className="text-xl font-bold">24</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Tournament */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Featured Tournament</h2>
            <Button variant="ghost" className="text-gray-400 p-0 h-auto">
              See all <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
            <div className="relative">
              <Image
                src="/placeholder.svg?height=200&width=400"
                alt="Tournament"
                width={400}
                height={200}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              <div className="absolute top-3 right-3">
                <Badge className="bg-[#FF007A] text-white">LIVE</Badge>
              </div>
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10">
                  <Flame className="w-3 h-3 mr-1 text-[#FF007A]" /> 2.4k Watching
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold mb-1">Cyber Showdown Finals</h3>
              <p className="text-sm text-gray-400 mb-3">FPS Arena • 128 Players</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">PRIZE POOL</p>
                  <p className="text-base font-bold text-[#FFD600]">$10,000</p>
                </div>
                <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full px-4 py-1 h-8">
                  Join Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Popular Games */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Popular Games</h2>
            <Button variant="ghost" className="text-gray-400 p-0 h-auto">
              See all <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-3 scrollbar-hide">
            {[1, 2, 3, 4].map((game) => (
              <div key={game} className="flex-shrink-0 w-32">
                <div className="relative rounded-lg overflow-hidden mb-2 aspect-square">
                  <Image
                    src={`/placeholder.svg?height=128&width=128&text=Game${game}`}
                    alt={`Game ${game}`}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-[#FFD600] mr-1" />
                      <span className="text-xs">4.{game}</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-medium truncate">Neon Drift {game}</h3>
                <p className="text-xs text-gray-400">Racing</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Activity</h2>
            <Button variant="ghost" className="text-gray-400 p-0 h-auto">
              See all <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Tournament Win",
                description: "You won 1st place in Cyber Sprint",
                time: "2h ago",
                icon: <Trophy className="w-4 h-4 text-[#FFD600]" />,
                iconBg: "bg-[#FFD600]/20",
              },
              {
                title: "New Achievement",
                description: "Unlocked 'Speed Demon'",
                time: "5h ago",
                icon: <Zap className="w-4 h-4 text-[#00FFA9]" />,
                iconBg: "bg-[#00FFA9]/20",
              },
              {
                title: "Friend Request",
                description: "Alex Storm wants to be friends",
                time: "1d ago",
                icon: <Gamepad2 className="w-4 h-4 text-[#FF007A]" />,
                iconBg: "bg-[#FF007A]/20",
              },
            ].map((activity, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${activity.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{activity.title}</h3>
                      <p className="text-xs text-gray-400">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
  
    </div>
  )
}


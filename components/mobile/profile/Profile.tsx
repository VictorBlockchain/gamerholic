"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { MobileNavigation } from "@/components/mobile/mobile-navigation"
import { MobileFooter } from "@/components/mobile/mobile-footer"
import { PageBackground } from "@/components/layout/page-background"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { ButtonPressEffect, HoverGlow } from "@/components/ui/micro-interactions"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { MatchHistoryCard } from "@/components/cards/match-history-card"
import { Trophy, Users, Gamepad2, Brain, Edit, ChevronRight, Wallet, Settings, Bell, Zap, Star } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

// Mock data
const ACHIEVEMENTS = [
    {
      title: "Champion",
      description: "Win 10 tournaments in a row",
      progress: 7,
      total: 10,
      icon: <Trophy className="w-5 h-5 text-[#FFD600]" />,
      color: "bg-[#FFD600]/20",
      border: "border-[#FFD600]/20",
      iconBg: "bg-[#FFD600]/20",
      textColor: "text-[#FFD600]",
    },
    {
      title: "Creator",
      description: "Create 20 games using AI tools",
      progress: 12,
      total: 20,
      icon: <Brain className="w-5 h-5 text-[#00FFA9]" />,
      color: "bg-[#00FFA9]/20",
      border: "border-[#00FFA9]/20",
      iconBg: "bg-[#00FFA9]/20",
      textColor: "text-[#00FFA9]",
    },
    {
      title: "Social",
      description: "Gain 5,000 followers",
      progress: 2400,
      total: 5000,
      icon: <Users className="w-5 h-5 text-[#FF007A]" />,
      color: "bg-[#FF007A]/20",
      border: "border-[#FF007A]/20",
      iconBg: "bg-[#FF007A]/20",
      textColor: "text-[#FF007A]",
    },
  ]
  
  const MATCH_HISTORY = [
    {
      id: "1",
      game: "FPS Arena",
      gameIcon: "/placeholder.svg?height=20&width=20",
      opponent: "Team Alpha",
      date: "2h ago",
      result: "win",
      score: "3-1",
      reward: "$250",
    },
    {
      id: "2",
      game: "Racing",
      gameIcon: "/placeholder.svg?height=20&width=20",
      opponent: "SpeedDemon",
      date: "5h ago",
      result: "loss",
      score: "2-3",
    },
    {
      id: "3",
      game: "Strategy",
      gameIcon: "/placeholder.svg?height=20&width=20",
      opponent: "MindMaster",
      date: "1d ago",
      result: "win",
      score: "2-0",
      reward: "$150",
    },
  ]

export function ProfileMobile() {
    const router = useRouter()
    const isMobile = useMobile()
    const [activeTab, setActiveTab] = useState("stats")
    const [scrolled, setScrolled] = useState(false)
    const [showNotification, setShowNotification] = useState(false)
  
    // Handle scroll for header styling
    useEffect(() => {
      const handleScroll = () => {
        setScrolled(window.scrollY > 10)
      }
  
      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }, [])
    return(
        <>
          <main className="container mx-auto px-4 pt-20 pb-4 relative z-10">
        {/* Profile Header */}
        <section className="mb-6">
          <ScrollReveal>
            <div className="flex items-center gap-4">
              <HoverGlow>
                <Avatar className="h-20 w-20 border-2 border-[#00FFA9]">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" alt="@username" />
                  <AvatarFallback className="bg-[#222] text-xl">JD</AvatarFallback>
                </Avatar>
              </HoverGlow>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">John Doe</h1>
                  <Badge className="bg-[#FFD600] text-black text-xs">PRO</Badge>
                </div>
                <p className="text-gray-400 text-sm">@johndoe</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center text-xs text-gray-400">
                    <Trophy className="w-3 h-3 mr-1 text-[#FFD600]" />
                    <span>Level 42</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Users className="w-3 h-3 mr-1" />
                    <span>2.4k Followers</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="flex gap-2 mt-4">
              <ButtonPressEffect className="flex-1">
                <Button size="sm" className="w-full bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full">
                  <Edit className="w-3 h-3 mr-1" /> Edit Profile
                </Button>
              </ButtonPressEffect>
              <ButtonPressEffect>
                <Button size="sm" variant="outline" className="border-[#333] rounded-full w-10 h-10 p-0">
                  <Settings className="w-4 h-4" />
                </Button>
              </ButtonPressEffect>
              <ButtonPressEffect>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#333] rounded-full w-10 h-10 p-0 relative"
                  onClick={() => setShowNotification(!showNotification)}
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF007A] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF007A] text-white text-[10px] items-center justify-center">
                      3
                    </span>
                  </span>
                </Button>
              </ButtonPressEffect>
            </div>
          </ScrollReveal>
        </section>

        {/* Stats Cards */}
        <section className="mb-6">
          <ScrollReveal>
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[10px] text-gray-400">EARNINGS</h3>
                    <Trophy className="w-3 h-3 text-[#FFD600]" />
                  </div>
                  <p className="text-base font-bold text-white">
                    <AnimatedCounter end={12450} prefix="$" formatFn={(value) => value.toLocaleString()} />
                  </p>
                  <p className="text-[10px] text-[#00FFA9]">+$1,250 this month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[10px] text-gray-400">WIN RATE</h3>
                    <Gamepad2 className="w-3 h-3 text-[#00FFA9]" />
                  </div>
                  <p className="text-base font-bold text-white">
                    <AnimatedCounter end={68} suffix="%" />
                  </p>
                  <p className="text-[10px] text-[#00FFA9]">+2% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[10px] text-gray-400">RANK</h3>
                    <Star className="w-3 h-3 text-[#FFD600]" />
                  </div>
                  <p className="text-base font-bold text-white">Diamond</p>
                  <p className="text-[10px] text-[#00FFA9]">Top 5% of players</p>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </section>

        {/* Tabs */}
        <section className="mb-6">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid grid-cols-4 bg-[#111] border border-[#333] rounded-full p-1">
              <TabsTrigger
                value="stats"
                className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                onClick={() => setActiveTab("stats")}
              >
                Stats
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                onClick={() => setActiveTab("achievements")}
              >
                Achievements
              </TabsTrigger>
              <TabsTrigger
                value="matches"
                className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                onClick={() => setActiveTab("matches")}
              >
                Matches
              </TabsTrigger>
              <TabsTrigger
                value="wallet"
                className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                onClick={() => setActiveTab("wallet")}
              >
                Wallet
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </section>

        {/* Tab Content */}
        {activeTab === "stats" && (
          <section>
            <ScrollReveal>
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold mb-4">Performance Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Win Rate</span>
                        <span className="text-[#00FFA9]">68%</span>
                      </div>
                      <Progress value={68} className="h-2 bg-[#222]" indicatorClassName="bg-[#00FFA9]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Top 3 Finishes</span>
                        <span className="text-[#00FFA9]">72%</span>
                      </div>
                      <Progress value={72} className="h-2 bg-[#222]" indicatorClassName="bg-[#00FFA9]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>K/D Ratio</span>
                        <span className="text-[#00FFA9]">2.4</span>
                      </div>
                      <Progress value={60} className="h-2 bg-[#222]" indicatorClassName="bg-[#00FFA9]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#222]">
                    <div className="text-center p-2 bg-black/30 rounded-lg">
                      <p className="text-lg font-bold">
                        <AnimatedCounter end={24} />
                      </p>
                      <p className="text-[10px] text-gray-400">GAMES</p>
                    </div>
                    <div className="text-center p-2 bg-black/30 rounded-lg">
                      <p className="text-lg font-bold">
                        <AnimatedCounter end={12} />
                      </p>
                      <p className="text-[10px] text-gray-400">WINS</p>
                    </div>
                    <div className="text-center p-2 bg-black/30 rounded-lg">
                      <p className="text-lg font-bold">
                        <AnimatedCounter end={18} />
                      </p>
                      <p className="text-[10px] text-gray-400">TOP 3</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold">Recent Activity</h2>
                <Button variant="ghost" className="text-gray-400 p-0 h-auto text-xs">
                  See all <ChevronRight className="w-3 h-3 ml-1" />
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
                    icon: <Users className="w-4 h-4 text-[#FF007A]" />,
                    iconBg: "bg-[#FF007A]/20",
                  },
                ].map((activity, index) => (
                  <Card
                    key={index}
                    className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full ${activity.iconBg} flex items-center justify-center flex-shrink-0`}
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
            </ScrollReveal>
          </section>
        )}

        {activeTab === "achievements" && (
          <section>
            <ScrollReveal>
              <div className="space-y-4">
                {ACHIEVEMENTS.map((achievement, index) => (
                  <Card
                    key={index}
                    className={`bg-gradient-to-br from-[#111] to-black border ${achievement.border} rounded-xl overflow-hidden`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-full ${achievement.iconBg} flex items-center justify-center`}
                        >
                          {achievement.icon}
                        </div>
                        <div>
                          <h3 className="text-base font-bold">{achievement.title}</h3>
                          <p className="text-xs text-gray-400">{achievement.description}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className={`text-xs font-medium ${achievement.textColor}`}>
                          {achievement.progress}/{achievement.total}
                        </span>
                      </div>
                      <Progress
                        value={(achievement.progress / achievement.total) * 100}
                        className="h-2 bg-[#222]"
                        indicatorClassName={achievement.textColor.replace("text-", "bg-")}
                      />
                    </CardContent>
                  </Card>
                ))}

                <div className="text-center mt-6">
                  <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                    View All Achievements <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </section>
        )}

        {activeTab === "matches" && (
          <section>
            <ScrollReveal>
              <MatchHistoryCard
                title="Recent Matches"
                matches={MATCH_HISTORY}
                onViewAll={() => console.log("View all matches")}
              />
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold">Upcoming Tournaments</h2>
                  <Button variant="ghost" className="text-gray-400 p-0 h-auto text-xs">
                    See all <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Spring Championship", date: "Mar 25, 2025", game: "FPS Arena", status: "Registered" },
                    { name: "AI Masters Cup", date: "Apr 10, 2025", game: "Strategy", status: "Invited" },
                    { name: "Speed Demons", date: "Apr 15, 2025", game: "Racing", status: "Open" },
                  ].map((tournament, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-black/30 rounded-xl border border-[#333]"
                    >
                      <div>
                        <h3 className="text-sm font-medium">{tournament.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{tournament.date}</span>
                          <span>•</span>
                          <span>{tournament.game}</span>
                        </div>
                      </div>
                      <Badge
                        className={
                          tournament.status === "Registered"
                            ? "bg-[#00FFA9] text-black"
                            : tournament.status === "Invited"
                              ? "bg-[#FF007A] text-white"
                              : "bg-[#222] text-gray-300"
                        }
                      >
                        {tournament.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </section>
        )}

        {activeTab === "wallet" && (
          <section>
            <ScrollReveal>
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#00FFA9]/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-[#00FFA9]" />
                      </div>
                      <div>
                        <h4 className="font-medium">Wallet Connected</h4>
                        <p className="text-xs text-gray-400">Solana Wallet</p>
                      </div>
                    </div>
                    <Badge className="bg-[#00FFA9] text-black">Connected</Badge>
                  </div>
                  <div className="p-3 bg-[#111] rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Address</span>
                      <span className="text-xs font-mono">{address || "7x4G...3kPd"}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-gray-400">Balance</span>
                    <span className="text-lg font-bold text-[#00FFA9]">12.45 SOL</span>
                  </div>
                  <ButtonPressEffect>
                    <Button variant="outline" className="w-full border-[#333] text-white hover:bg-white/5 rounded-full">
                      View on Explorer
                    </Button>
                  </ButtonPressEffect>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold">Transaction History</h2>
                <Button variant="ghost" className="text-gray-400 p-0 h-auto text-xs">
                  See all <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    type: "Tournament Winnings",
                    amount: "+2.5 SOL",
                    date: "Mar 15, 2025",
                    status: "completed",
                  },
                  {
                    type: "Tournament Entry",
                    amount: "-0.5 SOL",
                    date: "Mar 12, 2025",
                    status: "completed",
                  },
                  {
                    type: "NFT Purchase",
                    amount: "-1.2 SOL",
                    date: "Mar 10, 2025",
                    status: "completed",
                  },
                ].map((transaction, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-black/30 rounded-xl border border-[#333]"
                  >
                    <div>
                      <h3 className="text-sm font-medium">{transaction.type}</h3>
                      <p className="text-xs text-gray-400">{transaction.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={transaction.amount.startsWith("+") ? "text-[#00FFA9]" : "text-[#FF007A]"}>
                        {transaction.amount}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{transaction.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </section>
        )}
      </main>
        
        </>
    )
}
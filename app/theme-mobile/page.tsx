"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { MobileNavigation } from "@/components/mobile/mobile-navigation"
import { MobileFooter } from "@/components/mobile/mobile-footer"
import { PageBackground } from "@/components/layout/page-background"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ButtonPressEffect, HoverGlow } from "@/components/ui/micro-interactions"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { FloatingElements } from "@/components/ui/floating-elements"
import {
  Trophy,
  Users,
  ChevronRight,
  Bell,
  Settings,
  Search,
  Clock,
  Star,
  Heart,
  MessageSquare,
  Share2,
  ThumbsUp,
  Eye,
  Calendar,
  Flame,
  Shield,
  Mic,
  Video,
  Headphones,
  Smartphone,
  Laptop,
  Monitor,
  Tv,
  Wifi,
  Signal,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { MobileMatchCard } from "@/components/mobile/mobile-match-card"
import { MobileTournamentCard } from "@/components/mobile/mobile-tournament-card"
import { MobileTeamCard } from "@/components/mobile/mobile-team-card"
import { MobilePlayerCard } from "@/components/mobile/mobile-player-card"
import { MobileGameCard } from "@/components/mobile/mobile-game-card"
import { MobileChatRoom } from "@/components/mobile/mobile-chat-room"
import { MobileStreamViewer } from "@/components/mobile/mobile-stream-viewer"
import { MobileBracketViewer } from "@/components/mobile/mobile-bracket-viewer"
import { MobileNotification } from "@/components/mobile/mobile-notification"

export default function MobileThemePage() {
  const router = useRouter()
  const isMobile = useMobile()
  const [activeTab, setActiveTab] = useState("components")
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(45)

  // Handle scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Simulate progress increase
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress((p) => (p < 100 ? p + 1 : 0))
    }, 1000)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-16 md:pb-0">
      <PageBackground />
      <FloatingElements count={3} colors={["#00FFA9", "#FF007A"]} maxSize={8} />

      {/* Mobile Header */}
      <MobileHeader scrolled={scrolled} />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-4 relative z-10">
        <ScrollReveal>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Mobile UI Kit</h1>
            <p className="text-gray-400 text-sm">Components for Gamerholic Esports Platform</p>
          </div>
        </ScrollReveal>

        <Tabs defaultValue="components" className="w-full mb-8">
          <ScrollReveal>
            <TabsList className="grid grid-cols-4 bg-[#111] border border-[#333] rounded-full p-1 mb-6">
              <TabsTrigger
                value="components"
                className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                onClick={() => setActiveTab("components")}
              >
                Components
              </TabsTrigger>
              <TabsTrigger
                value="esports"
                className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                onClick={() => setActiveTab("esports")}
              >
                Esports
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                onClick={() => setActiveTab("social")}
              >
                Social
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black text-xs py-1"
                onClick={() => setActiveTab("media")}
              >
                Media
              </TabsTrigger>
            </TabsList>
          </ScrollReveal>

          <TabsContent value="components">
            {/* Basic Components Section */}
            <section className="mb-8">
              <ScrollReveal>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Buttons</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full">Primary</Button>
                      <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white rounded-full">Secondary</Button>
                      <Button variant="outline" className="border-[#333] rounded-full">
                        Outline
                      </Button>
                      <Button variant="ghost" className="rounded-full">
                        Ghost
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <ButtonPressEffect>
                        <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full">With Effect</Button>
                      </ButtonPressEffect>

                      <ButtonPressEffect>
                        <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white rounded-full">
                          <Trophy className="w-4 h-4 mr-2" /> With Icon
                        </Button>
                      </ButtonPressEffect>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Badges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <Badge className="bg-[#00FFA9] text-black">Primary</Badge>
                      <Badge className="bg-[#FF007A] text-white">Secondary</Badge>
                      <Badge className="bg-[#FFD600] text-black">Gold</Badge>
                      <Badge className="bg-[#333] text-white">Neutral</Badge>
                      <Badge className="bg-black/50 backdrop-blur-sm text-white border border-white/10">
                        <Flame className="w-3 h-3 mr-1 text-[#FF007A]" /> Live
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={150}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Form Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search..."
                          className="pl-10 bg-black/50 border-[#333] focus:border-[#00FFA9] rounded-lg"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="airplane-mode" />
                        <Label htmlFor="airplane-mode">Notifications</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox id="terms" />
                        <Label htmlFor="terms">Accept terms</Label>
                      </div>

                      <div>
                        <Label htmlFor="slider" className="mb-2 block">
                          Volume
                        </Label>
                        <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
                      </div>

                      <RadioGroup defaultValue="option-one">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="option-one" id="option-one" />
                          <Label htmlFor="option-one">Option One</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="option-two" id="option-two" />
                          <Label htmlFor="option-two">Option Two</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Progress & Loading</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Download Progress</span>
                          <span className="text-[#00FFA9]">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-[#222]" indicatorClassName="bg-[#00FFA9]" />
                      </div>

                      <div className="flex items-center justify-center py-4">
                        <div className="relative h-10 w-10">
                          <div className="absolute inset-0 rounded-full border-2 border-[#00FFA9] border-opacity-20"></div>
                          <div className="absolute inset-0 rounded-full border-2 border-[#00FFA9] border-opacity-100 border-t-transparent animate-spin"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={250}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Cards & Containers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                        <CardContent className="p-3">
                          <div className="w-8 h-8 rounded-full bg-[#00FFA9]/20 flex items-center justify-center mb-2">
                            <Trophy className="w-4 h-4 text-[#00FFA9]" />
                          </div>
                          <p className="text-xs text-gray-400">WINS</p>
                          <p className="text-xl font-bold">
                            <AnimatedCounter end={24} />
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                        <CardContent className="p-3">
                          <div className="w-8 h-8 rounded-full bg-[#FF007A]/20 flex items-center justify-center mb-2">
                            <Users className="w-4 h-4 text-[#FF007A]" />
                          </div>
                          <p className="text-xs text-gray-400">FOLLOWERS</p>
                          <p className="text-xl font-bold">
                            <AnimatedCounter end={1250} />
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="p-3 bg-black/30 rounded-xl border border-[#333]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                            <Bell className="w-4 h-4 text-[#00FFA9]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Notification</h3>
                            <p className="text-xs text-gray-400">Simple container with border</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Avatars & Media</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <HoverGlow>
                        <Avatar className="h-12 w-12 border-2 border-[#00FFA9]">
                          <AvatarImage src="/placeholder.svg?height=48&width=48" alt="@username" />
                          <AvatarFallback className="bg-[#222]">JD</AvatarFallback>
                        </Avatar>
                      </HoverGlow>

                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                          <Avatar key={i} className="h-8 w-8 border-2 border-black">
                            <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${i}`} alt={`User ${i}`} />
                            <AvatarFallback className="bg-[#222]">U{i}</AvatarFallback>
                          </Avatar>
                        ))}
                        <div className="h-8 w-8 rounded-full bg-[#333] flex items-center justify-center text-xs border-2 border-black">
                          +5
                        </div>
                      </div>
                    </div>

                    <div className="relative rounded-lg overflow-hidden">
                      <Image
                        src="/placeholder.svg?height=200&width=400"
                        alt="Media example"
                        width={400}
                        height={200}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                        <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10">
                          <Eye className="w-3 h-3 mr-1" /> 2.4k
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm"
                          >
                            <Heart className="h-3 w-3 text-[#FF007A]" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm"
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </section>
          </TabsContent>

          <TabsContent value="esports">
            {/* Esports Components Section */}
            <section className="mb-8">
              <ScrollReveal>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Tournament Cards</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MobileTournamentCard
                      title="Cyber Showdown"
                      game="FPS Arena"
                      image="/placeholder.svg?height=200&width=400"
                      status="LIVE"
                      statusColor="bg-[#00FFA9]"
                      prize="$10,000"
                      players="128/128"
                      timeLeft="02:45:33"
                      viewers={2400}
                      onClick={() => console.log("Tournament clicked")}
                    />

                    <div className="flex">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src="/placeholder.svg?height=96&width=96"
                          alt="Tournament"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1">
                          <Badge className="bg-[#FF007A] text-white text-[10px] px-1 py-0">SOON</Badge>
                        </div>
                      </div>
                      <div className="p-3 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-bold mb-1">Neon Racers</h3>
                            <p className="text-xs text-gray-400">Racing</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">PRIZE</p>
                            <p className="text-sm font-bold text-[#FFD600]">$5,000</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center text-xs text-gray-400">
                            <Users className="w-3 h-3 mr-1" />
                            <span>64/128</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>23:45:12</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Match Cards</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MobileMatchCard
                      team1={{
                        name: "Team Alpha",
                        logo: "/placeholder.svg?height=40&width=40",
                        score: 2,
                      }}
                      team2={{
                        name: "Team Omega",
                        logo: "/placeholder.svg?height=40&width=40",
                        score: 1,
                      }}
                      status="LIVE"
                      game="FPS Arena"
                      time="Round 3 - BO5"
                      viewers={1250}
                      onClick={() => console.log("Match clicked")}
                    />

                    <div className="p-3 bg-black/30 rounded-xl border border-[#333]">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-[#FFD600] text-black text-xs">UPCOMING</Badge>
                        <span className="text-xs text-gray-400">Today, 18:00</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg?height=32&width=32&text=A" alt="Team A" />
                            <AvatarFallback className="bg-[#222]">A</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">Dragons</span>
                        </div>

                        <div className="text-xs text-gray-400">VS</div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Phoenix</span>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg?height=32&width=32&text=P" alt="Team P" />
                            <AvatarFallback className="bg-[#222]">P</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">Strategy • Quarter Finals</span>
                        <ButtonPressEffect>
                          <Button size="sm" className="h-7 text-xs rounded-full bg-[#333] hover:bg-[#444]">
                            Reminder
                          </Button>
                        </ButtonPressEffect>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={150}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Team & Player Cards</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MobileTeamCard
                      name="Cyber Wolves"
                      logo="/placeholder.svg?height=60&width=60"
                      members={5}
                      wins={24}
                      rank={3}
                      game="FPS Arena"
                      onClick={() => console.log("Team clicked")}
                    />

                    <MobilePlayerCard
                      name="Alex Storm"
                      avatar="/placeholder.svg?height=60&width=60"
                      role="Team Captain"
                      team="Cyber Wolves"
                      stats={{
                        kd: "2.4",
                        winRate: "68%",
                        tournaments: 12,
                      }}
                      onClick={() => console.log("Player clicked")}
                    />
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Bracket Viewer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MobileBracketViewer
                      tournamentName="Cyber Showdown"
                      rounds={[
                        {
                          name: "Quarter Finals",
                          matches: [
                            {
                              team1: { name: "Team A", score: 2 },
                              team2: { name: "Team B", score: 0 },
                              winner: "team1",
                              completed: true,
                            },
                            {
                              team1: { name: "Team C", score: 1 },
                              team2: { name: "Team D", score: 2 },
                              winner: "team2",
                              completed: true,
                            },
                            {
                              team1: { name: "Team E", score: 2 },
                              team2: { name: "Team F", score: 1 },
                              winner: "team1",
                              completed: true,
                            },
                            {
                              team1: { name: "Team G", score: 0 },
                              team2: { name: "Team H", score: 2 },
                              winner: "team2",
                              completed: true,
                            },
                          ],
                        },
                        {
                          name: "Semi Finals",
                          matches: [
                            {
                              team1: { name: "Team A", score: 1 },
                              team2: { name: "Team D", score: 2 },
                              winner: "team2",
                              completed: true,
                            },
                            {
                              team1: { name: "Team E", score: 2 },
                              team2: { name: "Team H", score: 0 },
                              winner: "team1",
                              completed: true,
                            },
                          ],
                        },
                        {
                          name: "Finals",
                          matches: [
                            {
                              team1: { name: "Team D", score: 1 },
                              team2: { name: "Team E", score: 2 },
                              winner: "team2",
                              completed: true,
                            },
                          ],
                        },
                      ]}
                    />
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={250}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Game Cards</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MobileGameCard
                      title="Neon Drift Racer"
                      image="/placeholder.svg?height=200&width=400"
                      category="Racing"
                      players="12.5k"
                      rating={4.8}
                      isNew={true}
                      onClick={() => console.log("Game clicked")}
                    />

                    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-3 scrollbar-hide">
                      {[1, 2, 3].map((game) => (
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
                          <h3 className="text-sm font-medium truncate">Cyber Arena {game}</h3>
                          <p className="text-xs text-gray-400">FPS • {game * 2.5}k players</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </section>
          </TabsContent>

          <TabsContent value="social">
            {/* Social Components Section */}
            <section className="mb-8">
              <ScrollReveal>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Chat Room</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MobileChatRoom
                      channelName="Tournament Lobby"
                      messages={[
                        {
                          id: "1",
                          user: {
                            name: "Alex",
                            avatar: "/placeholder.svg?height=32&width=32&text=A",
                          },
                          text: "Good luck everyone in today's tournament!",
                          timestamp: "2 min ago",
                        },
                        {
                          id: "2",
                          user: {
                            name: "Sarah",
                            avatar: "/placeholder.svg?height=32&width=32&text=S",
                          },
                          text: "Thanks! May the best player win 🏆",
                          timestamp: "1 min ago",
                        },
                        {
                          id: "3",
                          user: {
                            name: "Mike",
                            avatar: "/placeholder.svg?height=32&width=32&text=M",
                          },
                          text: "Anyone want to team up for the next tournament?",
                          timestamp: "Just now",
                        },
                      ]}
                      onSendMessage={(message) => console.log("Message sent:", message)}
                    />
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MobileNotification
                      type="tournament"
                      title="Tournament Starting Soon"
                      message="Cyber Showdown begins in 15 minutes. Get ready!"
                      time="15 min ago"
                      icon={<Trophy className="w-4 h-4 text-[#FFD600]" />}
                      iconBg="bg-[#FFD600]/20"
                      action={() => console.log("Notification clicked")}
                    />

                    <MobileNotification
                      type="friend"
                      title="Friend Request"
                      message="Alex Storm wants to be friends"
                      time="1h ago"
                      icon={<Users className="w-4 h-4 text-[#FF007A]" />}
                      iconBg="bg-[#FF007A]/20"
                      action={() => console.log("Notification clicked")}
                    />

                    <MobileNotification
                      type="achievement"
                      title="New Achievement"
                      message="You've unlocked 'First Victory'"
                      time="2h ago"
                      icon={<Shield className="w-4 h-4 text-[#00FFA9]" />}
                      iconBg="bg-[#00FFA9]/20"
                      action={() => console.log("Notification clicked")}
                    />
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={150}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Social Feed</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 bg-black/30 rounded-xl border border-[#333]">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg?height=40&width=40&text=A" alt="Alex" />
                            <AvatarFallback className="bg-[#222]">A</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-sm font-bold">Alex Storm</h3>
                            <p className="text-xs text-gray-400">2 hours ago</p>
                          </div>
                        </div>

                        <p className="text-sm mb-3">
                          Just won my first tournament! Thanks to everyone who supported me 🏆
                        </p>

                        <div className="relative rounded-lg overflow-hidden mb-3">
                          <Image
                            src="/placeholder.svg?height=200&width=400&text=Victory"
                            alt="Tournament victory"
                            width={400}
                            height={200}
                            className="w-full h-40 object-cover"
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <ThumbsUp className="w-4 h-4 mr-1" /> 124
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <MessageSquare className="w-4 h-4 mr-1" /> 32
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-black/30 rounded-xl border border-[#333]">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg?height=40&width=40&text=T" alt="Team" />
                            <AvatarFallback className="bg-[#222]">T</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-sm font-bold">Team Phoenix</h3>
                            <p className="text-xs text-gray-400">5 hours ago</p>
                          </div>
                        </div>

                        <p className="text-sm mb-3">
                          We're recruiting new players for our competitive team! DM us if interested.
                        </p>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <ThumbsUp className="w-4 h-4 mr-1" /> 87
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <MessageSquare className="w-4 h-4 mr-1" /> 15
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </section>
          </TabsContent>

          <TabsContent value="media">
            {/* Media Components Section */}
            <section className="mb-8">
              <ScrollReveal>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Stream Viewer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MobileStreamViewer
                      title="Cyber Showdown Finals"
                      streamer="Alex Storm"
                      game="FPS Arena"
                      viewers={2450}
                      thumbnail="/placeholder.svg?height=300&width=500"
                      live={true}
                    />
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Media Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="relative aspect-square rounded-lg overflow-hidden">
                          <Image
                            src={`/placeholder.svg?height=120&width=120&text=${item}`}
                            alt={`Gallery item ${item}`}
                            width={120}
                            height={120}
                            className="w-full h-full object-cover"
                          />
                          {item === 3 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-3 border-[#333] text-white hover:bg-white/5 rounded-full"
                    >
                      View All Media
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={150}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Streams</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      {
                        title: "Tournament Finals",
                        streamer: "OfficialESL",
                        game: "FPS Arena",
                        time: "Today, 20:00",
                        thumbnail: "/placeholder.svg?height=80&width=120&text=Finals",
                      },
                      {
                        title: "Pro Tips & Tricks",
                        streamer: "ProGamer",
                        game: "Strategy Masters",
                        time: "Tomorrow, 18:00",
                        thumbnail: "/placeholder.svg?height=80&width=120&text=Tips",
                      },
                      {
                        title: "Community Challenge",
                        streamer: "GamerholicTV",
                        game: "Racing Evolution",
                        time: "Sat, 16:00",
                        thumbnail: "/placeholder.svg?height=80&width=120&text=Community",
                      },
                    ].map((stream, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-black/30 rounded-xl border border-[#333]">
                        <div className="relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={stream.thumbnail || "/placeholder.svg"}
                            alt={stream.title}
                            width={120}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1">
                            <Badge className="bg-[#FF007A] text-white text-[10px] px-1 py-0">SOON</Badge>
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-sm font-bold line-clamp-1">{stream.title}</h3>
                          <p className="text-xs text-gray-400">{stream.streamer}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-400">{stream.game}</span>
                            <div className="flex items-center text-xs text-gray-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>{stream.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Voice Chat Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-black/30 rounded-xl border border-[#333]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="/placeholder.svg?height=40&width=40&text=T" alt="Team" />
                              <AvatarFallback className="bg-[#222]">T</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00FFA9] rounded-full border-2 border-black"></div>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold">Team Voice</h3>
                            <p className="text-xs text-gray-400">5 members online</p>
                          </div>
                        </div>
                        <Badge className="bg-[#00FFA9] text-black">CONNECTED</Badge>
                      </div>

                      <div className="flex justify-between mb-4">
                        <Button size="sm" variant="outline" className="rounded-full border-[#333] flex-1 mr-2">
                          <Headphones className="w-4 h-4 mr-2" /> Devices
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full border-[#333] flex-1">
                          <Users className="w-4 h-4 mr-2" /> Members
                        </Button>
                      </div>

                      <div className="flex justify-center gap-4">
                        <ButtonPressEffect>
                          <Button size="icon" className="h-12 w-12 rounded-full bg-[#222] hover:bg-[#333]">
                            <Mic className="h-5 w-5" />
                          </Button>
                        </ButtonPressEffect>

                        <ButtonPressEffect>
                          <Button size="icon" className="h-12 w-12 rounded-full bg-[#FF007A] hover:bg-[#D60067]">
                            <Headphones className="h-5 w-5" />
                          </Button>
                        </ButtonPressEffect>

                        <ButtonPressEffect>
                          <Button size="icon" className="h-12 w-12 rounded-full bg-[#222] hover:bg-[#333]">
                            <Settings className="h-5 w-5" />
                          </Button>
                        </ButtonPressEffect>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={250}>
                <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Device Selector</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-black/30 rounded-xl border border-[#333]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                            <Smartphone className="w-4 h-4 text-[#00FFA9]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Mobile</h3>
                            <p className="text-xs text-gray-400">iPhone 13 Pro</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Signal className="w-4 h-4 text-[#00FFA9] mr-1" />
                          <span className="text-xs text-[#00FFA9]">Connected</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-black/30 rounded-xl border border-[#333]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                            <Laptop className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Laptop</h3>
                            <p className="text-xs text-gray-400">MacBook Pro</p>
                          </div>
                        </div>
                        <Button size="sm" className="h-7 text-xs rounded-full bg-[#333] hover:bg-[#444]">
                          Connect
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-black/30 rounded-xl border border-[#333]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                            <Monitor className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Desktop</h3>
                            <p className="text-xs text-gray-400">Gaming PC</p>
                          </div>
                        </div>
                        <Button size="sm" className="h-7 text-xs rounded-full bg-[#333] hover:bg-[#444]">
                          Connect
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-black/30 rounded-xl border border-[#333]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                            <Tv className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">TV</h3>
                            <p className="text-xs text-gray-400">Samsung Smart TV</p>
                          </div>
                        </div>
                        <Button size="sm" className="h-7 text-xs rounded-full bg-[#333] hover:bg-[#444]">
                          Connect
                        </Button>
                      </div>
                    </div>

                    <ButtonPressEffect>
                      <Button className="w-full bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full mt-2">
                        <Wifi className="w-4 h-4 mr-2" /> Scan for Devices
                      </Button>
                    </ButtonPressEffect>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </section>
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Navigation - Only visible on mobile */}
      {isMobile && <MobileNavigation activeTab="home" setActiveTab={(tab) => router.push(`/mobile/${tab}`)} />}

      {/* Mobile Footer - Only visible on larger screens */}
      {!isMobile && <MobileFooter />}
    </div>
  )
}


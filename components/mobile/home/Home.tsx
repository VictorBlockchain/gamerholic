"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Gamepad2,
  Trophy,
  Zap,
  Brain,
  Flame,
  ChevronRight,
  Star,
  Users,
  Layers,
  BarChart3,
  Wallet,
  ArrowRight,
  Clock,
  Award,
  Sparkles,
} from "lucide-react"
import Image from "next/image"
import { useMobile } from "@/hooks/use-mobile"
import { WalletConnectModal } from "@/components/modals/wallet-connect-modal"
import Link from 'next/link';

export function HomeMobile() {
  const [activeTab, setActiveTab] = useState("home")
  const [scrolled, setScrolled] = useState(false)
  const isMobile = useMobile()
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  
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
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden mb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0A0A0A] z-10"></div>
        <Image
          src="/home/21.png?height=500&width=1000&text=Gamerholic"
          alt="Gamerholic Hero"
          width={1000}
          height={500}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 h-full flex flex-col justify-center px-4 pt-16">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Play. <span className="text-[#00FFA9]">Compete.</span> Earn.
          </h1>
          <p className="text-gray-300 mb-6 max-w-xs">The ultimate gaming platform powered by Solana blockchain</p>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full" onClick={() => setWalletModalOpen(true)}>Start Playing</Button>
            <Link href="/about">
            <Button
              variant="outline"
              className="border-[#00FFA9] text-[#00FFA9] rounded-full bg-transparent hover:bg-[#00FFA9]/10"
            >
              Learn More
            </Button>
            </Link>
          </div>
        </div>
      </section>
      
    
      {/* Main Content */}
      <main className="container mx-auto px-4 pb-4 relative z-10 -mt-10">
                
                        {/* Gamer Token Section */}
        <section className="mb-8">
          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-4">
            <div className="relative">
              <Image
                src="/home/24.png?height=200&width=400&text=GAMER"
                alt="GAMER Token"
                width={400}
                height={200}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              
              {/* Token overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#FFD600] to-[#FF9900] flex items-center justify-center">
                  <div className="absolute inset-1 rounded-full bg-black flex items-center justify-center">
                    <span className="text-xl font-bold text-[#FFD600]">$GAMER</span>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold mb-1">Gaming Meme Token With Utility</h3>
              <p className="text-sm text-gray-400 mb-4">Power the Gamerholic ecosystem with real utility for gamers</p>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFD600]/20 flex items-center justify-center">
                    <Gamepad2 className="w-3 h-3 text-[#FFD600]" />
                  </div>
                  <p className="text-xs text-gray-300">Tournament entry with lower fees</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFD600]/20 flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-[#FFD600]" />
                  </div>
                  <p className="text-xs text-gray-300">Stake for passive income</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFD600]/20 flex items-center justify-center">
                    <Users className="w-3 h-3 text-[#FFD600]" />
                  </div>
                  <p className="text-xs text-gray-300">Governance voting rights</p>
                </div>
              </div>

              <Button className="w-full bg-[#FFD600] hover:bg-[#E6C200] text-black rounded-full">
                Buy $GAMER Token
              </Button>
            </CardContent>
          </Card>
        </section>

                {/* Esports Section */}
                <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Esports Challenges</h2>
            <Button variant="ghost" className="text-gray-400 p-0 h-auto">
              See all <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-4">
            <div className="relative">
              <Image
                src="/home/23.png?height=200&width=400&text=Esports"
                alt="Esports Challenges"
                width={400}
                height={200}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold mb-1">Challenge Friends Head-to-Head</h3>
              <p className="text-sm text-gray-400 mb-3">Play competitive matches for SOL or GAMER tokens</p>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FF007A]/20 flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-[#FF007A]" />
                  </div>
                  <p className="text-xs text-gray-300">Stake & win crypto rewards</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FF007A]/20 flex items-center justify-center">
                    <Users className="w-3 h-3 text-[#FF007A]" />
                  </div>
                  <p className="text-xs text-gray-300">Challenge anyone globally</p>
                </div>
              </div>
              <Button className="w-full bg-[#FF007A] hover:bg-[#D60067] text-white rounded-full">
                Start Challenging
              </Button>
            </CardContent>
          </Card>
        </section>

                {/* How It Works */}
                <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">How It Works</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Connect Wallet",
                description: "Link your Solana wallet to get started",
                icon: <Wallet className="w-5 h-5 text-[#00FFA9]" />,
                iconBg: "bg-[#00FFA9]/20",
                step: "01",
              },
              {
                title: "Choose Game Mode",
                description: "Select tournaments, challenges, or casual play",
                icon: <Gamepad2 className="w-5 h-5 text-[#FF007A]" />,
                iconBg: "bg-[#FF007A]/20",
                step: "02",
              },
              {
                title: "Compete & Win",
                description: "Play games and earn crypto rewards",
                icon: <Trophy className="w-5 h-5 text-[#FFD600]" />,
                iconBg: "bg-[#FFD600]/20",
                step: "03",
              },
            ].map((step, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full ${step.iconBg} flex items-center justify-center flex-shrink-0 relative`}
                    >
                      {step.icon}
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-black text-xs flex items-center justify-center font-bold">
                        {step.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold">{step.title}</h3>
                      <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

                {/* Tournament Creation Section */}
                <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Create Tournaments</h2>
            <Button variant="ghost" className="text-gray-400 p-0 h-auto">
              Learn more <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden mb-4">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-full bg-[#FFD600]/20 flex items-center justify-center mb-3">
                <Trophy className="w-5 h-5 text-[#FFD600]" />
              </div>
              <h3 className="text-lg font-bold mb-1">Earn 18% From Entry Fees</h3>
              <p className="text-sm text-gray-400 mb-4">Design and host your own tournaments on Gamerholic</p>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFD600]/20 flex items-center justify-center">
                    <Layers className="w-3 h-3 text-[#FFD600]" />
                  </div>
                  <p className="text-xs text-gray-300">Custom tournament formats</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFD600]/20 flex items-center justify-center">
                    <Users className="w-3 h-3 text-[#FFD600]" />
                  </div>
                  <p className="text-xs text-gray-300">Automatic prize distribution</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFD600]/20 flex items-center justify-center">
                    <BarChart3 className="w-3 h-3 text-[#FFD600]" />
                  </div>
                  <p className="text-xs text-gray-300">Detailed tournament analytics</p>
                </div>
              </div>
              
              <Button className="w-full bg-[#FFD600] hover:bg-[#E6C200] text-black rounded-full">
                Create Tournament
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Stats Cards */}
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="w-8 h-8 rounded-full bg-[#00FFA9]/20 flex items-center justify-center mb-2">
                  <Trophy className="w-4 h-4 text-[#00FFA9]" />
                </div>
                <p className="text-xs text-gray-400">ACTIVE TOURNAMENTS</p>
                <p className="text-xl font-bold">3,245</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="w-8 h-8 rounded-full bg-[#FF007A]/20 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4 text-[#FF007A]" />
                </div>
                <p className="text-xs text-gray-400">ACTIVE PLAYERS</p>
                <p className="text-xl font-bold">12.5K</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Tournament */}
        {/* <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Featured Tournament</h2>
            <Button variant="ghost" className="text-gray-400 p-0 h-auto">
              See all <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
            <div className="relative">
              <Image
                src="/placeholder.svg?height=200&width=400&text=Tournament"
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
        </section> */}

        {/* Popular Games */}
        {/* <section className="mb-8">
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
        </section> */}
      

        {/* NFT Creation Section */}
        {/* <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">NFT Marketplace</h2>
            <Button variant="ghost" className="text-gray-400 p-0 h-auto">
              Explore <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
            <CardContent className="p-4">
              <h3 className="text-lg font-bold mb-1">Create & Sell Unique NFTs</h3>
              <p className="text-sm text-gray-400 mb-3">Design custom NFTs for your profile and more</p>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="relative rounded-lg overflow-hidden aspect-square">
                    <Image
                      src={`/placeholder.svg?height=100&width=100&text=NFT${item}`}
                      alt={`NFT Example ${item}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1">
                      <p className="text-[10px] font-bold text-[#00FFA9]">0.{item * 5} SOL</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#00FFA9]/20 flex items-center justify-center">
                    <Brain className="w-3 h-3 text-[#00FFA9]" />
                  </div>
                  <p className="text-xs text-gray-300">AI-powered NFT creation</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#00FFA9]/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-[#00FFA9]" />
                  </div>
                  <p className="text-xs text-gray-300">Zero gas fees for trading</p>
                </div>
              </div>
              
              <Button className="w-full bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full">
                Explore NFT Marketplace
              </Button>
            </CardContent>
          </Card>
        </section> */}

        
        
        {/* Upcoming Events */}
        {/* <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Upcoming Events</h2>
            <Button variant="ghost" className="text-gray-400 p-0 h-auto">
              Calendar <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Fortnite Championship",
                description: "Battle Royale • 100 Players",
                time: "Tomorrow, 8:00 PM",
                prize: "$5,000",
                icon: <Clock className="w-4 h-4 text-[#00FFA9]" />,
                iconBg: "bg-[#00FFA9]/20",
              },
              {
                title: "Call of Duty Tournament",
                description: "Team Deathmatch • 5v5",
                time: "Sat, 9:30 PM",
                prize: "$3,500",
                icon: <Award className="w-4 h-4 text-[#FF007A]" />,
                iconBg: "bg-[#FF007A]/20",
              },
              {
                title: "FIFA 23 World Cup",
                description: "1v1 • Knockout Format",
                time: "Sun, 7:00 PM",
                prize: "$2,000",
                icon: <Sparkles className="w-4 h-4 text-[#FFD600]" />,
                iconBg: "bg-[#FFD600]/20",
              },
            ].map((event, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${event.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      {event.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-medium">{event.title}</h3>
                        <span className="text-xs font-bold text-[#FFD600]">{event.prize}</span>
                      </div>
                      <p className="text-xs text-gray-400">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section> */}

        {/* Community Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Join Our Community</h2>
          </div>

          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
            <div className="relative">
              <Image
                src="/home/26.png?height=200&width=400&text=Community"
                alt="Community"
                width={400}
                height={200}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold mb-1">Connect With Gamers Worldwide</h3>
              <p className="text-sm text-gray-400 mb-4">Join our Discord and social channels to stay updated</p>

              <div className="grid grid-cols-2 gap-3">
                <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-full">Discord</Button>
                <Button className="w-full bg-[#1DA1F2] hover:bg-[#0D8ECF] text-white rounded-full">Twitter</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent Activity */}
        {/* <section>
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
        </section> */}

        {/* CTA Section */}
        <section className="mt-10 mb-8">
          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Ready to Start Your Journey?</h3>
              <p className="text-sm text-gray-400 mb-4">Connect your wallet and join the Gamerholic community today</p>
              <Button className="bg-gradient-to-r from-[#00FFA9] to-[#00D48F] hover:from-[#00D48F] hover:to-[#00C480] text-black font-bold py-3 px-6 rounded-full">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </section>
        <WalletConnectModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
      
      </main>
    </div>
  )
}


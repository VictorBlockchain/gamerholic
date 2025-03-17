import { Footer } from "@/components/layout/footer";
import { AccessibilityMenu } from "@/components/ui/accessibility-improvements";
import { useState, useRef, useEffect } from "react";
import { PageBackground } from "@/components/layout/page-background"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  Gamepad2,
  Zap,
  Brain,
  Users,
  ChevronRight,
  ArrowRight,
  Layers,
  BarChart3,
  Code,
  Star,
} from "lucide-react"

// Import the new components
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { NewsTicker } from "@/components/ui/news-ticker"
import { TestimonialCard } from "@/components/ui/testimonial-card"
import { FeaturedGameCard } from "@/components/ui/featured-game-card"
import { ButtonPressEffect, HoverGlow, PulseEffect } from "@/components/ui/micro-interactions"
export function HomeDesktop() {
  const [imagesLoaded, setImagesLoaded] = useState(false)
  // Ref for main content for skip link
  const mainContentRef = useRef<HTMLElement>(null)

  // Simulate image loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setImagesLoaded(true)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])
  
  // News ticker items
  const newsItems = [
    { id: 1, text: "New Tournament: Cyber Showdown with $10,000 prize pool", link: "/tournaments" },
    { id: 2, text: "AI Game Creation tools updated with new features", link: "#" },
    { id: 3, text: "Join our Discord community to connect with other players", link: "#" },
    { id: 4, text: "Weekly challenge: Create a racing game and win prizes", link: "#" },
    { id: 5, text: "Maintenance scheduled for tomorrow - 2 hours downtime", link: "#" },
  ]
  
  // Testimonials data
  const testimonials = [
    {
      quote:
        "Gamerholic revolutionized how I create games. The AI tools are incredible, and I've won three tournaments already!",
      author: {
        name: "Alex Chen",
        title: "Game Developer",
        avatarFallback: "AC",
      },
    },
    {
      quote:
        "I never thought I could create my own game without coding knowledge. Now I'm hosting tournaments with my creations!",
      author: {
        name: "Sarah Johnson",
        title: "Content Creator",
        avatarFallback: "SJ",
      },
    },
    {
      quote: "The competitive scene here is amazing. Fair tournaments, great prizes, and an awesome community.",
      author: {
        name: "Marcus Williams",
        title: "Pro Gamer",
        avatarFallback: "MW",
      },
    },
  ]

  const handlePlay = () => {
    window.location.href = "/grabbit"; 
   };
return (

    <>
          {/* Main Content */}
      <main id="main-content" ref={mainContentRef} className="relative z-10">
        {/* Hero Section */}
        <section className="pt-16 pb-24 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 lg:pr-8">
                <ScrollReveal direction="up" distance={20}>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF007A]/10 border border-[#FF007A]/20 text-[#FF007A] text-sm mb-6">
                    <Zap className="w-4 h-4 mr-2" />
                    NEXT-GEN GAMING PLATFORM
                  </div>

                  <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                    <span className="block">I <span className="text-[#00FFA9]">Win</span></span>
                    <span className="block">For A Living </span>

                  </h1>
                  
                  <p className="text-xl text-gray-400 mb-8 max-w-xl">
                    The first platform where you can create games using AI, compete head-to-head, and earn rewards in
                    crypto tournaments.
                  </p>
                </ScrollReveal>
                
                <ScrollReveal direction="up" distance={20} delay={200}>
                  <div className="flex flex-col sm:flex-row gap-4 mb-12">
                    <ButtonPressEffect>
                    <Link href="https://pump.fun/coin/A16i7fjFagzf2Ejezhc4xidcZ8J7utmLLQCqzZRWpump" target="_blank">
                        <Button
                          className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium px-8 py-7 h-auto rounded-full text-lg relative overflow-hidden group"
                        >
                          <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-500 ease-out group-hover:w-full"></span>
                          <span className="relative">
                            $GAMER
                          </span>
                        </Button>
                      </Link>
                    </ButtonPressEffect>
                    
                    <ButtonPressEffect>
                      <Link href="/tournaments">
                      <Button
                        variant="outline"
                        className="border-[#333] text-white hover:bg-white/5 px-8 py-7 h-auto rounded-full text-lg"
                      >
                        Browse Tournaments
                      </Button>
                      </Link>
                    </ButtonPressEffect>
                  </div>
                </ScrollReveal>
                
                {/* <ScrollReveal direction="up" distance={20} delay={400}>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">
                        <AnimatedCounter end={2.4} suffix="M" formatFn={(value) => value.toFixed(1)} />
                      </div>
                      <p className="text-gray-500 text-sm">PRIZE POOL</p>
                    </div>
                    <div className="h-12 w-px bg-gray-800"></div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">
                        <AnimatedCounter end={12} suffix="K+" />
                      </div>
                      <p className="text-gray-500 text-sm">PLAYERS</p>
                    </div>
                    <div className="h-12 w-px bg-gray-800"></div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">
                        <AnimatedCounter end={250} suffix="+" />
                      </div>
                      <p className="text-gray-500 text-sm">GAMES</p>
                    </div>
                  </div>
                </ScrollReveal> */}
              </div>
              
              <div className="lg:col-span-6 relative">
                <div className="absolute -inset-4 bg-[#00FFA9] opacity-30 blur-[100px] rounded-full animate-pulse-glow"></div>
                <div className="relative">
                  {/* Game Character Image */}
                  <div className="aspect-square max-w-[600px] mx-auto relative animate-float">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA9]/20 to-[#FF007A]/20 rounded-3xl"></div>
                    <div className="absolute inset-0 border border-[#333] rounded-3xl overflow-hidden">
                      <Image
                        src="/home/4.png?height=600&width=600"
                        alt="AI-generated game character"
                        width={600}
                        height={600}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${imagesLoaded ? "opacity-100" : "opacity-0"}`}
                        priority
                      />
                      {!imagesLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
                          <div className="w-12 h-12 rounded-full border-2 border-[#00FFA9] border-t-transparent animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Floating elements */}
                    {/* <HoverGlow>
                      <div className="absolute -top-6 -right-6 bg-black/80 backdrop-blur-md border border-[#333] rounded-xl p-4 shadow-lg">
                        <div className="flex items-center gap-3">
                          <Brain className="w-6 h-6 text-[#FF007A]" />
                          <div>
                            <p className="text-xs text-gray-400">AI GENERATED</p>
                            <p className="text-sm font-medium">Character Design</p>
                          </div>
                        </div>
                      </div>
                    </HoverGlow> */}
                    
                    {/* <HoverGlow glowColor="rgba(255, 0, 122, 0.3)">
                      <div className="absolute -bottom-6 -left-6 bg-black/80 backdrop-blur-md border border-[#333] rounded-xl p-4 shadow-lg">
                        <div className="flex items-center gap-3">
                          <Trophy className="w-6 h-6 text-[#00FFA9]" />
                          <div>
                            <p className="text-xs text-gray-400">TOURNAMENT READY</p>
                            <p className="text-sm font-medium">Compete Now</p>
                          </div>
                        </div>
                      </div>
                    </HoverGlow> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
          {/* Gamer Token Section */}
        <section className="py-24 bg-gradient-to-b from-black/0 to-black/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
              <div>
                <ScrollReveal direction="left">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600] text-sm mb-6">
                    <Zap className="w-4 h-4 mr-2" />
                    GAMER TOKEN
                  </div>

                  <h2 className="text-4xl md:text-5xl font-bold mb-6">Gaming Meme Token With Real Utility</h2>

                  <p className="text-xl text-gray-400 mb-8">
                    $GAMER isn't just another meme token. It powers the entire Gamerholic ecosystem, offering real
                    utility for gamers, creators, and tournament organizers.
                  </p>
                </ScrollReveal>

                <div className="space-y-6 mb-8">
                  {[
                    {
                      icon: <Gamepad2 className="w-5 h-5 text-[#FFD600]" />,
                      title: "FREE Tournaments",
                      description: "$GAMER holders are rewared with free tournaments & grabbit games to win Solana and other prizes.",
                    },
                    {
                      icon: <Trophy className="w-5 h-5 text-[#FFD600]" />,
                      title: "Merch Discounts",
                      description: "$GAMER holders are rewared with discounts on Gamerholic merchandise.",
                    },
                    {
                      icon: <Users className="w-5 h-5 text-[#FFD600]" />,
                      title: "NO Fee Heads Up Matches",
                      description: "$GAMER holders can challenge friends and rivals to head-to-head matches with no fees.",
                    },
                  ].map((feature, index) => (
                    <ScrollReveal key={index} direction="right" delay={index * 200} distance={30}>
                      <div className="flex gap-4 hover:bg-[#111] p-4 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#FFD600]/10 flex items-center justify-center flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                          <p className="text-gray-400">{feature.description}</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>

                <ScrollReveal direction="up" delay={600}>
                  <ButtonPressEffect>
                    <Link href="https://pump.fun/coin/A16i7fjFagzf2Ejezhc4xidcZ8J7utmLLQCqzZRWpump" target="_blank">
                    <Button className="bg-[#FFD600] hover:bg-[#E6C200] text-black font-medium px-8 py-6 h-auto rounded-full">
                      Buy $GAMER Token
                    </Button>
                    </Link>
                  </ButtonPressEffect>
                </ScrollReveal>
              </div>
              <ScrollReveal direction="right">
                <div className="relative">
                  <div className="absolute -inset-4  opacity-20 blur-[50px] rounded-full"></div>
                  <div className="relative b overflow-hidden">
                    <div className="aspect-[4/3] w-full relative">

                      {!imagesLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
                          <div className="w-12 h-12 rounded-full border-3 border-[#FFD600] border-t-transparent animate-spin"></div>
                        </div>
                      )}
                      
                      {/* Token overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-[#FFD600] to-[#FF9900] flex items-center justify-center animate-float">
                          <div className="absolute inset-1 rounded-full bg-black flex items-center justify-center">
                            <span className="text-4xl font-bold text-[#FFD600]">$GAMER</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
                
                {/* Esports Section */}
                <section className="py-24 bg-gradient-to-b from-black/0 to-black/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <ScrollReveal direction="left">
                <div className="relative">
                  <div className="absolute -inset-4 bg-[#FF007A] opacity-20 blur-[50px] rounded-full"></div>
                  <div className="relative bg-gradient-to-br from-black to-[#111] border border-[#333] rounded-3xl overflow-hidden">
                    <div className="aspect-[4/3] w-full relative">
                      <Image
                        src="/home/15.png?height=600&width=800&text=Esports"
                        alt="Esports Challenge"
                        width={800}
                        height={600}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${imagesLoaded ? "opacity-100" : "opacity-0"}`}
                      />
                      {!imagesLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
                          <div className="w-12 h-12 rounded-full border-2 border-[#FF007A] border-t-transparent animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <div>
                <ScrollReveal direction="right">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF007A]/10 border border-[#FF007A]/20 text-[#FF007A] text-sm mb-6">
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    ESPORTS CHALLENGES
                  </div>

                  <h2 className="text-4xl md:text-5xl font-bold mb-6">Challenge Friends Head-to-Head</h2>

                  <p className="text-xl text-gray-400 mb-8">
                    Play competitive matches against friends and rivals for Solana or GAMER tokens. Prove your skills
                    and earn crypto rewards with every victory.
                  </p>
                </ScrollReveal>

                <div className="space-y-6 mb-8">
                  {[
                    {
                      icon: <Trophy className="w-5 h-5 text-[#FF007A]" />,
                      title: "Stake & Win Crypto",
                      description:
                        "Put your SOL or GAMER tokens on the line and win your opponent's stake when you emerge victorious.",
                    },
                    {
                      icon: <Users className="w-5 h-5 text-[#FF007A]" />,
                      title: "Challenge Anyone",
                      description: "Send challenges to friends or find opponents in our global matchmaking system.",
                    },
                    {
                      icon: <BarChart3 className="w-5 h-5 text-[#FF007A]" />,
                      title: "Track Your Stats",
                      description: "Build your reputation with detailed performance stats and climb the leaderboards.",
                    },
                  ].map((feature, index) => (
                    <ScrollReveal key={index} direction="right" delay={index * 200} distance={30}>
                      <div className="flex gap-4 hover:bg-[#111] p-4 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#FF007A]/10 flex items-center justify-center flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                          <p className="text-gray-400">{feature.description}</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>

                <ScrollReveal direction="up" delay={600}>
                  <ButtonPressEffect>
                    <Link href="/esports" passHref>
                      <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium px-8 py-6 h-auto rounded-full">
                        Start Challenging
                      </Button>
                    </Link>
                  </ButtonPressEffect>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>
        
        {/* Tournament Creation Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600] text-sm mb-4">
                  <Trophy className="w-4 h-4 mr-2" />
                  TOURNAMENTS
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Create/Play Tournaments</h2>
                <p className="text-xl text-gray-400">
                  Design and host your own tournaments on Gamerholic. Set entry fees, prize pools, and earn 18% of all
                  entry fees as the tournament creator.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Layers className="w-8 h-8 text-[#FFD600]" />,
                  title: "Custom Formats",
                  description:
                    "Create single or double elimination brackets, round-robin, or custom tournament formats.",
                  color: "from-[#FFD600]/20 to-[#FFD600]/5",
                  border: "border-[#FFD600]/20",
                },
                {
                  icon: <Users className="w-8 h-8 text-[#FFD600]" />,
                  title: "Automatic Payouts",
                  description:
                    "Prize pools are automatically distributed to winners, while you earn 18% of all entry fees.",
                  color: "from-[#FFD600]/20 to-[#FFD600]/5",
                  border: "border-[#FFD600]/20",
                },
                {
                  icon: <BarChart3 className="w-8 h-8 text-[#FFD600]" />,
                  title: "Tournament Analytics",
                  description: "Track participation, viewership, and earnings with detailed analytics.",
                  color: "from-[#FFD600]/20 to-[#FFD600]/5",
                  border: "border-[#FFD600]/20",
                },
              ].map((feature, index) => (
                <ScrollReveal key={index} delay={index * 200}>
                  <div
                    className={`relative bg-gradient-to-b ${feature.color} p-8 rounded-3xl border ${feature.border} backdrop-blur-sm hover:scale-[1.02] transition-transform`}
                  >
                    <div className="mb-6">{feature.icon}</div>
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-gray-400 mb-6">{feature.description}</p>
                    <Link
                      href="/tournaments"
                      className="inline-flex items-center text-white font-medium hover:opacity-80 transition-opacity"
                    >
                      Learn more <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <div className="mt-12 text-center">
              <ScrollReveal>
                <ButtonPressEffect>
                  <Link href="/tournaments" passHref>
                    <Button className="bg-[#FFD600] hover:bg-[#E6C200] text-black font-medium px-8 py-6 h-auto rounded-full">
                      Create Tournament
                    </Button>
                  </Link>
                </ButtonPressEffect>
              </ScrollReveal>
            </div>
          </div>
        </section>
        {/* How It Works */}
        <section className="py-24 bg-gradient-to-b from-black/0 to-black/50">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-sm mb-4">
                  <Layers className="w-4 h-4 mr-2" />
                  Arcade Games
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Create Arcade Games w/Ai</h2>
                <p className="text-xl text-gray-400">
                  From idea to competition in minutes. Create, compete, and earn with Gamerholic's revolutionary
                  platform.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Brain className="w-8 h-8 text-[#FF007A]" />,
                  title: "Create with AI",
                  description:
                    "Use our AI tools to design characters, levels, and game mechanics without coding knowledge.",
                  color: "from-[#FF007A]/20 to-[#FF007A]/5",
                  border: "border-[#FF007A]/20",
                  number: "01",
                },
                {
                  icon: <Gamepad2 className="w-8 h-8 text-[#00FFA9]" />,
                  title: "Test & Refine",
                  description:
                    "Play your creation, gather feedback, and let AI help you refine your game for competitive play.",
                  color: "from-[#00FFA9]/20 to-[#00FFA9]/5",
                  border: "border-[#00FFA9]/20",
                  number: "02",
                },
                {
                  icon: <Trophy className="w-8 h-8 text-[#FFD600]" />,
                  title: "Compete & Earn",
                  description: "Enter tournaments, challenge players head-to-head, and win cryptocurrency rewards.",
                  color: "from-[#FFD600]/20 to-[#FFD600]/5",
                  border: "border-[#FFD600]/20",
                  number: "03",
                },
              ].map((step, index) => (
                <ScrollReveal key={index} delay={index * 200}>
                  <div
                    className={`relative bg-gradient-to-b ${step.color} p-8 rounded-3xl border ${step.border} backdrop-blur-sm hover:scale-[1.02] transition-transform`}
                  >
                    <div className="absolute top-6 right-6 text-4xl font-bold opacity-20">{step.number}</div>
                    <div className="mb-6">{step.icon}</div>
                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                    <p className="text-gray-400 mb-6">{step.description}</p>
                    <Link
                      href="#"
                      className="inline-flex items-center text-white font-medium hover:opacity-80 transition-opacity"
                    >
                      Learn more <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
        
        {/* AI Game Creation */}
        {/* <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <ScrollReveal direction="left">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00FFA9]/10 border border-[#00FFA9]/20 text-[#00FFA9] text-sm mb-6">
                    <Brain className="w-4 h-4 mr-2" />
                    AI GAME CREATION
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">Design Games with AI, No Coding Required</h2>
                  
                  <p className="text-xl text-gray-400 mb-8">
                    Our revolutionary AI tools make game creation accessible to everyone. Design characters, build
                    worlds, and create gameplay mechanics with simple prompts.
                  </p>
                </ScrollReveal>
                
                <div className="space-y-6 mb-8">
                  {[
                    {
                      icon: <Code className="w-5 h-5 text-[#00FFA9]" />,
                      title: "AI-Generated Code",
                      description:
                        "Turn your ideas into functional game mechanics without writing a single line of code.",
                    },
                    {
                      icon: <Layers className="w-5 h-5 text-[#00FFA9]" />,
                      title: "Character & World Design",
                      description: "Create unique characters and immersive worlds with simple text prompts.",
                    },
                    {
                      icon: <BarChart3 className="w-5 h-5 text-[#00FFA9]" />,
                      title: "Balance & Optimization",
                      description: "AI helps balance your game for fair and engaging competitive play.",
                    },
                  ].map((feature, index) => (
                    <ScrollReveal key={index} direction="left" delay={index * 200} distance={30}>
                      <div className="flex gap-4 hover:bg-[#111] p-4 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#00FFA9]/10 flex items-center justify-center flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                          <p className="text-gray-400">{feature.description}</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
                
                <ScrollReveal direction="up" delay={600}>
                  <ButtonPressEffect>
                    <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium px-8 py-6 h-auto rounded-full">
                      Start Creating Now
                    </Button>
                  </ButtonPressEffect>
                </ScrollReveal>
              </div>
              
              <ScrollReveal direction="right">
                <div className="relative">
                  <div className="absolute -inset-4 bg-[#00FFA9] opacity-20 blur-[50px] rounded-full"></div>
                  <div className="relative bg-gradient-to-br from-black to-[#111] border border-[#333] rounded-3xl overflow-hidden">
                    <div className="aspect-[4/3] w-full relative">
                      <Image
                        src="/placeholder.svg?height=600&width=800"
                        alt="AI Game Creation Interface"
                        width={800}
                        height={600}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${imagesLoaded ? "opacity-100" : "opacity-0"}`}
                      />
                      {!imagesLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
                          <div className="w-12 h-12 rounded-full border-2 border-[#00FFA9] border-t-transparent animate-spin"></div>
                        </div>
                      )}

                      {/* UI Overlay elements */}
                      {/* <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                        <div className="mb-4">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00FFA9]/20 border border-[#00FFA9]/30 text-[#00FFA9] text-xs mb-2">
                            <Zap className="w-3 h-3 mr-1" />
                            AI GENERATING
                          </div>
                          <div className="h-2 bg-[#222] rounded-full overflow-hidden w-full max-w-md">
                            <div className="h-full bg-[#00FFA9] w-2/3 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#00FFA9]/20 border border-[#00FFA9]/30 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-[#00FFA9]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-400">AI PROMPT</p>
                            <p className="text-white font-medium">
                              Create a sci-fi character with glowing armor and energy weapons
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section> */}

        {/* Featured Game of the Week */}
        <section className="py-24 bg-gradient-to-b from-black/0 to-black/50">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600] text-sm mb-4">
                  <Star className="w-4 h-4 mr-2" />
                  FEATURED GAME
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">GRABBIT!!!</h2>
                <p className="text-xl text-gray-400">
                  A Fun, Fast Paced Game To Win Awesome Prizes
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="max-w-4xl mx-auto">
                <FeaturedGameCard
                  title="Grabbit"
                  description="Grab, Slap, Or Sneak your way to victory in this fast paced game. Win Solana and other prizes."
                  image="/home/18.png?height=600&width=1000"
                  creator="Gamerholic"
                  rating={4.8}
                  players="3 players"
                  tags={["Multiplayer"]}
                  onPlay={() => {handlePlay}}
                />
              </div>
            </ScrollReveal>
          </div>
        </section>
        
        {/* Live Tournaments */}
        {/* <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
              <ScrollReveal direction="left">
                <div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF007A]/10 border border-[#FF007A]/20 text-[#FF007A] text-sm mb-6">
                    <Trophy className="w-4 h-4 mr-2" />
                    LIVE TOURNAMENTS
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold">Compete & Win Crypto</h2>
                </div>
              </ScrollReveal>
              
              <ScrollReveal direction="right">
                <ButtonPressEffect>
                  <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                    View All Tournaments <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </ButtonPressEffect>
              </ScrollReveal>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Cyber Showdown",
                  game: "FPS Arena",
                  prize: "$10,000",
                  players: "128/128",
                  image: "/placeholder.svg?height=300&width=500",
                  status: "LIVE",
                  statusColor: "bg-[#00FFA9]",
                  timeLeft: "02:45:33",
                },
                {
                  title: "Neon Racers",
                  game: "Racing",
                  prize: "$5,000",
                  players: "64/128",
                  image: "/placeholder.svg?height=300&width=500",
                  status: "REGISTERING",
                  statusColor: "bg-[#FF007A]",
                  timeLeft: "23:45:12",
                },
                {
                  title: "Mystic Battles",
                  game: "Strategy",
                  prize: "$15,000",
                  players: "32/64",
                  image: "/placeholder.svg?height=300&width=500",
                  status: "UPCOMING",
                  statusColor: "bg-[#FFD600]",
                  timeLeft: "3d 12:30:00",
                },
              ].map((tournament, index) => (
                <ScrollReveal key={index} delay={index * 150} direction="up" distance={40}>
                  <HoverGlow>
                    <div className="group relative bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-3xl overflow-hidden transition-all">
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                      <Image
                        src={tournament.image || "/placeholder.svg"}
                        alt={tournament.title}
                        width={500}
                        height={300}
                        className={`w-full aspect-[5/3] object-cover transition-transform group-hover:scale-105 duration-500 ${imagesLoaded ? "opacity-100" : "opacity-0"}`}
                      />
                      {!imagesLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#111] z-20">
                          <div className="w-12 h-12 rounded-full border-2 border-[#00FFA9] border-t-transparent animate-spin"></div>
                        </div>
                      )}
                      
                      <div className="absolute top-4 right-4 z-20">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold ${tournament.statusColor} text-black`}
                        >
                          {tournament.status}
                        </div>
                      </div>
                      
                      <div className="relative z-20 p-6">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-400">{tournament.game}</p>
                          <div className="flex items-center text-sm">
                            <Users className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="text-gray-400">{tournament.players}</span>
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-4">{tournament.title}</h3>
                        
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <p className="text-xs text-gray-400">PRIZE POOL</p>
                            <p className="text-xl font-bold text-[#FFD600]">{tournament.prize}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              {tournament.status === "LIVE" ? "ENDS IN" : "STARTS IN"}
                            </p>
                            <p className="text-sm font-mono">{tournament.timeLeft}</p>
                          </div>
                        </div>

                        <ButtonPressEffect>
                          <Button
                            className={`w-full rounded-full ${
                              tournament.status === "LIVE"
                                ? "bg-[#00FFA9] hover:bg-[#00D48F] text-black"
                                : tournament.status === "REGISTERING"
                                  ? "bg-[#FF007A] hover:bg-[#D60067] text-white"
                                  : "bg-[#333] hover:bg-[#444] text-white"
                            }`}
                          >
                            {tournament.status === "LIVE"
                              ? "Join Now"
                              : tournament.status === "REGISTERING"
                                ? "Register"
                                : "Reminder"}
                          </Button>
                        </ButtonPressEffect>
                      </div>
                    </div>
                  </HoverGlow>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section> */}
        
        {/* Testimonials */}
        <section className="py-24 bg-gradient-to-b from-black/0 to-black/50">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-sm mb-4">
                  <Users className="w-4 h-4 mr-2" />
                  TESTIMONIALS
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">What A Gamers Saying</h2>
                <p className="text-xl text-gray-400">
                  Join the most epic crypto gaming community and start earning rewards today.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <ScrollReveal key={index} delay={index * 150}>
                  <TestimonialCard quote={testimonial.quote} author={testimonial.author} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="relative rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA9]/30 to-[#FF007A]/30 opacity-50"></div>
                <div className="absolute inset-0 bg-[url('/home/21.png?height=600&width=1200')] bg-cover bg-center mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>

                <div className="relative p-8 md:p-16">
                  <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to Revolutionize Gaming?</h2>
                    <p className="text-xl text-gray-300 mb-10">
                      Join Gamerholic today and be part of the future of gaming. Create with AI, compete with players
                      worldwide, and earn crypto rewards.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <ButtonPressEffect>
                        <PulseEffect pulseColor="rgba(255, 255, 255, 0.2)" pulseSize={1.05}>
                          <Button className="bg-white hover:bg-gray-100 text-black font-medium px-8 py-6 h-auto rounded-full text-lg relative overflow-hidden group">
                            <span className="absolute inset-0 w-0 bg-gradient-to-r from-[#00FFA9]/20 to-transparent group-hover:w-full transition-all duration-700"></span>
                            <span className="relative">Get Started Now</span>
                          </Button>
                        </PulseEffect>
                      </ButtonPressEffect>
                      
                      {/* <ButtonPressEffect> */}
                        {/* <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 px-8 py-6 h-auto rounded-full text-lg"
                        >
                          Watch Demo
                        </Button> */}
                      {/* </ButtonPressEffect> */}
                    </div>
                    <p className="mt-8 text-sm text-gray-400">
                      chalenge your friends or create your tournament
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </>
)
}
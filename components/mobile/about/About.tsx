import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { MobileNavigation } from "@/components/mobile/mobile-navigation"
import { MobileFooter } from "@/components/mobile/mobile-footer"
import { PageBackground } from "@/components/layout/page-background"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { FloatingElements } from "@/components/ui/floating-elements"
import {
  Brain,
  Gamepad2,
  HeartHandshake,
  Zap,
  ChevronRight,
  Users,
  Globe,
  Code,
  ExternalLink,
  Trophy,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import Link from "next/link"

export function AboutMobile() {
    const router = useRouter()
    const isMobile = useMobile()
    const [activeTab, setActiveTab] = useState("home")
    const [scrolled, setScrolled] = useState(false)
    const [expandedSection, setExpandedSection] = useState<string | null>(null)
  
    // Handle scroll for header styling
    useEffect(() => {
      const handleScroll = () => {
        setScrolled(window.scrollY > 10)
      }
  
      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }, [])
  
    const toggleSection = (section: string) => {
      if (expandedSection === section) {
        setExpandedSection(null)
      } else {
        setExpandedSection(section)
      }
    }
    return(
        <>
               <main className="container mx-auto px-4 pt-20 pb-4 relative z-10">
        {/* Hero Section */}
        <section className="mb-8">
          <ScrollReveal>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00FFA9]/10 border border-[#00FFA9]/20 text-[#00FFA9] text-sm mb-4">
              <Zap className="w-4 h-4 mr-2" />
              ABOUT US
            </div>
            <h1 className="text-2xl font-bold mb-2">Revolutionizing Gaming with AI & Blockchain</h1>
            <p className="text-gray-400 text-sm mb-6">
              We're building the future of gaming where players can create, compete, and earn in a decentralized
              ecosystem.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="relative rounded-xl overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA9]/30 to-[#FF007A]/30 opacity-50"></div>
              <Image
                src="/about/2.png?height=300&width=600"
                alt="Gamerholic Team"
                width={600}
                height={300}
                className="w-full object-cover rounded-xl"
              />
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <div className="grid grid-cols-1 gap-4 mb-8">
              <Card
                className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl overflow-hidden"
                onClick={() => toggleSection("mission")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#00FFA9]/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-[#00FFA9]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Our Mission</h3>
                      {expandedSection === "mission" && (
                        <p className="text-sm text-gray-400 mt-2">
                          To democratize game creation and empower players to earn through their skills and creativity
                          in a fair, transparent ecosystem.
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      className={`ml-auto w-5 h-5 transition-transform ${expandedSection === "mission" ? "rotate-90" : ""}`}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl overflow-hidden"
                onClick={() => toggleSection("vision")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF007A]/20 flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-[#FF007A]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Our Vision</h3>
                      {expandedSection === "vision" && (
                        <p className="text-sm text-gray-400 mt-2">
                          A world where anyone can create professional-quality games and build sustainable careers
                          through competitive gaming.
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      className={`ml-auto w-5 h-5 transition-transform ${expandedSection === "vision" ? "rotate-90" : ""}`}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl overflow-hidden"
                onClick={() => toggleSection("values")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FFD600]/20 flex items-center justify-center">
                      <HeartHandshake className="w-5 h-5 text-[#FFD600]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Our Values</h3>
                      {expandedSection === "values" && (
                        <p className="text-sm text-gray-400 mt-2">
                          Innovation, inclusivity, transparency, and player-first thinking guide everything we do at
                          Gamerholic.
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      className={`ml-auto w-5 h-5 transition-transform ${expandedSection === "values" ? "rotate-90" : ""}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </section>

        {/* Our Story */}
        <section className="mb-8">
          <ScrollReveal>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF007A]/10 border border-[#FF007A]/20 text-[#FF007A] text-sm mb-4">
              <Zap className="w-4 h-4 mr-2" />
              OUR STORY
            </div>
            <h2 className="text-xl font-bold mb-2">From Gamers to Innovators</h2>
            <p className="text-gray-400 text-sm mb-6">
            Gamerholic was the 1st crypto currency for video games launched in 2014. Too early for blockchain and gaming. 
                Now a team of passionate gamers, developers, and blockchain enthusiasts, we are dedicated to pushing the boundaries of what's possible in the gaming industry.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-[#FF007A] opacity-20 blur-[50px] rounded-full"></div>
              <div className="relative bg-gradient-to-br from-black to-[#111] border border-[#333] rounded-xl overflow-hidden">
                <Image
                  src="/about/3.png?height=300&width=300"
                  alt="Gamerholic Founders"
                  width={300}
                  height={300}
                  className="w-full object-cover"
                />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF007A]/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-[#FF007A]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1">The Problems</h3>
                  <p className="text-xs text-gray-400">
                      1. Esports needs low barrier of entry tournaments.<br/>
                      2. Game development was inaccessible to most, requiring specialized skills and significant resources.<br/>
                      3. Games created with Ai, need monetization.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF007A]/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-[#FF007A]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1">The Insight</h3>
                  <p className="text-xs text-gray-400">
                      Crypto currency would reward holders of a token, with free entry tournaments.
                      AI could democratize game creation, while blockchain could provide fair compensation for creators
                      and players.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF007A]/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-[#FF007A]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1">The Solution</h3>
                  <p className="text-xs text-gray-400">
                    Gamerholic: a platform where anyone can create games with AI and earn through competitive play.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <ButtonPressEffect>
              <Button className="w-full bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full">
                Join Our Community
              </Button>
            </ButtonPressEffect>
          </ScrollReveal>
        </section>
        
        {/* Our Team */}
        {/* <section className="mb-8">
          <ScrollReveal>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00FFA9]/10 border border-[#00FFA9]/20 text-[#00FFA9] text-sm mb-4">
              <Users className="w-4 h-4 mr-2" />
              OUR TEAM
            </div>
            <h2 className="text-xl font-bold mb-2">Meet the Innovators</h2>
            <p className="text-gray-400 text-sm mb-6">
              Our diverse team of experts is passionate about creating the future of gaming.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-4 scrollbar-hide">
              {[
                {
                  name: "Ibrahym Bapa",
                  role: "Founder & CEO",
                  image: "/placeholder.svg?height=150&width=150",
                  bio: "Global thought leader in blockchain technology",
                },
                {
                  name: "Shakir Contractor",
                  role: "COO",
                  image: "/placeholder.svg?height=150&width=150",
                  bio: "AI researcher and blockchain expert with a passion for gaming.",
                }
              ].map((member, index) => (
                <div key={index} className="flex-shrink-0 w-40">
                  <Card className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-square">
                        <Image
                          src={member.image || "/placeholder.svg"}
                          alt={member.name}
                          width={160}
                          height={160}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-bold mb-1">{member.name}</h3>
                        <p className="text-[#00FFA9] text-xs mb-2">{member.role}</p>
                        <p className="text-gray-400 text-xs line-clamp-3">{member.bio}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section> */}

        {/* Our Technology */}
        <section className="mb-8">
          <ScrollReveal>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00FFA9]/10 border border-[#00FFA9]/20 text-[#00FFA9] text-sm mb-4">
              <Code className="w-4 h-4 mr-2" />
              OUR TECHNOLOGY
            </div>
            <h2 className="text-xl font-bold mb-2">Cutting-Edge Innovation</h2>
            <p className="text-gray-400 text-sm mb-6">
              Our platform combines the latest advancements in artificial intelligence and blockchain technology to
              create a seamless gaming experience.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00FFA9]/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-[#00FFA9]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1">AI Game Creation</h3>
                  <p className="text-xs text-gray-400">
                    Our proprietary AI models can generate game assets, mechanics, and code from simple text prompts.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00FFA9]/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-[#00FFA9]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1">Solana Blockchain</h3>
                  <p className="text-xs text-gray-400">
                    Fast, low-cost transactions enable seamless in-game economies and fair reward distribution.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00FFA9]/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-[#00FFA9]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1">Tournament Engine</h3>
                  <p className="text-xs text-gray-400">
                    Advanced matchmaking and tournament management system for competitive play.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* <ScrollReveal delay={200}>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="w-8 h-8 rounded-full bg-[#00FFA9]/20 flex items-center justify-center mb-2 mx-auto">
                    <Brain className="w-4 h-4 text-[#00FFA9]" />
                  </div>
                  <p className="text-center text-xs">
                    <AnimatedCounter end={250} suffix="+" />
                  </p>
                  <p className="text-center text-[10px] text-gray-400">AI GAMES</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF007A]/20 flex items-center justify-center mb-2 mx-auto">
                    <Trophy className="w-4 h-4 text-[#FF007A]" />
                  </div>
                  <p className="text-center text-xs">
                    <AnimatedCounter end={120} suffix="+" />
                  </p>
                  <p className="text-center text-[10px] text-gray-400">TOURNAMENTS</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFD600]/20 flex items-center justify-center mb-2 mx-auto">
                    <Users className="w-4 h-4 text-[#FFD600]" />
                  </div>
                  <p className="text-center text-xs">
                    <AnimatedCounter end={12} suffix="k+" />
                  </p>
                  <p className="text-center text-[10px] text-gray-400">USERS</p>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal> */}
        </section>

        {/* CTA Section */}
        <section className="mb-8">
          <ScrollReveal>
            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA9]/30 to-[#FF007A]/30 opacity-50"></div>
              <div className="absolute inset-0 bg-[url('/home/20.png?height=300&width=600')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              
              <div className="relative p-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-3">Join the Revolution</h2>
                  <p className="text-sm text-gray-300 mb-6">
                    Be part of the future of gaming. Create, compete, and earn with Gamerholic.
                  </p>
                  <div className="flex flex-col gap-3">
                    <ButtonPressEffect>
                      <Button className="bg-white hover:bg-gray-100 text-black font-medium rounded-full">
                        Get Started Now
                      </Button>
                    </ButtonPressEffect>
                    <ButtonPressEffect>
                    <Link href="https://x.com/gamerholic_sol" target="_blank">
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 px-8 py-6 h-auto rounded-full text-lg"
                      >
                        Contact Us
                      </Button>
                    </Link>
                    </ButtonPressEffect>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Partners */}
        {/* <section className="mb-8">
          <ScrollReveal>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600] text-sm mb-4">
              <HeartHandshake className="w-4 h-4 mr-2" />
              PARTNERS
            </div>
            <h2 className="text-xl font-bold mb-2">Backed by the Best</h2>
            <p className="text-gray-400 text-sm mb-6">
              We're proud to partner with leading companies in gaming, blockchain, and AI.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6].map((partner) => (
                <div
                  key={partner}
                  className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-lg p-3 flex items-center justify-center hover:border-[#555] transition-all"
                >
                  <Image
                    src={`/placeholder.svg?height=60&width=60&text=Partner${partner}`}
                    alt={`Partner ${partner}`}
                    width={60}
                    height={60}
                    className="max-h-10 w-auto opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <ButtonPressEffect>
              <Button variant="outline" className="w-full border-[#333] text-white hover:bg-white/5 rounded-full">
                View All Partners <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </ButtonPressEffect>
          </ScrollReveal>
        </section> */}
      </main>    
        </>
    )
}

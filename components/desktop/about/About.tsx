"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageBackground } from "@/components/layout/page-background"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, ChevronRight, Code, Gamepad2, Globe, HeartHandshake, Layers, Trophy, Users, Zap } from "lucide-react"
import Link from "next/link"

export function AboutDesktop() {
    
    return(
        <>
                 <section className="relative z-10 pt-16 pb-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00FFA9]/10 border border-[#00FFA9]/20 text-[#00FFA9] text-sm mb-4">
              <Zap className="w-4 h-4 mr-2" />
              ABOUT US
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Revolutionizing Gaming with Esports, AI & Blockchain</h1>
            <p className="text-xl text-gray-400">
              We're building the future of gaming where players can create, compete, and earn in a decentralized
              ecosystem.
            </p>
          </div>
          
          <div className="relative rounded-3xl overflow-hidden mb-16">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA9]/30 to-[#FF007A]/30 opacity-50"></div>
            <Image
              src="/about/2.png?height=600&width=1200"
              alt="Gamerholic Team"
              width={1200}
              height={600}
              className="w-full object-cover rounded-3xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-3xl p-8">
              <div className="w-12 h-12 rounded-lg bg-[#00FFA9]/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-[#00FFA9]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-gray-400">
                To democratize game creation and empower players to earn through their skills and creativity in a fair,
                transparent ecosystem.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-3xl p-8">
              <div className="w-12 h-12 rounded-lg bg-[#FF007A]/20 flex items-center justify-center mb-4">
                <Gamepad2 className="w-6 h-6 text-[#FF007A]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-gray-400">
                A world where anyone can create professional-quality games and build sustainable careers through
                competitive gaming.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-3xl p-8">
              <div className="w-12 h-12 rounded-lg bg-[#FFD600]/20 flex items-center justify-center mb-4">
                <HeartHandshake className="w-6 h-6 text-[#FFD600]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Values</h3>
              <p className="text-gray-400">
                Innovation, inclusivity, transparency, and player-first thinking guide everything we do at Gamerholic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-black/0 to-black/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF007A]/10 border border-[#FF007A]/20 text-[#FF007A] text-sm mb-6">
                <Layers className="w-4 h-4 mr-2" />
                OUR STORY
              </div>

              <h2 className="text-4xl font-bold mb-6">From Gamers to Innovators</h2>

              <p className="text-xl text-gray-400 mb-8">
                Gamerholic was the 1st crypto currency for video games launched in 2014. Too early for blockchain and gaming. 
                Now a team of passionate gamers, developers, and blockchain enthusiasts, we are dedicated to pushing the boundaries of what's possible in the gaming industry.
                .
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FF007A]/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-[#FF007A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">The Problems</h3>
                    <p className="text-gray-400">
                      1. Esports needs low barrier of entry tournaments.<br/>
                      2. Game development was inaccessible to most, requiring specialized skills and significant resources.<br/>
                      3. Games created with Ai, need monetization.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FF007A]/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-[#FF007A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">The Insight</h3>
                    <p className="text-gray-400">
                      Crypto currency would reward holders of a token, with free entry tournaments.
                      AI could democratize game creation, while blockchain could provide fair compensation for creators
                      and players.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FF007A]/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-[#FF007A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">The Solution</h3>
                    <p className="text-gray-400">
                      Gamerholic: a platform where anyone can create games with AI and earn through competitive play.
                    </p>
                  </div>
                </div>
              </div>

              <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium px-8 py-6 h-auto rounded-full">
                Join Our Community
              </Button>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-[#FF007A] opacity-20 blur-[50px] rounded-full"></div>
              <div className="relative bg-gradient-to-br from-black to-[#111] border border-[#333] rounded-3xl overflow-hidden">
                <Image
                  src="/about/3.png?height=600&width=600"
                  alt="Gamerholic Founders"
                  width={600}
                  height={600}
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Team */}
      {/* <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00FFA9]/10 border border-[#00FFA9]/20 text-[#00FFA9] text-sm mb-4">
              <Users className="w-4 h-4 mr-2" />
              OUR TEAM
            </div>
            <h2 className="text-4xl font-bold mb-6">Meet the Innovators</h2>
            <p className="text-xl text-gray-400">
              Our diverse team of experts is passionate about creating the future of gaming.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                name: "Alex Chen",
                role: "Founder & CEO",
                image: "/placeholder.svg?height=300&width=300",
                bio: "Former game developer with 10+ years of experience in the industry.",
              },
              {
                name: "Sarah Johnson",
                role: "CTO",
                image: "/placeholder.svg?height=300&width=300",
                bio: "AI researcher and blockchain expert with a passion for gaming.",
              },
              {
                name: "Marcus Williams",
                role: "Head of Game Design",
                image: "/placeholder.svg?height=300&width=300",
                bio: "Award-winning game designer with experience at major studios.",
              },
              {
                name: "Zoe Garcia",
                role: "Community Lead",
                image: "/placeholder.svg?height=300&width=300",
                bio: "Former esports champion and community builder.",
              },
            ].map((member, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-3xl overflow-hidden hover:border-[#555] transition-all"
              >
                <CardContent className="p-0">
                  <div className="aspect-square">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-[#00FFA9] text-sm mb-3">{member.role}</p>
                    <p className="text-gray-400 text-sm">{member.bio}</p>
                    <div className="flex gap-3 mt-4">
                      <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                        </svg>
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full px-8">
              View Full Team <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section> */}

      {/* Our Technology */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-black/0 to-black/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 bg-[#00FFA9] opacity-20 blur-[50px] rounded-full"></div>
              <div className="relative bg-gradient-to-br from-black to-[#111] border border-[#333] rounded-3xl overflow-hidden">
                <Image
                  src="/about/12.png?height=600&width=600"
                  alt="Gamerholic Technology"
                  width={600}
                  height={600}
                  className="w-full object-cover"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00FFA9]/10 border border-[#00FFA9]/20 text-[#00FFA9] text-sm mb-6">
                <Code className="w-4 h-4 mr-2" />
                OUR TECHNOLOGY
              </div>

              <h2 className="text-4xl font-bold mb-6">Cutting-Edge Innovation</h2>

              <p className="text-xl text-gray-400 mb-8">
                Our platform combines the latest advancements in artificial intelligence and blockchain technology to
                create a seamless gaming experience.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#00FFA9]/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-[#00FFA9]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">AI Game Creation</h3>
                    <p className="text-gray-400">
                      Our proprietary AI models can generate game assets, mechanics, and code from simple text prompts.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#00FFA9]/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-[#00FFA9]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Solana Blockchain</h3>
                    <p className="text-gray-400">
                      Fast, low-cost transactions enable seamless in-game economies and fair reward distribution.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#00FFA9]/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-[#00FFA9]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Tournament Engine</h3>
                    <p className="text-gray-400">
                      Advanced matchmaking and tournament management system for competitive play.
                    </p>
                  </div>
                </div>
              </div>

              <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium px-8 py-6 h-auto rounded-full">
                Explore Our Tech
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partners & Investors */}
      {/* <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600] text-sm mb-4">
              <HeartHandshake className="w-4 h-4 mr-2" />
              PARTNERS & INVESTORS
            </div>
            <h2 className="text-4xl font-bold mb-6">Backed by the Best</h2>
            <p className="text-xl text-gray-400">
              We're proud to partner with leading companies and investors in gaming, blockchain, and AI.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((partner) => (
              <div
                key={partner}
                className="bg-gradient-to-br from-[#111] to-black border border-[#333] rounded-xl p-6 flex items-center justify-center hover:border-[#555] transition-all"
              >
                <Image
                  src={`/placeholder.svg?height=80&width=160`}
                  alt={`Partner ${partner}`}
                  width={160}
                  height={80}
                  className="max-h-16 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      </section> */}
      
      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA9]/30 to-[#FF007A]/30 opacity-50"></div>
            <div className="absolute inset-0 bg-[url('/home/20.png?height=600&width=1200')] bg-cover bg-center mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
            
            <div className="relative p-8 md:p-16">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-4xl md:text-6xl font-bold mb-6">Join the Revolution</h2>
                <p className="text-xl text-gray-300 mb-10">
                  Be part of the future of gaming. Create, compete, and earn with Gamerholic.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-white hover:bg-gray-100 text-black font-medium px-8 py-6 h-auto rounded-full text-lg">
                    Get Started Now
                  </Button>
                  <Link href="https://x.com/gamerholic_sol" target="_blank">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 px-8 py-6 h-auto rounded-full text-lg"
                  >
                    Contact Us
                  </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
        </>
    )
}


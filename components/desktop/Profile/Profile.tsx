"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageBackground } from "@/components/layout/page-background"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Brain, ChevronRight, Edit, ExternalLink, Gamepad2, Trophy, Users } from "lucide-react"

export function ProfileDesktop() {

return(
    <>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden mb-8">
            <Image
              src="/placeholder.svg?height=400&width=1200"
              alt="Profile Cover"
              width={1200}
              height={400}
              className="w-full h-full object-cover"
            />
            <Button className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm border border-white/10 hover:bg-black/70 text-white rounded-full">
              <Edit className="w-4 h-4 mr-2" /> Edit Cover
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative -mt-20 md:-mt-24">
              <div className="absolute -inset-2 bg-[#00FFA9] opacity-30 blur-md rounded-full"></div>
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-[#0A0A0A] relative">
                <AvatarImage src="/placeholder.svg?height=160&width=160" alt="@username" />
                <AvatarFallback className="bg-[#222] text-2xl">JD</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-bold">John Doe</h1>
                    <Badge className="bg-[#FFD600] text-black">PRO</Badge>
                  </div>
                  <p className="text-gray-400">@johndoe</p>
                </div>

                <div className="flex gap-3">
                  <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
                    <Edit className="w-4 h-4 mr-2" /> Edit Profile
                  </Button>
                  <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                    <ExternalLink className="w-4 h-4 mr-2" /> Share
                  </Button>
                </div>
              </div>

              <p className="text-gray-300 mt-4 max-w-2xl">
                Professional gamer and AI game creator. Specializing in FPS and racing games. Tournament champion with
                over $10k in earnings. Let's connect and play together!
              </p>

              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">2.4k Followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">24 Tournaments Won</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">12 Games Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">AI Creator Level 8</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-400">TOTAL EARNINGS</h3>
                <Trophy className="w-5 h-5 text-[#FFD600]" />
              </div>
              <p className="text-3xl font-bold text-white">$12,450</p>
              <p className="text-sm text-[#00FFA9]">+$1,250 this month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-400">WIN RATE</h3>
                <Gamepad2 className="w-5 h-5 text-[#00FFA9]" />
              </div>
              <p className="text-3xl font-bold text-white">68%</p>
              <p className="text-sm text-[#00FFA9]">+2% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-400">GAMES PLAYED</h3>
                <Users className="w-5 h-5 text-[#FF007A]" />
              </div>
              <p className="text-3xl font-bold text-white">248</p>
              <p className="text-sm text-[#00FFA9]">+32 this month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-400">TOURNAMENT RANK</h3>
                <Trophy className="w-5 h-5 text-[#FFD600]" />
              </div>
              <p className="text-3xl font-bold text-white">Diamond</p>
              <p className="text-sm text-[#00FFA9]">Top 5% of players</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid grid-cols-5 mb-8 bg-[#111] border border-[#333] rounded-full p-1">
            <TabsTrigger
              value="games"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              My Games
            </TabsTrigger>
            <TabsTrigger
              value="tournaments"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Tournaments
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Achievements
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Wallet
            </TabsTrigger>
          </TabsList>

          {/* My Games Tab */}
          <TabsContent value="games" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Created Games</h2>
              <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
                <Brain className="mr-2 h-4 w-4" /> Create New Game
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((game) => (
                <Card
                  key={game}
                  className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden hover:border-[#555] transition-all"
                >
                  <div className="aspect-[3/2] relative">
                    <Image
                      src={`/placeholder.svg?height=300&width=450`}
                      alt={`Game ${game}`}
                      width={450}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/10 px-2 py-1 rounded-full flex items-center">
                        <Brain className="w-3 h-3 mr-1 text-[#00FFA9]" />
                        AI CREATED
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <Badge className="bg-[#222] text-gray-300 hover:bg-[#333] rounded-full">Racing</Badge>
                      <div className="flex items-center text-sm text-gray-400">
                        <Users className="w-3 h-3 mr-1" />
                        <span>2.4k</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Neon Drift {game}</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      High-speed racing through a cyberpunk city with AI-generated tracks.
                    </p>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-[#333] text-white hover:bg-white/5 rounded-full"
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full px-8">
                Load More <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Tournaments</h2>
              <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full">
                <Trophy className="mr-2 h-4 w-4" /> Find Tournaments
              </Button>
            </div>

            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle>Tournament History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#333]">
                        <th className="text-left py-4 px-4">Tournament</th>
                        <th className="text-left py-4 px-4">Date</th>
                        <th className="text-left py-4 px-4">Game</th>
                        <th className="text-left py-4 px-4">Placement</th>
                        <th className="text-left py-4 px-4">Prize</th>
                        <th className="text-left py-4 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          name: "Cyber Showdown Finals",
                          date: "Mar 10, 2025",
                          game: "FPS Arena",
                          placement: "1st",
                          prize: "$2,500",
                        },
                        {
                          name: "Neon Racers Cup",
                          date: "Feb 28, 2025",
                          game: "Racing",
                          placement: "3rd",
                          prize: "$750",
                        },
                        {
                          name: "AI Creators Challenge",
                          date: "Feb 15, 2025",
                          game: "Strategy",
                          placement: "2nd",
                          prize: "$1,200",
                        },
                        {
                          name: "Winter Championship",
                          date: "Jan 20, 2025",
                          game: "FPS Arena",
                          placement: "5th",
                          prize: "$300",
                        },
                        {
                          name: "New Year's Tournament",
                          date: "Jan 1, 2025",
                          game: "Battle Royale",
                          placement: "1st",
                          prize: "$1,500",
                        },
                      ].map((tournament, index) => (
                        <tr key={index} className="border-b border-[#333] hover:bg-[#1A1A1A]">
                          <td className="py-4 px-4">
                            <div className="font-medium">{tournament.name}</div>
                          </td>
                          <td className="py-4 px-4 text-gray-400">{tournament.date}</td>
                          <td className="py-4 px-4">{tournament.game}</td>
                          <td className="py-4 px-4">
                            <Badge
                              className={
                                tournament.placement === "1st"
                                  ? "bg-[#FFD600] text-black"
                                  : tournament.placement === "2nd"
                                    ? "bg-gray-300 text-black"
                                    : tournament.placement === "3rd"
                                      ? "bg-amber-700 text-white"
                                      : "bg-[#222] text-gray-300"
                              }
                            >
                              {tournament.placement}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 font-medium text-[#00FFA9]">{tournament.prize}</td>
                          <td className="py-4 px-4">
                            <Button variant="ghost" size="sm" className="rounded-full hover:bg-[#222]">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle>Upcoming Tournaments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Spring Championship", date: "Mar 25, 2025", game: "FPS Arena", status: "Registered" },
                    { name: "AI Masters Cup", date: "Apr 10, 2025", game: "Strategy", status: "Invited" },
                    { name: "Speed Demons", date: "Apr 15, 2025", game: "Racing", status: "Open" },
                  ].map((tournament, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-black/30 rounded-xl border border-[#333]"
                    >
                      <div>
                        <h3 className="font-medium">{tournament.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{tournament.date}</span>
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
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle>Tournament Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Win Rate</span>
                      <span className="text-[#00FFA9]">68%</span>
                    </div>
                    <Progress value={68} className="h-2 bg-[#222]" indicatorClassName="bg-[#00FFA9]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Top 3 Finishes</span>
                      <span className="text-[#00FFA9]">72%</span>
                    </div>
                    <Progress value={72} className="h-2 bg-[#222]" indicatorClassName="bg-[#00FFA9]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Earnings per Tournament</span>
                      <span className="text-[#00FFA9]">$850</span>
                    </div>
                    <Progress value={60} className="h-2 bg-[#222]" indicatorClassName="bg-[#00FFA9]" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">24</p>
                      <p className="text-xs text-gray-400">TOURNAMENTS</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-xs text-gray-400">WINS</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">18</p>
                      <p className="text-xs text-gray-400">TOP 3</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tabs would be implemented similarly */}
          <TabsContent value="achievements" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Achievements</h2>
              <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                <Trophy className="mr-2 h-4 w-4" /> View All Badges
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Champion",
                  description: "Win 10 tournaments in a row",
                  progress: 7,
                  total: 10,
                  icon: <Trophy className="w-8 h-8 text-[#FFD600]" />,
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
                  icon: <Brain className="w-8 h-8 text-[#00FFA9]" />,
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
                  icon: <Users className="w-8 h-8 text-[#FF007A]" />,
                  color: "bg-[#FF007A]/20",
                  border: "border-[#FF007A]/20",
                  iconBg: "bg-[#FF007A]/20",
                  textColor: "text-[#FF007A]",
                },
                {
                  title: "Veteran",
                  description: "Play 500 matches",
                  progress: 248,
                  total: 500,
                  icon: <Gamepad2 className="w-8 h-8 text-[#00FFA9]" />,
                  color: "bg-[#00FFA9]/20",
                  border: "border-[#00FFA9]/20",
                  iconBg: "bg-[#00FFA9]/20",
                  textColor: "text-[#00FFA9]",
                },
                {
                  title: "Millionaire",
                  description: "Earn $10,000 in tournaments",
                  progress: 6250,
                  total: 10000,
                  icon: <Trophy className="w-8 h-8 text-[#FFD600]" />,
                  color: "bg-[#FFD600]/20",
                  border: "border-[#FFD600]/20",
                  iconBg: "bg-[#FFD600]/20",
                  textColor: "text-[#FFD600]",
                },
                {
                  title: "Innovator",
                  description: "Have a game played by 10,000 users",
                  progress: 8500,
                  total: 10000,
                  icon: <Brain className="w-8 h-8 text-[#00FFA9]" />,
                  color: "bg-[#00FFA9]/20",
                  border: "border-[#00FFA9]/20",
                  iconBg: "bg-[#00FFA9]/20",
                  textColor: "text-[#00FFA9]",
                },
              ].map((achievement, index) => (
                <Card
                  key={index}
                  className={`bg-gradient-to-br from-[#111] to-black border ${achievement.border} rounded-3xl overflow-hidden`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-full ${achievement.iconBg} flex items-center justify-center`}>
                        {achievement.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{achievement.title}</h3>
                        <p className="text-gray-400 text-sm">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Progress</span>
                      <span className={`text-sm font-medium ${achievement.textColor}`}>
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
)
}
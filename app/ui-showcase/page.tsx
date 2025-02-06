"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  Gamepad,
  Trophy,
  Coins,
  Ban,
  Maximize2,
  Minimize2,
  Clock,
  DollarSign,
  Users,
  Star,
  Eye,
  Ticket,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ErrorModal } from "@/components/error-modal"
import { SuccessModal } from "@/components/success-modal"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export default function UIShowcasePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Your action was completed successfully.")
  const [errorMessage, setErrorMessage] = useState("There was a problem completing your action.")
  
  const handleSuccessNotification = () => {
    setSuccessMessage("Your action was completed successfully. Great job!")
    setShowSuccessModal(true)
  }
  
  const handleErrorNotification = () => {
    setErrorMessage("Oops! There was a problem completing your action. Please try again.")
    setShowErrorModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-primary neon-glow text-center">UI Showcase</h1>

        <Tabs defaultValue="cards" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="misc">Miscellaneous</TabsTrigger>
          </TabsList>

          <TabsContent value="buttons" className="space-y-4">
            <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Button Variants</CardTitle>
                <CardDescription>Explore different button styles and states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Neon Purple
                  </Button>
                  <Button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Cyber Blue
                  </Button>
                  <Button className="px-6 py-3 bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Toxic Green
                  </Button>
                  <Button className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Neon Red
                  </Button>
                  <Button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Electric Indigo
                  </Button>
                  <Button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Plasma Pink
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6 py-3 border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105"
                  >
                    Neon Outline
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-6 py-3 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 font-bold rounded-full transition-all duration-300"
                  >
                    Ghost Neon
                  </Button>
                  <Button className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Cyber Gold
                  </Button>
                  <Button className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-gray-700">
                    Dark Tech
                  </Button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button
                    disabled
                    className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-gray-300 font-bold rounded-full transition-all duration-300 opacity-50 cursor-not-allowed"
                  >
                    <Ban className="mr-2 h-5 w-5" />
                    Disabled Button
                  </Button>
                  <Button
                    onClick={() => setIsLoading(true)}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Please wait
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Click me
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Maximize2 className="mr-2 h-6 w-6" />
                    Large Button
                  </Button>
                  <Button
                    size="sm"
                    className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Minimize2 className="mr-2 h-4 w-4" />
                    Small Button
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Form Inputs</CardTitle>
                <CardDescription>Various form input components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="email" className="text-primary">
                    Email
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="Email"
                    className="bg-background/50 border-primary/20 focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="password" className="text-primary">
                    Password
                  </Label>
                  <Input
                    type="password"
                    id="password"
                    placeholder="Password"
                    className="bg-background/50 border-primary/20 focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="message" className="text-primary">
                    Message
                  </Label>
                  <Textarea
                    placeholder="Type your message here."
                    id="message"
                    className="bg-background/50 border-primary/20 focus:border-primary focus:ring-primary"
                  />
                </div>
                <RadioGroup defaultValue="option-one">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-one" id="option-one" />
                    <Label htmlFor="option-one" className="text-primary">
                      Option One
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-two" id="option-two" />
                    <Label htmlFor="option-two" className="text-primary">
                      Option Two
                    </Label>
                  </div>
                </RadioGroup>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms" className="text-primary">
                    Accept terms and conditions
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="airplane-mode" />
                  <Label htmlFor="airplane-mode" className="text-primary">
                    Airplane Mode
                  </Label>
                </div>
                <div className="w-full max-w-sm">
                  <Slider defaultValue={[50]} max={100} step={1} className="accent-primary" />
                </div>
                <Select>
                  <SelectTrigger className="w-[180px] bg-background/50 border-primary/20 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apple">Apple</SelectItem>
                    <SelectItem value="banana">Banana</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cyberpunk Featured Card */}
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-primary shadow-lg shadow-primary/20 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-600/50 to-pink-600/50">
                  <CardTitle className="text-2xl text-primary neon-glow">Cyberpunk Featured</CardTitle>
                  <CardDescription className="text-primary/80">Experience the future today</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">Immerse yourself in the neon-lit streets of tomorrow.</p>
                  <Image
                    src="https://images.unsplash.com/photo-1614850715649-1d0106293bd1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                    alt="Cyberpunk City"
                    width={400}
                    height={200}
                    className="rounded-lg shadow-md shadow-primary/20 mb-4"
                  />
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 justify-between">
                  <Button className="cyberpunk-button neon-border-1">
                    <Zap className="mr-2 h-4 w-4" />
                    Explore
                  </Button>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    Featured
                  </Badge>
                </CardFooter>
              </Card>

              {/* NFT-style Card */}
              <Card className="bg-black border-2 border-cyan-500 shadow-lg shadow-cyan-500/20 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
                  <CardTitle className="text-2xl text-cyan-400">Cyber Punk #4269</CardTitle>
                  <CardDescription className="text-cyan-300/80">Rare NFT Collectible</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative w-full h-64 mb-4">
                    <Image
                      src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80"
                      alt="Cyber Punk NFT"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-cyan-400 font-semibold">Current Bid</p>
                      <p className="text-2xl font-bold text-cyan-300">2.5 ETH</p>
                    </div>
                    <div>
                      <p className="text-cyan-400 font-semibold">Ending In</p>
                      <p className="text-2xl font-bold text-cyan-300">12h 30m</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 justify-between">
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Place Bid
                  </Button>
                  <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Two-column Card */}
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-primary shadow-lg shadow-primary/20 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-full min-h-[300px]">
                  <Image
                    src="https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                    alt="Futuristic Game"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary neon-glow">Neon Racer 3000</CardTitle>
                    <CardDescription className="text-primary/80">
                      The ultimate cyberpunk racing experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Race through neon-lit streets in this high-octane, futuristic racing game.
                    </p>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-primary mr-2" />
                        <span className="text-primary">100k+ Players</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="text-primary">4.8/5 Rating</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full cyberpunk-button neon-border-1">
                      <Gamepad className="mr-2 h-4 w-4" />
                      Play Now
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>

            {/* Neon-bordered Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Achievement Card */}
              <Card className="bg-gradient-to-br from-green-900/30 to-teal-900/30 border-2 border-green-500/50 shadow-lg shadow-green-500/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30">
                <CardHeader className="bg-gradient-to-r from-green-500/20 to-teal-500/20">
                  <CardTitle className="text-xl text-green-400 flex items-center">
                    <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                    New Achievement
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-2xl font-bold text-green-300 mb-2 neon-glow">Master Hacker</p>
                  <p className="text-green-400/80">Successfully hacked 100 systems</p>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-green-500/20 to-teal-500/20">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-black font-bold transition-all duration-300 transform hover:scale-105">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Claim Reward
                  </Button>
                </CardFooter>
              </Card>

              {/* Leaderboard Card */}
              <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30">
                <CardHeader className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20">
                  <CardTitle className="text-xl text-blue-400 flex items-center">
                    <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ol className="space-y-2">
                    {[
                      { name: "CyberNinja", score: 10289 },
                      { name: "NeonRider", score: 9876 },
                      { name: "ByteMaster", score: 9543 },
                    ].map((player, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span className="text-blue-300">
                          {index + 1}. {player.name}
                        </span>
                        <span className="text-blue-400 font-bold neon-glow">{player.score}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold transition-all duration-300 transform hover:scale-105">
                    <Zap className="mr-2 h-4 w-4" />
                    View Full Leaderboard
                  </Button>
                </CardFooter>
              </Card>

              {/* Event Card */}
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30">
                <CardHeader className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                  <CardTitle className="text-xl text-purple-400 flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-purple-400" />
                    Upcoming Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-2xl font-bold text-purple-300 mb-2 neon-glow">Cyber Night 2077</p>
                  <p className="text-purple-400/80 mb-2">Join the biggest cyberpunk party of the year!</p>
                  <div className="flex items-center text-purple-300">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>48:00:00 remaining</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all duration-300 transform hover:scale-105">
                    <Ticket className="mr-2 h-4 w-4" />
                    Get Tickets
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="misc" className="space-y-4">
            <Card className="bg-gradient-to-br from-green-900/30 to-teal-900/30 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Miscellaneous Components</CardTitle>
                <CardDescription>Other useful UI components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary text-primary-foreground">Default</Badge>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    Secondary
                  </Badge>
                  <Badge variant="outline" className="border-primary text-primary">
                    Outline
                  </Badge>
                  <Badge variant="destructive" className="bg-destructive text-destructive-foreground">
                    Destructive
                  </Badge>
                </div>
                <Alert className="border-primary/20 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Information</AlertTitle>
                  <AlertDescription>This is an informational alert.</AlertDescription>
                </Alert>
                <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>This is an error alert.</AlertDescription>
                </Alert>
                <div className="flex space-x-4 justify-center">
                  <Button
                    onClick={handleSuccessNotification}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Show Success Notification
                  </Button>
                  <Button
                    onClick={handleErrorNotification}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Show Error Notification
                  </Button>
                </div>
                <Button onClick={() => setShowSuccessModal(true)} variant="outline" className="cyberpunk-button">
                  Open Custom Modal
                </Button>
                <Progress value={33} className="w-[60%] bg-primary/20" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mb-8 bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Text Styles</CardTitle>
            <CardDescription>Various text styles and colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-primary neon-glow">
              Heading 1
            </h1>
            <h2 className="scroll-m-20 border-b border-primary/20 pb-2 text-3xl font-semibold tracking-tight text-primary transition-colors first:mt-0">
              Heading 2
            </h2>
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight text-primary">Heading 3</h3>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight text-primary">Heading 4</h4>
            <p className="leading-7 text-muted-foreground [&:not(:first-child)]:mt-6">
              This is a paragraph with some <strong className="text-primary">bold text</strong> and some{" "}
              <em>italic text</em>.
            </p>
            <blockquote className="mt-6 border-l-2 border-primary pl-6 italic text-primary">
              "This is a blockquote. It's styled with a left border and italic text."
            </blockquote>
            <ul className="my-6 ml-6 list-disc text-muted-foreground [&>li]:mt-2">
              <li>First item in an unordered list</li>
              <li>Second item in an unordered list</li>
            </ul>
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-primary">
              This is inline code
            </code>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center">
                <Gamepad className="w-6 h-6 mr-2 text-purple-400" />
                Game Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Games Played</p>
                  <p className="text-2xl font-bold text-primary">42</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Games Created</p>
                  <p className="text-2xl font-bold text-primary">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/30 to-teal-900/30 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                  <span className="text-muted-foreground">First Win</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                  <span className="text-muted-foreground">Create a Game</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border-primary/20">
            <CardHeader>
              <CardTitle className="textxl text-primary flex items-center">
                <Coins className="w-6 h-6 mr-2 text-yellow-400" />
                Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">1,234.56 SOL</p>
              <p className="text-sm text-muted-foreground">Total earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Small Cards Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-primary neon-glow">Small Cards</h2>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border border-primary/20">
            <div className="flex w-max space-x-4 p-4">
              {[
                {
                  title: "Neon City",
                  image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=500&h=500&fit=crop",
                },
                { title: "Cyber Punk", content: "Experience the future of gaming in a dystopian world." },
                {
                  title: "AI Revolution",
                  image: "https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=500&h=500&fit=crop",
                },
                { title: "Virtual Reality", content: "Immerse yourself in breathtaking digital landscapes." },
                {
                  title: "Quantum Gaming",
                  image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&h=500&fit=crop",
                },
                { title: "Cybernetic Enhancements", content: "Upgrade your character with the latest tech implants." },
              ].map((card, index) => (
                <Card
                  key={index}
                  className="w-[250px] flex-shrink-0 bg-gradient-to-br from-gray-900/90 to-slate-900/90 border-2 border-primary/50 shadow-lg shadow-primary/20 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                >
                  {card.image ? (
                    <div className="relative h-[150px]">
                      <Image src={card.image || "/placeholder.svg"} alt={card.title} fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <h3 className="absolute bottom-2 left-2 text-lg font-bold text-white neon-glow">{card.title}</h3>
                    </div>
                  ) : (
                    <CardHeader>
                      <CardTitle className="text-lg text-primary neon-glow">{card.title}</CardTitle>
                    </CardHeader>
                  )}
                  {card.content && (
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">{card.content}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        <div className="flex justify-center">
          <Button asChild className="cyberpunk-button neon-border-1 text-lg px-8 py-4">
            <Link href="/discover">
              <Zap className="mr-2 h-5 w-5" />
              Explore Games
            </Link>
          </Button>
        </div>
      </main>
      {showSuccessModal && (
        <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
      )}
      {showErrorModal && (
        <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
      )}
    </div>
  )
}


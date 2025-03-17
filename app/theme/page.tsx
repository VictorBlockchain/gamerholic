"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageBackground } from "@/components/layout/page-background"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bell,
  Brain,
  Clock,
  Crown,
  Flame,
  Gamepad2,
  Info,
  Loader2,
  Lock,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  Zap,
  X,
} from "lucide-react"

export default function ThemePage() {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [showNotification, setShowNotification] = useState(false)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PageBackground />
      <Header />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Gamerholic Design System</h1>
          <p className="text-xl text-gray-400">
            A comprehensive collection of UI components for the Gamerholic platform.
          </p>
        </div>

        <Tabs defaultValue="buttons" className="w-full">
          <TabsList className="grid grid-cols-8 mb-8 bg-[#111] border border-[#333] rounded-full p-1">
            <TabsTrigger
              value="buttons"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Buttons
            </TabsTrigger>
            <TabsTrigger
              value="forms"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Forms
            </TabsTrigger>
            <TabsTrigger
              value="cards"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Cards
            </TabsTrigger>
            <TabsTrigger
              value="tables"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Tables
            </TabsTrigger>
            <TabsTrigger
              value="modals"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Modals
            </TabsTrigger>
            <TabsTrigger
              value="loaders"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Loaders
            </TabsTrigger>
            <TabsTrigger
              value="badges"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Badges
            </TabsTrigger>
            <TabsTrigger
              value="misc"
              className="rounded-full data-[state=active]:bg-[#00FFA9] data-[state=active]:text-black"
            >
              Misc
            </TabsTrigger>
          </TabsList>

          {/* Buttons */}
          <TabsContent value="buttons" className="space-y-12">
            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle>Button Styles</CardTitle>
                <CardDescription>Button variations for different actions and states.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Primary Buttons</h6>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
                      Default
                    </Button>
                    <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full" size="sm">
                      Small
                    </Button>
                    <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full" size="lg">
                      Large
                    </Button>
                    <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full" disabled>
                      Disabled
                    </Button>
                    <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
                      <Zap className="mr-2 h-4 w-4" /> With Icon
                    </Button>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Secondary Buttons</h6>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full">
                      Default
                    </Button>
                    <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full" size="sm">
                      Small
                    </Button>
                    <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full" size="lg">
                      Large
                    </Button>
                    <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full" disabled>
                      Disabled
                    </Button>
                    <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full">
                      <Trophy className="mr-2 h-4 w-4" /> With Icon
                    </Button>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Outline Buttons</h6>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                      Default
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#333] text-white hover:bg-white/5 rounded-full"
                      size="sm"
                    >
                      Small
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#333] text-white hover:bg-white/5 rounded-full"
                      size="lg"
                    >
                      Large
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#333] text-white hover:bg-white/5 rounded-full"
                      disabled
                    >
                      Disabled
                    </Button>
                    <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                      <Brain className="mr-2 h-4 w-4" /> With Icon
                    </Button>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Ghost Buttons</h6>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="ghost" className="text-white hover:bg-white/5 rounded-full">
                      Default
                    </Button>
                    <Button variant="ghost" className="text-white hover:bg-white/5 rounded-full" size="sm">
                      Small
                    </Button>
                    <Button variant="ghost" className="text-white hover:bg-white/5 rounded-full" size="lg">
                      Large
                    </Button>
                    <Button variant="ghost" className="text-white hover:bg-white/5 rounded-full" disabled>
                      Disabled
                    </Button>
                    <Button variant="ghost" className="text-white hover:bg-white/5 rounded-full">
                      <Gamepad2 className="mr-2 h-4 w-4" /> With Icon
                    </Button>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Special Buttons</h6>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-white hover:bg-gray-100 text-black font-medium rounded-full">White</Button>
                    <Button className="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] hover:from-[#00D48F] hover:to-[#00A3DF] text-black font-medium rounded-full">
                      Gradient
                    </Button>
                    <Button className="bg-gradient-to-r from-[#FF007A] to-[#FF6B00] hover:from-[#D60067] hover:to-[#D65800] text-white font-medium rounded-full">
                      Gradient Alt
                    </Button>
                    <Button className="bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 text-white rounded-full">
                      Glass
                    </Button>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Circular Icon Buttons</h6>
                  <div className="flex flex-wrap gap-4">
                    <Button className="w-10 h-10 p-0 rounded-full bg-[#00FFA9] hover:bg-[#00D48F] text-black">
                      <Plus className="h-5 w-5" />
                    </Button>
                    <Button className="w-10 h-10 p-0 rounded-full bg-[#FF007A] hover:bg-[#D60067] text-white">
                      <Settings className="h-5 w-5" />
                    </Button>
                    <Button className="w-10 h-10 p-0 rounded-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] hover:from-[#00D48F] hover:to-[#00A3DF] text-black">
                      <Zap className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-10 h-10 p-0 rounded-full border-[#333] text-white hover:bg-white/5"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                    <Button className="w-10 h-10 p-0 rounded-full bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 text-white">
                      <Bell className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Glowing Buttons</h6>
                  <div className="flex flex-wrap gap-4">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-[#00FFA9] opacity-70 group-hover:opacity-100 rounded-full blur-sm transition duration-200"></div>
                      <Button className="relative bg-[#111] hover:bg-[#222] text-[#00FFA9] border border-[#00FFA9]/50 rounded-full">
                        Neon Glow
                      </Button>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-[#FF007A] opacity-70 group-hover:opacity-100 rounded-full blur-sm transition duration-200"></div>
                      <Button className="relative bg-[#111] hover:bg-[#222] text-[#FF007A] border border-[#FF007A]/50 rounded-full">
                        Magenta Glow
                      </Button>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-70 group-hover:opacity-100 rounded-full blur-sm transition duration-200"></div>
                      <Button className="relative bg-[#111] hover:bg-[#222] text-white border border-white/20 rounded-full">
                        Rainbow Glow
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Animated Buttons</h6>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-[#111] hover:bg-[#222] text-white border border-[#00FFA9] rounded-full relative overflow-hidden group">
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-50 transition-opacity"></span>
                      <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#00FFA9] to-transparent opacity-30 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                      <span className="relative">Hover Sweep</span>
                    </Button>

                    <Button className="bg-[#111] hover:bg-[#222] text-white border border-[#FF007A] rounded-full relative overflow-hidden group">
                      <span className="absolute inset-0 w-0 bg-[#FF007A] opacity-30 group-hover:w-full transition-all duration-300"></span>
                      <span className="relative">Fill Effect</span>
                    </Button>

                    <Button className="bg-[#111] hover:bg-[#222] text-white border border-white/20 rounded-full relative overflow-hidden group">
                      <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"></span>
                      <span className="relative flex items-center">
                        <span className="mr-2">Pulse</span>
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFA9] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00FFA9]"></span>
                        </span>
                      </span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forms */}
          <TabsContent value="forms" className="space-y-12">
            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle>Futuristic Form Elements</CardTitle>
                <CardDescription>Input fields, selects, checkboxes, and other form controls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium">
                        Email
                      </Label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-100 rounded-lg blur-sm transition duration-200"></div>
                        <div className="relative">
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            className="bg-black/70 border-[#333] focus:border-[#00FFA9] rounded-lg pl-10"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <div className="w-5 h-5 rounded-full bg-[#00FFA9]/10 flex items-center justify-center">
                              <span className="text-[#00FFA9] text-xs">@</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[#FF007A] uppercase tracking-wider text-xs font-medium">
                        Password
                      </Label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF007A] to-[#FF6B00] opacity-30 group-hover:opacity-100 rounded-lg blur-sm transition duration-200"></div>
                        <div className="relative">
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            className="bg-black/70 border-[#333] focus:border-[#FF007A] rounded-lg pl-10"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-[#FF007A]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="select" className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium">
                        Game Category
                      </Label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-100 rounded-lg blur-sm transition duration-200"></div>
                        <Select>
                          <SelectTrigger className="relative bg-black/70 border-[#333] focus:border-[#00FFA9] rounded-lg">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111] border-[#333] rounded-lg backdrop-blur-lg">
                            <div className="bg-gradient-to-b from-[#00FFA9]/10 to-transparent p-1 rounded-t-lg mb-1">
                              <p className="text-xs text-[#00FFA9] px-2 py-1">Game Categories</p>
                            </div>
                            <SelectItem value="fps" className="focus:bg-[#00FFA9]/10 focus:text-[#00FFA9]">
                              First Person Shooter
                            </SelectItem>
                            <SelectItem value="racing" className="focus:bg-[#00FFA9]/10 focus:text-[#00FFA9]">
                              Racing
                            </SelectItem>
                            <SelectItem value="strategy" className="focus:bg-[#00FFA9]/10 focus:text-[#00FFA9]">
                              Strategy
                            </SelectItem>
                            <SelectItem value="rpg" className="focus:bg-[#00FFA9]/10 focus:text-[#00FFA9]">
                              Role Playing Game
                            </SelectItem>
                            <SelectItem value="puzzle" className="focus:bg-[#00FFA9]/10 focus:text-[#00FFA9]">
                              Puzzle
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="textarea" className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium">
                        Description
                      </Label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-100 rounded-lg blur-sm transition duration-200"></div>
                        <textarea
                          id="textarea"
                          placeholder="Enter a description"
                          className="w-full min-h-[100px] bg-black/70 border border-[#333] focus:border-[#00FFA9] rounded-lg p-2 text-white relative"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-[#FF007A] uppercase tracking-wider text-xs font-medium">Game Type</Label>
                      <div className="p-4 rounded-lg bg-black/30 border border-[#333] space-y-3">
                        <RadioGroup defaultValue="competitive" className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <div className="absolute -inset-1 bg-[#00FFA9] opacity-0 peer-checked:opacity-30 rounded-full blur-sm transition duration-200"></div>
                              <RadioGroupItem
                                value="competitive"
                                id="competitive"
                                className="border-[#333] text-[#00FFA9] peer"
                              />
                            </div>
                            <Label htmlFor="competitive" className="font-normal cursor-pointer">
                              Competitive
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <div className="absolute -inset-1 bg-[#00FFA9] opacity-0 peer-checked:opacity-30 rounded-full blur-sm transition duration-200"></div>
                              <RadioGroupItem
                                value="casual"
                                id="casual"
                                className="border-[#333] text-[#00FFA9] peer"
                              />
                            </div>
                            <Label htmlFor="casual" className="font-normal cursor-pointer">
                              Casual
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <div className="absolute -inset-1 bg-[#00FFA9] opacity-0 peer-checked:opacity-30 rounded-full blur-sm transition duration-200"></div>
                              <RadioGroupItem value="story" id="story" className="border-[#333] text-[#00FFA9] peer" />
                            </div>
                            <Label htmlFor="story" className="font-normal cursor-pointer">
                              Story-driven
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium">Features</Label>
                      <div className="p-4 rounded-lg bg-black/30 border border-[#333] space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="absolute -inset-1 bg-[#00FFA9] opacity-0 peer-checked:opacity-30 rounded-sm blur-sm transition duration-200"></div>
                            <Checkbox
                              id="multiplayer"
                              className="border-[#333] data-[state=checked]:bg-[#00FFA9] data-[state=checked]:text-black peer"
                            />
                          </div>
                          <label
                            htmlFor="multiplayer"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Multiplayer
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="absolute -inset-1 bg-[#00FFA9] opacity-0 peer-checked:opacity-30 rounded-sm blur-sm transition duration-200"></div>
                            <Checkbox
                              id="ai-opponents"
                              className="border-[#333] data-[state=checked]:bg-[#00FFA9] data-[state=checked]:text-black peer"
                            />
                          </div>
                          <label
                            htmlFor="ai-opponents"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            AI Opponents
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="absolute -inset-1 bg-[#00FFA9] opacity-0 peer-checked:opacity-30 rounded-sm blur-sm transition duration-200"></div>
                            <Checkbox
                              id="leaderboards"
                              className="border-[#333] data-[state=checked]:bg-[#00FFA9] data-[state=checked]:text-black peer"
                            />
                          </div>
                          <label
                            htmlFor="leaderboards"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Leaderboards
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="absolute -inset-1 bg-[#00FFA9] opacity-0 peer-checked:opacity-30 rounded-sm blur-sm transition duration-200"></div>
                            <Checkbox
                              id="achievements"
                              className="border-[#333] data-[state=checked]:bg-[#00FFA9] data-[state=checked]:text-black peer"
                            />
                          </div>
                          <label
                            htmlFor="achievements"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Achievements
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="ai-assistance"
                          className="text-[#FF007A] uppercase tracking-wider text-xs font-medium"
                        >
                          AI Assistance
                        </Label>
                        <div className="relative">
                          <div className="absolute -inset-1 bg-[#FF007A] opacity-0 peer-checked:opacity-30 rounded-full blur-sm transition duration-200"></div>
                          <Switch id="ai-assistance" className="data-[state=checked]:bg-[#FF007A] peer" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label
                            htmlFor="difficulty"
                            className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium"
                          >
                            Difficulty
                          </Label>
                          <span className="text-sm text-[#00FFA9]">Medium</span>
                        </div>
                        <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-100 rounded-full blur-sm transition duration-200"></div>
                          <Slider defaultValue={[50]} max={100} step={1} className="relative [&>span]:bg-[#00FFA9]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#222]">
                  <div className="flex justify-end gap-4">
                    <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                      Cancel
                    </Button>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-70 group-hover:opacity-100 rounded-full blur-sm transition duration-200"></div>
                      <Button className="relative bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cards */}
          <TabsContent value="cards" className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Hero Card */}
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden hover:border-[#555] transition-all">
                <div className="relative">
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Hero Card"
                    width={600}
                    height={400}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <Badge className="bg-[#00FFA9] text-black mb-2">FEATURED</Badge>
                    <h3 className="text-2xl font-bold mb-2">Cyber Tournament</h3>
                    <p className="text-xl text-gray-400">Join the biggest esports event of the year</p>
                  </div>
                </div>
                <CardContent className="p-6 pt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#FFD600]" />
                      <span className="text-[#FFD600] font-medium">$50,000 Prize Pool</span>
                    </div>
                    <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black rounded-full px-4 py-1 h-8">
                      Register
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* NFT Card */}
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden hover:border-[#555] transition-all group">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-30 group-hover:opacity-70 blur-md transition duration-300"></div>
                  <div className="relative p-4">
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 border border-[#333] group-hover:border-[#00FFA9]/50 transition-colors">
                      <Image
                        src="/placeholder.svg?height=400&width=400"
                        alt="NFT Asset"
                        width={400}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-1">Cyber Samurai #042</h3>
                    <p className="text-gray-400 text-sm mb-3">Limited Edition NFT</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-400">CURRENT BID</p>
                        <p className="text-lg font-bold text-[#00FFA9]">2.5 SOL</p>
                      </div>
                      <Button className="bg-[#111] hover:bg-[#222] border border-[#00FFA9] text-[#00FFA9] rounded-full">
                        Place Bid
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Background Image Card */}
              <Card className="relative h-[400px] rounded-3xl overflow-hidden group">
                <Image
                  src="/placeholder.svg?height=600&width=400"
                  alt="Background Image"
                  width={400}
                  height={600}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <Badge className="self-start bg-[#FF007A] text-white mb-2">NEW RELEASE</Badge>
                  <h3 className="text-2xl font-bold mb-2">Neon Drift Racing</h3>
                  <p className="text-gray-300 mb-4">Experience high-speed racing in a cyberpunk world</p>
                  <div className="flex gap-2">
                    <Button className="bg-white hover:bg-gray-100 text-black font-medium rounded-full">Play Now</Button>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full">
                      Learn More
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Stats Card */}
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden hover:border-[#555] transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#FFD600]" />
                    Player Statistics
                  </CardTitle>
                  <CardDescription>Your gaming performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Win Rate</span>
                      <span className="text-[#00FFA9]">68%</span>
                    </div>
                    <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] w-[68%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accuracy</span>
                      <span className="text-[#00FFA9]">72%</span>
                    </div>
                    <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] w-[72%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>K/D Ratio</span>
                      <span className="text-[#00FFA9]">2.4</span>
                    </div>
                    <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] w-[60%] rounded-full"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-2 bg-black/30 rounded-lg">
                      <p className="text-2xl font-bold">24</p>
                      <p className="text-xs text-gray-400">GAMES</p>
                    </div>
                    <div className="text-center p-2 bg-black/30 rounded-lg">
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-xs text-gray-400">WINS</p>
                    </div>
                    <div className="text-center p-2 bg-black/30 rounded-lg">
                      <p className="text-2xl font-bold">$1.2k</p>
                      <p className="text-xs text-gray-400">EARNED</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievement Card */}
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden hover:border-[#555] transition-all">
                <div className="relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD600] opacity-20 blur-3xl rounded-full"></div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-[#FFD600]/20 flex items-center justify-center">
                        <Crown className="w-8 h-8 text-[#FFD600]" />
                      </div>
                      <div>
                        <Badge className="bg-[#FFD600] text-black mb-1">LEGENDARY</Badge>
                        <h3 className="text-xl font-bold">Tournament Champion</h3>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-4">Win 10 tournaments in a row without losing a single match.</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Progress</span>
                      <span className="text-sm font-medium">7/10</span>
                    </div>
                    <div className="h-2 bg-[#222] rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-gradient-to-r from-[#FFD600] to-[#FF6B00] w-[70%] rounded-full"></div>
                    </div>
                  </CardContent>
                </div>
              </Card>

              {/* Profile Card */}
              <Card className="bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden hover:border-[#555] transition-all">
                <div className="relative">
                  <div className="h-24 bg-gradient-to-r from-[#00FFA9]/20 to-[#FF007A]/20"></div>
                  <div className="absolute top-12 left-6">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-70 rounded-full blur-sm"></div>
                      <Avatar className="w-16 h-16 border-4 border-[#111] relative">
                        <AvatarImage src="/placeholder.svg?height=64&width=64" alt="@username" />
                        <AvatarFallback className="bg-[#222]">JD</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-10 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">John Doe</h3>
                      <p className="text-gray-400">@johndoe</p>
                    </div>
                    <Badge className="bg-[#00FFA9] text-black">PRO</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-xl font-bold">24</p>
                      <p className="text-xs text-gray-400">GAMES</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">12</p>
                      <p className="text-xs text-gray-400">WINS</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">$1.2k</p>
                      <p className="text-xs text-gray-400">EARNED</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
                      Follow
                    </Button>
                    <Button variant="outline" className="flex-1 border-[#333] text-white hover:bg-white/5 rounded-full">
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tables */}
          <TabsContent value="tables" className="space-y-12">
            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle>Tournament Leaderboard</CardTitle>
                <CardDescription>Top players in the current tournament</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9]/30 to-[#FF007A]/30 opacity-30 rounded-xl blur-sm"></div>
                  <div className="relative overflow-hidden rounded-xl border border-[#333]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#333] hover:bg-[#222]">
                          <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("rank")}>
                            <div className="flex items-center">Rank {getSortIcon("rank")}</div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("player")}>
                            <div className="flex items-center">Player {getSortIcon("player")}</div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("wins")}>
                            <div className="flex items-center">Wins {getSortIcon("wins")}</div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("losses")}>
                            <div className="flex items-center">Losses {getSortIcon("losses")}</div>
                          </TableHead>
                          <TableHead className="text-right cursor-pointer" onClick={() => handleSort("earnings")}>
                            <div className="flex items-center justify-end">Earnings {getSortIcon("earnings")}</div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { rank: 1, name: "Alex Storm", avatar: "AS", wins: 24, losses: 3, earnings: "$4,250" },
                          { rank: 2, name: "Sarah Chen", avatar: "SC", wins: 22, losses: 5, earnings: "$3,800" },
                          { rank: 3, name: "Marcus King", avatar: "MK", wins: 21, losses: 6, earnings: "$3,200" },
                          { rank: 4, name: "Zoe Black", avatar: "ZB", wins: 19, losses: 8, earnings: "$2,750" },
                          { rank: 5, name: "Ryan Frost", avatar: "RF", wins: 18, losses: 9, earnings: "$2,100" },
                        ].map((player) => (
                          <TableRow key={player.rank} className="border-[#333] hover:bg-[#222]">
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                {player.rank === 1 ? (
                                  <div className="relative">
                                    <div className="absolute -inset-1 bg-[#FFD600] opacity-30 rounded-full blur-sm"></div>
                                    <Trophy className="w-4 h-4 relative text-[#FFD600]" />
                                  </div>
                                ) : player.rank === 2 ? (
                                  <div className="relative">
                                    <div className="absolute -inset-1 bg-gray-300 opacity-30 rounded-full blur-sm"></div>
                                    <Trophy className="w-4 h-4 relative text-gray-300" />
                                  </div>
                                ) : player.rank === 3 ? (
                                  <div className="relative">
                                    <div className="absolute -inset-1 bg-amber-700 opacity-30 rounded-full blur-sm"></div>
                                    <Trophy className="w-4 h-4 relative text-amber-700" />
                                  </div>
                                ) : (
                                  <span className="w-4 h-4 mr-2 inline-block text-center">{player.rank}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-[#222] text-xs">{player.avatar}</AvatarFallback>
                                </Avatar>
                                <span>{player.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[#00FFA9]">{player.wins}</TableCell>
                            <TableCell className="text-[#FF007A]">{player.losses}</TableCell>
                            <TableCell className="text-right font-medium">{player.earnings}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" className="hover:bg-[#222] hover:text-white" />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive className="bg-[#00FFA9] text-black hover:bg-[#00D48F]">
                          1
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" className="hover:bg-[#222] hover:text-white">
                          2
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" className="hover:bg-[#222] hover:text-white">
                          3
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext href="#" className="hover:bg-[#222] hover:text-white" />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modals */}
          <TabsContent value="modals" className="space-y-12">
            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle>Futuristic Modals & Dialogs</CardTitle>
                <CardDescription>Popup dialogs and modals for various interactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex flex-wrap gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
                        Tournament Registration
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111] border-[#333] rounded-xl max-w-md">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 rounded-xl blur-sm"></div>
                      <div className="relative">
                        <DialogHeader>
                          <div className="bg-gradient-to-r from-[#00FFA9]/20 to-[#00C3FF]/20 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-xl border-b border-[#333]">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="w-5 h-5 text-[#00FFA9]" />
                              <Badge className="bg-[#00FFA9] text-black">PREMIUM</Badge>
                            </div>
                            <DialogTitle className="text-2xl">Join Tournament</DialogTitle>
                            <DialogDescription>
                              Enter the tournament details to register for the competition.
                            </DialogDescription>
                          </div>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="team-name"
                              className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium"
                            >
                              Team Name
                            </Label>
                            <div className="relative">
                              <Input
                                id="team-name"
                                placeholder="Enter your team name"
                                className="bg-black/70 border-[#333] focus:border-[#00FFA9] rounded-lg pl-10"
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Users className="h-4 w-4 text-[#00FFA9]" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="team-size"
                              className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium"
                            >
                              Team Size
                            </Label>
                            <Select>
                              <SelectTrigger className="bg-black/70 border-[#333] focus:border-[#00FFA9] rounded-lg">
                                <SelectValue placeholder="Select team size" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#111] border-[#333] rounded-lg backdrop-blur-lg">
                                <div className="bg-gradient-to-b from-[#00FFA9]/10 to-transparent p-1 rounded-t-lg mb-1">
                                  <p className="text-xs text-[#00FFA9] px-2 py-1">Team Sizes</p>
                                </div>
                                <SelectItem value="solo" className="focus:bg-[#00FFA9]/10 focus:text-[#00FFA9]">
                                  Solo (1 player)
                                </SelectItem>
                                <SelectItem value="duo" className="focus:bg-[#00FFA9]/10 focus:text-[#00FFA9]">
                                  Duo (2 players)
                                </SelectItem>
                                <SelectItem value="squad" className="focus:bg-[#00FFA9]/10 focus:text-[#00FFA9]">
                                  Squad (4 players)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="p-3 bg-black/30 rounded-lg border border-[#333] mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-[#FFD600]" />
                                <span className="text-sm font-medium">Entry Fee</span>
                              </div>
                              <Badge className="bg-[#FFD600] text-black">0.5 SOL</Badge>
                            </div>
                            <p className="text-xs text-gray-400">
                              Fee will be deducted from your wallet upon registration
                            </p>
                          </div>
                        </div>
                        <DialogFooter className="border-t border-[#333] pt-4">
                          <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                            Cancel
                          </Button>
                          <div className="relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-70 rounded-full blur-sm"></div>
                            <Button className="relative bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
                              Register
                            </Button>
                          </div>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full">
                        Withdrawal Alert
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#111] border-[#333] rounded-xl max-w-md">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF007A] to-[#FF6B00] opacity-30 rounded-xl blur-sm"></div>
                      <div className="relative">
                        <AlertDialogHeader>
                          <div className="bg-gradient-to-r from-[#FF007A]/20 to-[#FF6B00]/20 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-xl border-b border-[#333] flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#FF007A]/20 flex items-center justify-center flex-shrink-0">
                              <AlertCircle className="w-5 h-5 text-[#FF007A]" />
                            </div>
                            <div>
                              <AlertDialogTitle className="text-xl">Confirm Withdrawal</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will withdraw you from the tournament. Any entry fees will not be refunded.
                              </AlertDialogDescription>
                            </div>
                          </div>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <div className="p-3 bg-black/30 rounded-lg border border-[#333]">
                            <p className="text-sm text-gray-300">
                              Tournament: <span className="text-white font-medium">Cyber Showdown Finals</span>
                            </p>
                            <p className="text-sm text-gray-300">
                              Entry Fee: <span className="text-[#FFD600]">0.5 SOL (non-refundable)</span>
                            </p>
                          </div>
                        </div>
                        <AlertDialogFooter className="border-t border-[#333] pt-4">
                          <AlertDialogCancel className="border-[#333] text-white hover:bg-white/5 rounded-full">
                            Cancel
                          </AlertDialogCancel>
                          <div className="relative">
                            <div className="absolute -inset-0.5 bg-[#FF007A] opacity-70 rounded-full blur-sm"></div>
                            <AlertDialogAction className="relative bg-[#FF007A] hover:bg-[#D60067] text-white font-medium rounded-full">
                              Withdraw
                            </AlertDialogAction>
                          </div>
                        </AlertDialogFooter>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] hover:from-[#00D48F] hover:to-[#00A3DF] text-black font-medium rounded-full">
                        Achievement Unlocked
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111] border-[#333] rounded-xl max-w-md">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-50 rounded-xl blur-sm animate-pulse"></div>
                      <div className="relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFA9] opacity-20 blur-3xl rounded-full"></div>
                        <DialogHeader>
                          <div className="flex justify-center -mt-12 mb-4">
                            <div className="relative">
                              <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-70 rounded-full blur-sm animate-pulse"></div>
                              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#00FFA9]/20 to-[#00C3FF]/20 border border-[#00FFA9]/50 flex items-center justify-center relative">
                                <Sparkles className="w-12 h-12 text-[#00FFA9]" />
                              </div>
                            </div>
                          </div>
                          <DialogTitle className="text-2xl text-center">Achievement Unlocked!</DialogTitle>
                          <DialogDescription className="text-center">
                            You've reached a new milestone in your gaming journey.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 flex flex-col items-center">
                          <Badge className="bg-[#00FFA9] text-black mb-2 px-3 py-1 text-sm">MASTER STRATEGIST</Badge>
                          <p className="text-center text-gray-300 mb-4">Win 5 strategy games in a row without losing</p>
                          <div className="w-full bg-black/30 rounded-lg border border-[#333] p-3 mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400">XP EARNED</span>
                              <span className="text-sm font-medium text-[#00FFA9]">+500 XP</span>
                            </div>
                            <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] w-[70%] rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter className="flex flex-col gap-2">
                          <Button className="w-full bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full">
                            Claim Reward
                          </Button>
                          <Button variant="ghost" className="text-gray-400 hover:text-white">
                            Share Achievement
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loaders */}
          <TabsContent value="loaders" className="space-y-12">
            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle>Loading States & Indicators</CardTitle>
                <CardDescription>Visual feedback for loading and processing states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Spinner Loader */}
                  <div className="flex flex-col items-center justify-center p-6 bg-black/30 rounded-xl border border-[#333]">
                    <div className="mb-4">
                      <Loader2 className="h-8 w-8 text-[#00FFA9] animate-spin" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Spinner Loader</h3>
                    <p className="text-sm text-gray-400 text-center">
                      Simple spinning loader for general loading states
                    </p>
                  </div>

                  {/* Pulse Loader */}
                  <div className="flex flex-col items-center justify-center p-6 bg-black/30 rounded-xl border border-[#333]">
                    <div className="mb-4 relative">
                      <div className="absolute inset-0 rounded-full bg-[#FF007A] animate-ping opacity-20"></div>
                      <div className="relative w-8 h-8 rounded-full bg-[#FF007A]/20 border border-[#FF007A] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#FF007A]"></div>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Pulse Loader</h3>
                    <p className="text-sm text-gray-400 text-center">Pulsing animation for notifications and alerts</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex flex-col items-center justify-center p-6 bg-black/30 rounded-xl border border-[#333]">
                    <div className="w-full mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Loading assets</span>
                        <span className="text-[#00FFA9]">65%</span>
                      </div>
                      <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] w-[65%] rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Progress Bar</h3>
                    <p className="text-sm text-gray-400 text-center">Visual indicator for progress tracking</p>
                  </div>

                  {/* Skeleton Loader */}
                  <div className="flex flex-col p-6 bg-black/30 rounded-xl border border-[#333]">
                    <div className="mb-4 space-y-3">
                      <div className="h-4 bg-[#222] rounded-full w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-[#222] rounded-full animate-pulse"></div>
                      <div className="h-4 bg-[#222] rounded-full w-5/6 animate-pulse"></div>
                      <div className="h-4 bg-[#222] rounded-full w-1/2 animate-pulse"></div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Skeleton Loader</h3>
                    <p className="text-sm text-gray-400">Placeholder for content while loading</p>
                  </div>

                  {/* Circular Progress */}
                  <div className="flex flex-col items-center justify-center p-6 bg-black/30 rounded-xl border border-[#333]">
                    <div className="mb-4 relative w-16 h-16">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          className="text-[#222] stroke-current"
                          strokeWidth="8"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                        ></circle>
                        <circle
                          className="text-[#00FFA9] stroke-current"
                          strokeWidth="8"
                          strokeLinecap="round"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset="87.92"
                          transform="rotate(-90 50 50)"
                        ></circle>
                        <text x="50" y="55" textAnchor="middle" className="text-[#00FFA9] font-medium text-sm">
                          65%
                        </text>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Circular Progress</h3>
                    <p className="text-sm text-gray-400 text-center">Radial progress indicator</p>
                  </div>

                  {/* Glowing Loader */}
                  <div className="flex flex-col items-center justify-center p-6 bg-black/30 rounded-xl border border-[#333]">
                    <div className="mb-4 relative">
                      <div className="absolute -inset-2 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-50 rounded-full blur-md animate-pulse"></div>
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-[#00FFA9]/20 to-[#00C3FF]/20 border border-[#00FFA9]/50 flex items-center justify-center">
                        <div className="w-8 h-8 border-t-2 border-r-2 border-[#00FFA9] rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Glowing Loader</h3>
                    <p className="text-sm text-gray-400 text-center">Futuristic glowing spinner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges" className="space-y-12">
            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle>Badges & Status Indicators</CardTitle>
                <CardDescription>Visual elements for status, achievements, and categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Status Badges</h6>
                  <div className="flex flex-wrap gap-4">
                    <Badge className="bg-[#00FFA9] text-black hover:bg-[#00D48F] rounded-full">Online</Badge>
                    <Badge className="bg-[#FF007A] text-white hover:bg-[#D60067] rounded-full">Live</Badge>
                    <Badge className="bg-[#FFD600] text-black hover:bg-[#D6B300] rounded-full">Premium</Badge>
                    <Badge className="bg-gray-500 text-white hover:bg-gray-600 rounded-full">Offline</Badge>
                    <Badge className="bg-[#222] text-gray-300 hover:bg-[#333] rounded-full">Inactive</Badge>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Achievement Badges</h6>
                  <div className="flex flex-wrap gap-4">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFD600] to-[#FF6B00] opacity-70 group-hover:opacity-100 rounded-full blur-sm transition duration-200"></div>
                      <Badge className="relative bg-[#111] border border-[#FFD600] text-[#FFD600] hover:bg-[#222] rounded-full px-3 py-1">
                        <Crown className="w-3 h-3 mr-1" /> Champion
                      </Badge>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-70 group-hover:opacity-100 rounded-full blur-sm transition duration-200"></div>
                      <Badge className="relative bg-[#111] border border-[#00FFA9] text-[#00FFA9] hover:bg-[#222] rounded-full px-3 py-1">
                        <Brain className="w-3 h-3 mr-1" /> Creator
                      </Badge>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF007A] to-[#FF6B00] opacity-70 group-hover:opacity-100 rounded-full blur-sm transition duration-200"></div>
                      <Badge className="relative bg-[#111] border border-[#FF007A] text-[#FF007A] hover:bg-[#222] rounded-full px-3 py-1">
                        <Flame className="w-3 h-3 mr-1" /> Legendary
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Category Badges</h6>
                  <div className="flex flex-wrap gap-4">
                    <Badge className="bg-black/30 backdrop-blur-md border border-[#00FFA9]/30 text-[#00FFA9] hover:bg-black/50 rounded-full">
                      FPS
                    </Badge>
                    <Badge className="bg-black/30 backdrop-blur-md border border-[#FF007A]/30 text-[#FF007A] hover:bg-black/50 rounded-full">
                      Racing
                    </Badge>
                    <Badge className="bg-black/30 backdrop-blur-md border border-[#FFD600]/30 text-[#FFD600] hover:bg-black/50 rounded-full">
                      Strategy
                    </Badge>
                    <Badge className="bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-black/50 rounded-full">
                      RPG
                    </Badge>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Notification Badges</h6>
                  <div className="flex flex-wrap gap-8">
                    <div className="relative">
                      <Button variant="ghost" className="w-10 h-10 rounded-full p-0">
                        <Bell className="h-5 w-5" />
                      </Button>
                      <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF007A] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-[#FF007A] text-white text-xs items-center justify-center">
                          3
                        </span>
                      </span>
                    </div>

                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@username" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-[#00FFA9] border-2 border-[#111]"></span>
                    </div>

                    <div className="relative">
                      <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                        Messages
                      </Button>
                      <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-[#FF007A] text-white text-xs items-center justify-center">
                          5
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Level Badges</h6>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 p-1 pr-3 bg-black/30 backdrop-blur-md border border-[#00FFA9]/30 rounded-full">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] flex items-center justify-center text-black font-bold text-sm">
                        10
                      </div>
                      <span className="text-[#00FFA9] text-sm">Novice</span>
                    </div>

                    <div className="flex items-center gap-2 p-1 pr-3 bg-black/30 backdrop-blur-md border border-[#FF007A]/30 rounded-full">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF007A] to-[#FF6B00] flex items-center justify-center text-white font-bold text-sm">
                        25
                      </div>
                      <span className="text-[#FF007A] text-sm">Expert</span>
                    </div>

                    <div className="flex items-center gap-2 p-1 pr-3 bg-black/30 backdrop-blur-md border border-[#FFD600]/30 rounded-full">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FFD600] to-[#FF6B00] flex items-center justify-center text-black font-bold text-sm">
                        50
                      </div>
                      <span className="text-[#FFD600] text-sm">Master</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Misc */}
          <TabsContent value="misc" className="space-y-12">
            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle>Miscellaneous Components</CardTitle>
                <CardDescription>Additional UI elements and components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Tooltips</h6>
                  <div className="flex flex-wrap gap-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="border-[#333] text-white hover:bg-white/5 rounded-full">
                            <Info className="w-4 h-4 mr-2" /> Hover Me
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#111] border-[#333] text-white">
                          <div className="text-xs">
                            <p className="font-medium text-[#00FFA9]">Tooltip Title</p>
                            <p>Additional information goes here</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button className="w-10 h-10 p-0 rounded-full bg-[#FF007A] hover:bg-[#D60067] text-white">
                            <Trophy className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#111] border-[#333] text-white">
                          <p>Tournament Rewards</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Notifications</h6>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      className="bg-[#00FFA9] hover:bg-[#00D48F] text-black font-medium rounded-full"
                      onClick={() => setShowNotification(true)}
                    >
                      Show Notification
                    </Button>

                    {showNotification && (
                      <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-[#111] border border-[#333] rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-top-5">
                        <div className="relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 rounded-xl blur-sm"></div>
                          <div className="relative p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#00FFA9]/20 flex items-center justify-center flex-shrink-0">
                                <Trophy className="w-5 h-5 text-[#00FFA9]" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-white mb-1">Tournament Starting Soon</h4>
                                <p className="text-sm text-gray-400">
                                  Cyber Showdown begins in 15 minutes. Prepare your team!
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-full"
                                onClick={() => setShowNotification(false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Timeline</h6>
                  <div className="space-y-4">
                    <div className="relative pl-8 pb-8">
                      <div className="absolute top-0 left-0 h-full w-px bg-[#333]"></div>
                      <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-[#00FFA9]/20 border border-[#00FFA9] flex items-center justify-center -translate-x-1/2">
                        <div className="w-2 h-2 rounded-full bg-[#00FFA9]"></div>
                      </div>
                      <div className="bg-black/30 rounded-lg border border-[#333] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">Tournament Registration</h4>
                          <Badge className="bg-[#00FFA9] text-black">Completed</Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          Your team has been registered for the Cyber Showdown tournament.
                        </p>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> 2 hours ago
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-8 pb-8">
                      <div className="absolute top-0 left-0 h-full w-px bg-[#333]"></div>
                      <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-[#FF007A]/20 border border-[#FF007A] flex items-center justify-center -translate-x-1/2">
                        <div className="w-2 h-2 rounded-full bg-[#FF007A]"></div>
                      </div>
                      <div className="bg-black/30 rounded-lg border border-[#333] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">Match Scheduled</h4>
                          <Badge className="bg-[#FF007A] text-white">In Progress</Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          Your first match has been scheduled against Team Alpha.
                        </p>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> 30 minutes ago
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-8">
                      <div className="absolute top-0 left-0 h-1/2 w-px bg-[#333]"></div>
                      <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-[#222] border border-[#333] flex items-center justify-center -translate-x-1/2">
                        <div className="w-2 h-2 rounded-full bg-[#555]"></div>
                      </div>
                      <div className="bg-black/30 rounded-lg border border-[#333] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">Finals</h4>
                          <Badge className="bg-[#222] text-gray-300">Upcoming</Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">Tournament finals will be held if you qualify.</p>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> In 2 days
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Countdown Timer</h6>
                  <div className="bg-black/30 rounded-lg border border-[#333] p-6">
                    <h3 className="text-xl font-bold mb-4 text-center">Tournament Starts In</h3>
                    <div className="flex justify-center gap-4">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center mb-2">
                          <span className="text-3xl font-bold text-[#00FFA9]">12</span>
                        </div>
                        <span className="text-xs text-gray-400">HOURS</span>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center mb-2">
                          <span className="text-3xl font-bold text-[#00FFA9]">45</span>
                        </div>
                        <span className="text-xs text-gray-400">MINUTES</span>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center mb-2">
                          <span className="text-3xl font-bold text-[#00FFA9]">33</span>
                        </div>
                        <span className="text-xs text-gray-400">SECONDS</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="text-sm text-gray-400 mb-4">Wallet Connection</h6>
                  <div className="bg-black/30 rounded-lg border border-[#333] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00FFA9]/20 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-[#00FFA9]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Wallet Connected</h4>
                          <p className="text-sm text-gray-400">Phantom Wallet</p>
                        </div>
                      </div>
                      <Badge className="bg-[#00FFA9] text-black">Connected</Badge>
                    </div>
                    <div className="p-3 bg-[#111] rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Address</span>
                        <span className="text-sm font-mono">7x4G...3kPd</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Balance</span>
                      <span className="text-lg font-bold text-[#00FFA9]">12.45 SOL</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}


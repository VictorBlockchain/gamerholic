"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, X } from "lucide-react"
import type { EsportsGame } from "@/lib/services"

interface EsportsChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  onSendChallenge: () => Promise<void>
  challengeData: Partial<EsportsGame>
  setChallengeData: (data: Partial<EsportsGame>) => void
  query: string
  setQuery: (query: string) => void
  suggestions: any[]
  showDropdown: boolean
  setShowDropdown: (show: boolean) => void
  onSelectOpponent: (username: string, avatar: string) => void
  availableGames: string[]
  opponentAvatar: string
  challengeError: string
  setChallengeError: (error: string) => void
}

export function EsportsChallengeModal({
  isOpen,
  onClose,
  onSendChallenge,
  challengeData,
  setChallengeData,
  query,
  setQuery,
  suggestions,
  showDropdown,
  setShowDropdown,
  onSelectOpponent,
  availableGames,
  opponentAvatar,
  challengeError,
  setChallengeError,
}: EsportsChallengeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-[#333] rounded-xl max-w-md">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 rounded-xl blur-sm"></div>
        <div className="relative">
          <DialogHeader>
            <div className="bg-gradient-to-r from-[#00FFA9]/20 to-[#00C3FF]/20 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-xl border-b border-[#333] mb-4">
              <DialogTitle className="text-2xl">Send Challenge</DialogTitle>
              <DialogDescription>Challenge other players in heads up matches</DialogDescription>
            </div>
            <div className="flex justify-center mb-4 mt-4">
              <Avatar className="h-24 w-24 border-4 border-primary rounded-full">
                <AvatarImage
                  src={opponentAvatar || "/placeholder.svg"} // Use a fallback if no avatar is provided
                  className="rounded-full"
                />
              </Avatar>
            </div>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="opponent" className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium">
              opponent
            </Label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-100 rounded-lg blur-sm transition duration-200"></div>
              <div className="relative">
                <Input
                  id="oponent"
                  type="text"
                  placeholder="opponent name"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query && setShowDropdown(true)}
                  className="bg-black/70 border-[#333] focus:border-[#00FFA9] rounded-lg pl-10 w-full"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-5 rounded-full bg-[#00FFA9]/10 flex items-center justify-center">
                    <span className="text-[#00FFA9] text-xs">@</span>
                  </div>
                </div>
                {showDropdown && suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 bg-black border border-primary/30 rounded-md max-h-40 overflow-auto text-white">
                    {suggestions.map((user: any) => (
                      <li
                        key={user.name}
                        onClick={() => onSelectOpponent(user.name, user.avatar)}
                        className="px-4 py-2 cursor-pointer hover:bg-primary/10"
                      >
                        {user.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="game" className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium">
                game
              </Label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-100 rounded-lg blur-sm transition duration-200"></div>
                <Select
                  onValueChange={(value) => setChallengeData({ ...challengeData, game: value })}
                  value={challengeData.game || ""}
                >
                  <SelectTrigger className="relative bg-black/70 border-[#333] focus:border-[#00FFA9] rounded-lg">
                    <SelectValue placeholder="select game" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#333] rounded-lg backdrop-blur-lg">
                    <div className="bg-gradient-to-b from-[#00FFA9]/10 to-transparent p-1 rounded-t-lg mb-1">
                      <p className="text-xs text-[#00FFA9] px-2 py-1">Game Options</p>
                    </div>
                    {availableGames.map((game) => (
                      <SelectItem key={game} value={game}>
                        {game}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="console" className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium">
                console
              </Label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-100 rounded-lg blur-sm transition duration-200"></div>
                <Select
                  onValueChange={(value) => setChallengeData({ ...challengeData, console: value })}
                  value={challengeData.console || ""}
                >
                  <SelectTrigger className="relative bg-black/70 border-[#333] focus:border-[#00FFA9] rounded-lg">
                    <SelectValue placeholder="select console" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#333] rounded-lg backdrop-blur-lg">
                    <div className="bg-gradient-to-b from-[#00FFA9]/10 to-transparent p-1 rounded-t-lg mb-1">
                      <p className="text-xs text-[#00FFA9] px-2 py-1">Console Options</p>
                    </div>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="PS">Play Station</SelectItem>
                    <SelectItem value="XBOX">Xbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium">
                amount
              </Label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-100 rounded-lg blur-sm transition duration-200"></div>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    value={challengeData.amount ?? ""}
                    onChange={(e) =>
                      setChallengeData({
                        ...challengeData,
                        amount: e.target.value === "" ? "" : Number.parseFloat(e.target.value),
                      })
                    }
                    placeholder="game amount"
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
              <Label htmlFor="money" className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium">
                money
              </Label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-100 rounded-lg blur-sm transition duration-200"></div>
                <Select
                  onValueChange={(value) => setChallengeData({ ...challengeData, money: Number(value) })}
                  value={challengeData.money?.toString() || ""}
                >
                  <SelectTrigger className="relative bg-black/70 border-[#333] focus:border-[#00FFA9] rounded-lg">
                    <SelectValue placeholder="select money" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#333] rounded-lg backdrop-blur-lg">
                    <div className="bg-gradient-to-b from-[#00FFA9]/10 to-transparent p-1 rounded-t-lg mb-1">
                      <p className="text-xs text-[#00FFA9] px-2 py-1">Sol or Gamer</p>
                    </div>
                    <SelectItem value="1">Solana</SelectItem>
                    <SelectItem value="2">Gamer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <Label htmlFor="rules" className="text-[#00FFA9] uppercase tracking-wider text-xs font-medium">
              game rules
            </Label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 group-hover:opacity-100 rounded-lg blur-sm transition duration-200"></div>
              <textarea
                id="rules"
                value={challengeData.rules || ""}
                placeholder="specific rules for the match"
                onChange={(e) => setChallengeData({ ...challengeData, rules: e.target.value })}
                className="w-full min-h-[100px] bg-black/70 border border-[#333] focus:border-[#00FFA9] rounded-lg p-2 text-white relative"
              />
            </div>
          </div>
          <div className="space-y-2 mt-5">
            <Button
              onClick={onSendChallenge}
              type="submit"
              className="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] hover:from-[#00D48F] hover:to-[#00A3DF] text-black font-medium rounded-full w-full"
            >
              Send Challenge
            </Button>
          </div>
          <div className="space-y-2 mt-5">
            {challengeError && (
              <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-[#1a1a1a] border border-[#ff4d4d]/30 rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-top-5">
                <div className="relative">
                  {/* Gradient Border Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff4d4d] to-[#ff1a1a] opacity-30 rounded-xl blur-sm"></div>

                  {/* Notification Content */}
                  <div className="relative p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-full bg-[#ff4d4d]/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-[#ff4d4d]" /> {/* Use an error icon */}
                      </div>

                      {/* Message */}
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">Error</h4>
                        <p className="text-sm text-gray-400">{challengeError}</p>
                      </div>

                      {/* Close Button */}
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full hover:bg-[#ff4d4d]/10"
                        onClick={() => setChallengeError("")}
                      >
                        <X className="h-4 w-4 text-[#ff4d4d]" /> {/* Red close icon */}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


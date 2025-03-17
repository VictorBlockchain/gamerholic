import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Coins, Users, Clock } from "lucide-react"

interface JoinGameModalProps {
  isOpen: boolean
  onClose: () => void
  onJoin: () => void

}

export function JoinGameModal({ isOpen, onClose, onJoin, gameData, isJoining }:any) {
  // const [isJoining, setIsJoining] = useState(false)
  
  const handleJoin = async () => {
    // setIsJoining(true)
    // // Simulating an API call or blockchain transaction
    // await new Promise((resolve) => setTimeout(resolve, 1500))
    // setIsJoining(false)
    onJoin()
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-[#333] rounded-xl max-w-md">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] opacity-30 rounded-xl blur-sm"></div>
            <div className="relative">
            <DialogHeader>
            <div className="bg-gradient-to-r from-[#00FFA9]/20 to-[#00C3FF]/20 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-xl border-b border-[#333] mb-4">
              <DialogTitle className="text-2xl font-bold text-center">Join Grabbit Game</DialogTitle>
              <DialogDescription className="text-primary/70 text-center">
                Get ready to grab, slap, and sneak your way to victory!
              </DialogDescription>
            </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Coins className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-semibold">Prize Pool</p>
              <p className="text-sm text-primary/70">
                {gameData.title} {gameData.prize_token}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-semibold">Players</p>
              <p className="text-sm text-primary/70">
                {gameData.players_ready} / {gameData.players_max} ({gameData.players_min} min)
              </p>
            </div>
          </div>
          {gameData.entry_fee > 0 && (
            <div className="flex items-center gap-4">
              <Coins className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold">Entry Fee</p>
                <p className="text-sm text-primary/70">
                  {gameData.entry_fee} SOL
                </p>
              </div>
            </div>
          )}
          {gameData.gamer_to_join && (
            <div className="flex items-center gap-4">
              <Coins className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold">GAMER To Join</p>
                <p className="text-sm text-primary/70">
                  {gameData.gamer_to_join} GAMER
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <Clock className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-semibold">Time Limit</p>
              <p className="text-sm text-primary/70">Game starts in 2 minutes</p>
            </div>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-md p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-200">
              If the game doesn't start in 2 minutes, you'll be withdrawn from the game and any entry fee will be
              refunded.
            </p>
          </div>
        </div>
        <div className="space-y-2 mt-5">
                  <Button onClick={handleJoin} type="submit" className="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] hover:from-[#00D48F] hover:to-[#00A3DF] text-black font-medium rounded-full w-full">
                  {isJoining ? "Joining..." : "Confirm Join Game"}
                  </Button>
                </div>
            
            </div>
      </DialogContent>
    </Dialog>
  )
}


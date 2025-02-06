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

export function JoinGameModal({ isOpen, onClose, onJoin, gameData }:any) {
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async () => {
    setIsJoining(true)
    // Simulating an API call or blockchain transaction
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsJoining(false)
    onJoin()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-primary/20 text-primary">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">Join Grabbit Game</DialogTitle>
          <DialogDescription className="text-primary/70">
            Get ready to grab, slap, and sneak your way to victory!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Coins className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-semibold">Prize Pool</p>
              <p className="text-sm text-primary/70">
                {gameData.prize_amount} {gameData.prize_token}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-semibold">Players</p>
              <p className="text-sm text-primary/70">
                {gameData.players_ready} / {gameData.players_max}
              </p>
            </div>
          </div>
          {gameData.entryFee && (
            <div className="flex items-center gap-4">
              <Coins className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold">Entry Fee</p>
                <p className="text-sm text-primary/70">
                  {gameData.entryFee} {gameData.prizeToken}
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            disabled={isJoining}
          >
            {isJoining ? "Joining..." : "Confirm Join Game"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, X } from "lucide-react"

interface ReportScoreModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (player1Score: number, player2Score: number) => void
  player1Name: string
  player2Name: string
  isTournamentMatch: boolean
  matchId?: string
}

export function ReportScoreModal({
  isOpen,
  onClose,
  onSubmit,
  player1Name,
  player2Name,
  isTournamentMatch,
  matchId,
}: ReportScoreModalProps) {
  const [player1Score, setPlayer1Score] = useState<number | "">("")
  const [player2Score, setPlayer2Score] = useState<number | "">("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof player1Score === "number" && typeof player2Score === "number") {
      onSubmit(player1Score, player2Score)
      setPlayer1Score("")
      setPlayer2Score("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-gray-900 to-black text-white border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Report {isTournamentMatch ? "Tournament" : "Match"} Score
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Enter the final scores for both players.
            {isTournamentMatch && <span className="block mt-2">Match ID: {matchId}</span>}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="player1Score" className="text-white">
                {player1Name} Score
              </Label>
              <Input
                id="player1Score"
                type="number"
                min="0"
                value={player1Score}
                onChange={(e) => setPlayer1Score(e.target.value ? Number.parseInt(e.target.value) : "")}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                placeholder="Enter score"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player2Score" className="text-white">
                {player2Name} Score
              </Label>
              <Input
                id="player2Score"
                type="number"
                min="0"
                value={player2Score}
                onChange={(e) => setPlayer2Score(e.target.value ? Number.parseInt(e.target.value) : "")}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                placeholder="Enter score"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Submit Scores
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


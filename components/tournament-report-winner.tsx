"use client"
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

interface SetWinnerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: ()=> void
  onSubmit: (winner: string) => void
  tournamentId: number
  isJoining:boolean
}

export function ReportWinnerModal({
  isOpen,
  onClose,
  onSubmit,
  tournamentId,
  isJoining
}: SetWinnerModalProps) {

    const [winner, setWinner] = useState<string | "">("")
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(winner)
        onClose()
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Winner</DialogTitle>
          <DialogDescription>Report The Winner Of Your Battle Royal</DialogDescription>
        </DialogHeader>
        <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="player1Score" className="text-white">
                Winner
              </Label>
              <Input
                id="player1Score"
                type="string"
                min="0"
                value={winner}
                onChange={(e) => setWinner(e.target.value)}
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


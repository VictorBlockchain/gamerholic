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
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, X } from "lucide-react"

interface DisputeScoreModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (disputeData: DisputeData) => void
  player1Name: string
  player2Name: string
  initialPlayer1Score: number
  initialPlayer2Score: number
}

interface DisputeData {
  player1Score: number
  player2Score: number
  videoEvidence: string
  reason: string
}

export function ChallengeDisputeScoreModal({
  isOpen,
  onClose,
  onSubmit,
  player1Name,
  player2Name,
  initialPlayer1Score,
  initialPlayer2Score,
}: DisputeScoreModalProps) {
  const [player1Score, setPlayer1Score] = useState<number>(initialPlayer1Score)
  const [player2Score, setPlayer2Score] = useState<number>(initialPlayer2Score)
  const [videoEvidence, setVideoEvidence] = useState<string>("")
  const [reason, setReason] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      player1Score,
      player2Score,
      videoEvidence,
      reason,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-primary/20 text-primary">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Dispute Match Score
          </DialogTitle>
          <DialogDescription className="text-primary/70">
            Please provide the correct scores and reason for dispute.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="player1Score" className="text-primary">
                {player1Name} Score
              </Label>
              <Input
                id="player1Score"
                type="number"
                min="0"
                value={player1Score}
                onChange={(e) => setPlayer1Score(Number(e.target.value))}
                className="bg-background/50 border-primary/20 text-primary placeholder-primary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player2Score" className="text-primary">
                {player2Name} Score
              </Label>
              <Input
                id="player2Score"
                type="number"
                min="0"
                value={player2Score}
                onChange={(e) => setPlayer2Score(Number(e.target.value))}
                className="bg-background/50 border-primary/20 text-primary placeholder-primary/50"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoEvidence" className="text-primary">
              Video Evidence Link
            </Label>
            <Input
              id="videoEvidence"
              type="url"
              value={videoEvidence}
              onChange={(e) => setVideoEvidence(e.target.value)}
              className="bg-background/50 border-primary/20 text-primary placeholder-primary/50"
              placeholder="https://example.com/video-evidence"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-primary">
              Reason for Dispute
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-background/50 border-primary/20 text-primary placeholder-primary/50"
              placeholder="Please explain why you are disputing the score..."
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-background/50 border-primary/20 text-primary hover:bg-primary/20"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Submit Dispute
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


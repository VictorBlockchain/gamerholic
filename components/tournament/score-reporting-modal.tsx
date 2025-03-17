"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { reportMatchScore } from "@/lib/service-tourmanent"

export function ScoreReportingModal({ match, tournament, participants, isOpen, onClose, onSuccess }:any) {
  const { toast } = useToast()
  const [player1Score, setPlayer1Score] = useState(match.player1_score || 0)
  const [player2Score, setPlayer2Score] = useState(match.player2_score || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const player1 = tournament.is_team_tournament
    ? participants.find((p:any) => p.id === match.player1_id)
    : participants.find((p:any) => p.publicKey === match.player1_id)

  const player2 = tournament.is_team_tournament
    ? participants.find((p:any) => p.id === match.player2_id)
    : participants.find((p:any) => p.publicKey === match.player2_id)

  const player1Name = tournament.is_team_tournament ? player1?.name || "TBD" : player1?.username || "TBD"

  const player2Name = tournament.is_team_tournament ? player2?.name || "TBD" : player2?.username || "TBD"

  const player1Avatar = tournament.is_team_tournament ? player1?.logo_image : player1?.avatar_url

  const player2Avatar = tournament.is_team_tournament ? player2?.logo_image : player2?.avatar_url

  const player1Fallback = tournament.is_team_tournament
    ? player1?.name?.slice(0, 2) || "?"
    : player1?.username?.slice(0, 2) || "?"

  const player2Fallback = tournament.is_team_tournament
    ? player2?.name?.slice(0, 2) || "?"
    : player2?.username?.slice(0, 2) || "?"

  const handleSubmit = async (e:any) => {
    e.preventDefault()

    if (!match.player1_id || !match.player2_id) {
      toast({
        title: "Error",
        description: "Both participants must be assigned to this match before reporting scores.",
        variant: "destructive",
      })
      return
    }

    if (player1Score === player2Score) {
      toast({
        title: "Error",
        description: "Scores cannot be tied. Please enter different scores for each player.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await reportMatchScore(match.id, player1Score, player2Score)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.message || "Failed to report match score.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: result.message || "Match score reported successfully.",
        })

        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error) {
      console.error("Error reporting match score:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-[#333] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Report Match Score</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center space-y-2">
              <Avatar className="h-16 w-16 border border-primary">
                <AvatarImage src={player1Avatar || "/placeholder.svg?height=64&width=64"} />
                <AvatarFallback>{player1Fallback}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium text-center">{player1Name}</p>
              <Input
                type="number"
                min="0"
                max="999"
                value={player1Score}
                onChange={(e) => setPlayer1Score(Number.parseInt(e.target.value) || 0)}
                className="w-16 text-center bg-[#222] border-[#444]"
                required
              />
            </div>

            <div className="text-xl font-bold">VS</div>

            <div className="flex flex-col items-center space-y-2">
              <Avatar className="h-16 w-16 border border-primary">
                <AvatarImage src={player2Avatar || "/placeholder.svg?height=64&width=64"} />
                <AvatarFallback>{player2Fallback}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium text-center">{player2Name}</p>
              <Input
                type="number"
                min="0"
                max="999"
                value={player2Score}
                onChange={(e) => setPlayer2Score(Number.parseInt(e.target.value) || 0)}
                className="w-16 text-center bg-[#222] border-[#444]"
                required
              />
            </div>
          </div>

          <div className="text-sm text-gray-400">
            <p>
              Round {match.round}, Match {match.match_order}
            </p>
            <p className="mt-1">The winner will advance to the next round. This action cannot be undone.</p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#00FFA9] hover:bg-[#00D48F] text-black font-bold"
              disabled={isSubmitting || !match.player1_id || !match.player2_id}
            >
              {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
              {isSubmitting ? "Submitting..." : "Submit Score"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


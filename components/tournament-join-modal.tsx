"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface JoinTournamentModalProps {
  isOpen: boolean
  onClose: () => void
  tournamentId: string
  tournamentName: string
  entryFee: number
}

export function JoinTournamentModal({
  isOpen,
  onClose,
  tournamentId,
  tournamentName,
  entryFee,
}: JoinTournamentModalProps) {
  const { toast } = useToast()
  const [isJoining, setIsJoining] = useState(false)

  const handleJoinTournament = async () => {
    setIsJoining(true)
    try {
      // TODO: Implement the API call to join the tournament
      console.log(`Joining tournament ${tournamentId}`)
      toast({
        title: "Joined Tournament",
        description: "You have successfully joined the tournament.",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error joining the tournament. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Tournament</DialogTitle>
          <DialogDescription>Are you sure you want to join the tournament "{tournamentName}"?</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>Entry Fee: {entryFee} GAME tokens</p>
          <p>Please ensure you have enough GAME tokens in your wallet before joining.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleJoinTournament} disabled={isJoining}>
            {isJoining ? "Joining..." : "Join Tournament"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


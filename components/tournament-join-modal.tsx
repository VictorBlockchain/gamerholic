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
import { useWallet } from "@solana/wallet-adapter-react"

interface JoinTournamentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: ()=> void
  tournamentId: number
  tournamentName: string
  entryFee: number
  money:number
  isJoining:boolean
}

export function JoinTournamentModal({
  isOpen,
  onClose,
  onConfirm,
  tournamentId,
  tournamentName,
  entryFee,
  money,
  isJoining
}: JoinTournamentModalProps) {
  const { toast } = useToast()
  const { publicKey }:any = useWallet()


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Tournament</DialogTitle>
          <DialogDescription>Are you sure you want to join the tournament "{tournamentName}"?</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>Entry Fee: {entryFee} {money==1 && (<span>SOL</span>)} {money==2 && (<span>GAMER</span>)}</p>
          <p>Please ensure you have enough in your deposit wallet before joining.</p>
          <p>By joining you agree to the rules of the tournament. Not playing a match will lead to your forfeit. Entry fee is not refundable unless the tournament is canceled.</p>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isJoining}>
            {isJoining ? "Joining..." : "Join Tournament"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


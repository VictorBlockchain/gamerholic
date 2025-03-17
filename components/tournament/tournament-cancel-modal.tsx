"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

export function TournamentCancelModal({ tournament, isOpen, onClose, onSuccess }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Only allow cancellation if tournament is in "upcoming" status
  const canCancel = tournament.status === "upcoming"

  const handleCancel = async () => {
    if (!canCancel) {
      toast({
        title: "Cannot Cancel",
        description: "This tournament cannot be cancelled because it has already started or is completed.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("tournaments")
        .update({
          status: "cancelled",
        })
        .eq("game_id", tournament.game_id)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Tournament cancelled successfully.",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error cancelling tournament:", error)
      toast({
        title: "Error",
        description: "Failed to cancel tournament. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canCancel) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-[#111] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cannot Cancel Tournament</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>This tournament cannot be cancelled because it has already started or is completed.</p>
          </div>

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-500">Cancel Tournament</DialogTitle>
          <DialogDescription className="text-gray-400">
            Are you sure you want to cancel this tournament? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="font-bold">{tournament.title}</p>
          <p className="text-sm text-gray-400 mt-1">
            {tournament.participants?.length || 0} {tournament.is_team_tournament ? "teams" : "players"} registered
          </p>

          <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-md">
            <p className="text-sm">Cancelling this tournament will:</p>
            <ul className="text-sm list-disc list-inside mt-2 space-y-1">
              <li>Mark the tournament as cancelled</li>
              <li>Notify all registered participants</li>
              <li>Return any entry fees to participants (if applicable)</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Go Back
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
            {isSubmitting ? "Cancelling..." : "Yes, Cancel Tournament"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CancelTournamentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  tournamentTitle: string
}

export function CancelTournamentModal({ isOpen, onClose, onConfirm, tournamentTitle }: CancelTournamentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Tournament</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel the tournament "{tournamentTitle}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
  import { AlertTriangle } from "lucide-react"
  
  interface MutualCancelModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (publicKey: string) => void
    publicKey: string
  }
  
  export function MutualCancelModal({ isOpen, onClose, onConfirm, publicKey }: MutualCancelModalProps) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-primary flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              Mutual Cancellation Request
            </AlertDialogTitle>
            <AlertDialogDescription className="text-primary/80">
              Your opponent has requested to mutually cancel the game. The game service fee will still apply.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onClose} className="bg-gray-700 text-primary hover:bg-gray-600">
              Decline
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onConfirm(publicKey)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  
  
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
  import { Gamepad, DollarSign } from "lucide-react"
  
  export function AcceptChallengeModal({ isOpen, onClose, onConfirm, onReject, challengeDetails }:any) {
    if (!challengeDetails) return null
  
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-primary">Accept Challenge</AlertDialogTitle>
            <AlertDialogDescription className="text-primary/80">
              Are you ready to face off against {challengeDetails.player2.username}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Gamepad className="w-5 h-5 text-primary" />
                <span className="text-primary">
                  {challengeDetails.game} - {challengeDetails.console}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-primary font-bold">{challengeDetails.amount} GAME</span>
              </div>
            </div>
            <p className="text-sm text-primary/70">
              Accepting this challenge will deduct {challengeDetails.amount} GAME from your balance.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onClose} className="bg-gray-700 text-primary hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onReject}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
            >
              Reject Challenge
            </AlertDialogAction>
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              Accept Challenge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  
  
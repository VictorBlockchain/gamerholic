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
  
  export function ChallengeCancelModal({ isOpen, onClose, onConfirm, challengeDetails }) {
    if (!challengeDetails) return null
  
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-primary">Cancel Challenge</AlertDialogTitle>
            <AlertDialogDescription className="text-primary/80">
              Are you sure you want to cancel your challenge against {challengeDetails.player2.username}?
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
              This action cannot be undone. The challenge will be removed from both players' lists.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onClose} className="bg-gray-700 text-primary hover:bg-gray-600">
              Keep Challenge
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
            >
              Cancel Challenge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  
  
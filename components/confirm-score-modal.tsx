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
  import { CheckCircle, X, AlertTriangle } from "lucide-react"
  
  interface ConfirmScoreModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    onDispute: () => void
    player1Name: string
    player2Name: string
    initialPlayer1Score: number
    initialPlayer2Score: number
    }
  
  export function ConfirmScoreModal({
    isOpen,
    onClose,
    onConfirm,
    onDispute,
    player1Name,
    player2Name,
    initialPlayer1Score,
    initialPlayer2Score,
  }: ConfirmScoreModalProps) {

    const [player1Score, setPlayer1Score] = useState<number>(initialPlayer1Score)
    const [player2Score, setPlayer2Score] = useState<number>(initialPlayer2Score)
      console.log(player1Name, player2Name, initialPlayer1Score, initialPlayer2Score)
    return (
    
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-primary/20 text-primary">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Confirm Match Score
            </DialogTitle>
            <DialogDescription className="text-primary/70">
              Please confirm the reported score for your match.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold">{player1Name}</div>
              <div className="text-2xl font-bold text-green-400">{player1Score}</div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold">{player2Name}</div>
              <div className="text-2xl font-bold text-green-400">{player2Score}</div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {/* {alert(player1Name)} */}
            {/* <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-background/50 border-primary/20 text-primary hover:bg-primary/20"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button> */}
            <Button
              onClick={onDispute}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Dispute Score
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    )
  }
  
  
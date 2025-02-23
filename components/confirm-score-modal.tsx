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
    isScoring: boolean
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
    isScoring
  }: ConfirmScoreModalProps) {

    const [player1Score, setPlayer1Score] = useState<number>(initialPlayer1Score)
    const [player2Score, setPlayer2Score] = useState<number>(initialPlayer2Score)
      // console.log(player1Name, player2Name, initialPlayer1Score, initialPlayer2Score)
    return (
    
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-primary/20 text-primary">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Confirm Match Score
            </DialogTitle>
            <DialogDescription className="text-primary/70">
             <div className="flex justify-centre items-center mb-4">
              <div className="text-2xl font-bold text-green-400 text-center">Winner:  
                {player1Score>player2Score && (
                  <span>{player1Name}</span>
                )}
                {player2Score>player1Score && (
                  <span>{player2Name}</span>
                )}
              </div>
             </div>
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

            {isScoring && (
              <>
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-400"></div>
                    {/* <p className="text-2xl font-bold mt-4">confirming score...</p> */}
                  </div>              
                  </>
            )}
            {!isScoring && (
              <>
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
              </>
            )}
          
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    )
  }
  
  
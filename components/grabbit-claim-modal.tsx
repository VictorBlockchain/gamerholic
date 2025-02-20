import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "@/components/ui/dialog"
  import { Button } from "@/components/ui/button"
  import { Trophy } from "lucide-react"
  
  interface GrabbitClaimModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    userName: string
    prizeAmount: number
    isClaiming: boolean
  }
  
  export function GrabbitClaimModal({ isOpen, onClose, onConfirm, userName, prizeAmount, isClaiming }: GrabbitClaimModalProps) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold flex items-center justify-center">
              <Trophy className="w-8 h-8 mr-2" />
              Congratulations!
            </DialogTitle>
            <DialogDescription className="text-xl text-center text-white">{userName}, You Won!</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-4xl font-bold text-center">{prizeAmount} SOL</p>
          </div>
          <DialogFooter>
            <Button
              onClick={onConfirm} disabled={isClaiming}
              className="w-full bg-white text-orange-500 hover:bg-gray-100 font-bold py-3 px-6 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {isClaiming ? "claiming..." : "Claim Your Prize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
  
  
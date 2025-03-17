import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface SuccessModalProps {
  isOpen: boolean; // Correct type for isOpen
  onClose: () => void; // Correct prop for closing the modal
  message: string;
}

export function ErrorModal({ isOpen, onClose, message }: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-red-900/90 to-pink-900/90 border-2 border-red-500/50 rounded-lg shadow-lg shadow-red-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-red-400 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Error!
          </DialogTitle>
          <DialogDescription className="text-red-200">{message}</DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end">
        <Button onClick={onClose} className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-gray-700">
          Close
        </Button>

        </div>
      </DialogContent>
    </Dialog>
  )
}


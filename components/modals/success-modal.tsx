import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean; // Correct type for isOpen
  onClose: () => void; // Correct prop for closing the modal
  message: string;
}

export function SuccessModal({ isOpen, onClose, message }: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-green-900/90 to-teal-900/90 border-2 border-green-500/50 rounded-lg shadow-lg shadow-green-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-400 flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-2" />
            Success!
          </DialogTitle>
          <DialogDescription className="text-green-200">{message}</DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-gray-700"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
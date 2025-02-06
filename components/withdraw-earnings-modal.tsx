import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Coins } from "lucide-react"

interface WithdrawEarningsModalProps {
  isOpen: boolean
  onClose: () => void
  onWithdraw: (amount: number) => void
  maxAmount: number
}

export function WithdrawEarningsModal({ isOpen, onClose, onWithdraw, maxAmount }: WithdrawEarningsModalProps) {
  const [amount, setAmount] = useState("")

  const handleWithdraw = () => {
    const withdrawAmount = Number.parseFloat(amount)
    if (withdrawAmount > 0 && withdrawAmount <= maxAmount) {
      onWithdraw(withdrawAmount)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-2 border-primary/50 rounded-lg shadow-lg shadow-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center">
            <Coins className="w-6 h-6 mr-2" />
            Withdraw Earnings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the amount you want to withdraw.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="col-span-3 bg-background/50 border-primary/20 focus:border-primary focus:ring-primary"
            />
          </div>
          <p className="text-sm text-muted-foreground">Available balance: {maxAmount.toFixed(2)} SOL</p>
        </div>
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            disabled={Number.parseFloat(amount) <= 0 || Number.parseFloat(amount) > maxAmount}
          >
            Withdraw
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


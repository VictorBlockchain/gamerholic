"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SwapConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fromCurrency: string
  toCurrency: string
  fromAmount: string
  toAmount: string
  exchangeRate: number
  fee: number
}

export function SwapConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
  exchangeRate,
  fee,
}: SwapConfirmModalProps) {
  // Calculate the fee amount
  const feeAmount = Number.parseFloat(fromAmount) * (fee / 100)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#111] border-[#333] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Confirm Swap</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-[#1A1A1A] p-4 rounded-md border border-[#333]">
            <div className="flex justify-between mb-3">
              <span className="text-gray-400">You Send</span>
              <span className="font-medium">
                {fromAmount} {fromCurrency}
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-400">You Receive</span>
              <span className="font-medium">
                {toAmount} {toCurrency}
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-400">Exchange Rate</span>
              <span>
                1 {fromCurrency} = {exchangeRate} {toCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fee ({fee}%)</span>
              <span>
                {feeAmount.toFixed(fromCurrency === "SOL" ? 6 : 2)} {fromCurrency}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            <p>
              By confirming this swap, you agree to the terms and conditions of the service. The final amount may vary
              slightly due to market fluctuations.
            </p>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent border-[#333] hover:bg-[#252525] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-[#9945FF] to-[#00FFA9] hover:opacity-90 text-black font-bold"
          >
            Confirm Swap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


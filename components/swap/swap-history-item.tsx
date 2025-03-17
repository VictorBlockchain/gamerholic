import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface Transaction {
  id: string
  fromCurrency: string
  toCurrency: string
  fromAmount: number
  toAmount: number
  status: "pending" | "completed" | "failed"
  date: Date
  txHash: string
}

interface SwapHistoryItemProps {
  transaction: Transaction
}

export function SwapHistoryItem({ transaction }: SwapHistoryItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-500 border-green-500/50"
      case "pending":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
      case "failed":
        return "bg-red-500/20 text-red-500 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/50"
    }
  }

  return (
    <div className="bg-[#1A1A1A] p-4 rounded-md border border-[#333] hover:border-[#444] transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <span className="text-white font-medium">
            {transaction.fromAmount} {transaction.fromCurrency}
          </span>
          <span className="mx-2 text-gray-500">→</span>
          <span className="text-white font-medium">
            {transaction.toAmount} {transaction.toCurrency}
          </span>
        </div>
        <Badge className={`${getStatusColor(transaction.status)} capitalize`}>{transaction.status}</Badge>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{formatDistanceToNow(transaction.date, { addSuffix: true })}</span>
        <Link
          href={`https://solscan.io/tx/${transaction.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center hover:text-[#00FFA9] transition-colors"
        >
          View <ExternalLink className="h-3 w-3 ml-1" />
        </Link>
      </div>
    </div>
  )
}


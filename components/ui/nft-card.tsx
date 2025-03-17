"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface NFTCardProps {
  name: string
  image: string
  collection?: string
  price?: {
    amount: string | number
    currency?: string
  }
  creator?: {
    name: string
    avatar?: string
  }
  badge?: {
    text: string
    color?: string
  }
  onBid?: () => void
  className?: string
}

export function NFTCard({ name, image, collection, price, creator, badge, onBid, className }: NFTCardProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden hover:border-[#555] transition-all group",
        className,
      )}
    >
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA9] to-[#FF007A] opacity-30 group-hover:opacity-70 blur-md transition duration-300"></div>
        <div className="relative p-4">
          <div className="aspect-square rounded-2xl overflow-hidden mb-4 border border-[#333] group-hover:border-[#00FFA9]/50 transition-colors">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          {badge && (
            <Badge className={cn("absolute top-6 left-6", badge.color || "bg-[#00FFA9] text-black")}>
              {badge.text}
            </Badge>
          )}
          <h3 className="text-xl font-bold mb-1">{name}</h3>
          {collection && <p className="text-gray-400 text-sm mb-3">{collection}</p>}
          <div className="flex justify-between items-center">
            {price && (
              <div>
                <p className="text-xs text-gray-400">CURRENT BID</p>
                <p className="text-lg font-bold text-[#00FFA9]">
                  {price.amount} {price.currency || "SOL"}
                </p>
              </div>
            )}
            {onBid && (
              <Button
                onClick={onBid}
                className="bg-[#111] hover:bg-[#222] border border-[#00FFA9] text-[#00FFA9] rounded-full"
              >
                Place Bid
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


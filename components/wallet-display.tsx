"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { supabase } from "@/lib/supabase"

export function WalletDisplay() {
  const { publicKey } = useWallet()
  const [balance, setBalance] = useState(0)
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    if (publicKey) {
      fetchBalance()
      fetchCredits()
    }
  }, [publicKey])

  const fetchBalance = async () => {
    // Fetch SOL balance from Solana network
    // This is a placeholder, replace with actual balance fetching logic
    setBalance(1.234)
  }

  const fetchCredits = async () => {
    if (publicKey) {
      const { data, error } = await supabase.from("users").select("credits").eq("publicKey", publicKey.toBase58()).single()

      if (error) {
        console.error("Error fetching user credits:", error)
      } else {
        setCredits(data.credits || 0)
      }
    }
  }
  
  return (
    <Button variant="outline" className="bg-background/50 backdrop-blur-sm">
      <Wallet className="mr-2 h-4 w-4" />
      {credits.toFixed(4)} GAME
    </Button>
  )
}


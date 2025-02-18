"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { supabase } from "@/lib/supabase"
import { createDepositAddress } from "@/lib/depositAddresses"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DepositForm() {
  const { publicKey } = useWallet()
  const [depositAddress, setDepositAddress] = useState("")

  useEffect(() => {
    if (publicKey) {
      fetchOrCreateDepositAddress()
    }
  }, [publicKey])

  const fetchOrCreateDepositAddress = async () => {
    if (!publicKey) return

    const { data, error } = await supabase
      .from("users")
      .select("deposit_wallet")
      .eq("publicKey", publicKey.toBase58())
      .maybeSingle()

    if (error || !data) {
      // If no deposit address exists, create a new one
      const newAddress = await createDepositAddress(publicKey.toBase58())
      setDepositAddress(newAddress)
    } else {
      setDepositAddress(data.deposit_wallet)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit SOL</CardTitle>
        <CardDescription>Send SOL to your unique deposit address to add credits to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {depositAddress ? (
          <div>
            <p className="mb-2">Your unique deposit address:</p>
            <code className="block p-2 bg-muted rounded">{depositAddress}</code>
            <p className="mt-4 text-sm text-muted-foreground">
              Send any amount of SOL to this address. Your account will be credited automatically after the transaction
              is confirmed.
            </p>
          </div>
        ) : (
          <p>Connect your wallet to get a deposit address.</p>
        )}
      </CardContent>
    </Card>
  )
}


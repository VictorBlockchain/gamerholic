import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { refundPlayers } from "@/lib/tournament-utils"
import { CryptoManager } from "@/lib/server/cryptoManager"
CryptoManager.initialize()

export async function POST(req: Request) {
  try {
    const { tournamentId } = await req.json()

    // Get tournament details
  const { data: wallet, error } = await supabase.from("wallets").select("*").eq("tournament_id", tournamentId).single()
  
  if (error) throw new Error(`Failed to fetch wallet for tournament ${tournamentId}: ${error.message}`)
  if (!wallet) throw new Error(`No wallet found for tournament ${tournamentId}`)
  
  const privateKey = CryptoManager.decrypt(wallet.encrypted_key, wallet.iv)
  console.log(privateKey)
    // Get players
    

    return NextResponse.json({ message: "Tournament canceled successfully" })
  } catch (error) {
    console.error("Error canceling tournament:", error)
    return NextResponse.json({ error: "Failed to cancel tournament" }, { status: 500 })
  }
}


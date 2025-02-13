import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Keypair } from "@solana/web3.js"
import { CryptoManager } from "@/lib/server/cryptoManager"

const cryptoManager = new CryptoManager()

export async function POST(req: Request) {
  try {
    const {
      title,
      game,
      console,
      entry_fee,
      prize_percentage,
      first_place_percentage,
      second_place_percentage,
      third_place_percentage,
      rules,
      start_date,
      prize_type,
      max_players,
      image_url,
      host_id,
    } = await req.json()

    // Generate a new Solana keypair for the tournament wallet
    const tournamentWallet = Keypair.generate()
    const publicKey = tournamentWallet.publicKey.toString()
    const privateKey = Buffer.from(tournamentWallet.secretKey).toString("hex")

    // Encrypt the private key
    const { iv, encrypted } = cryptoManager.encrypt(privateKey)

    // Insert the new tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .insert({
        title,
        game,
        console,
        entry_fee,
        prize_percentage,
        first_place_percentage,
        second_place_percentage,
        third_place_percentage,
        rules,
        start_date,
        prize_type,
        max_players,
        image_url,
        host_id,
        status: "upcoming",
      })
      .select()
      .single()

    if (tournamentError) throw tournamentError

    // Insert the wallet information
    const { error: walletError } = await supabase.from("wallets").insert({
      type: "tournament",
      public_key: publicKey,
      encrypted_key: encrypted,
      iv,
      tournament_id: tournament.id,
    })

    if (walletError) throw walletError

    return NextResponse.json({ success: true, tournament })
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
}


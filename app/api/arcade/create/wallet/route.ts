import { NextResponse } from "next/server"
import { validateGameCode } from "@/lib/codeValidation"
import { supabase } from "@/lib/supabase"
import crypto from "crypto";
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { CryptoManager } from "@/lib/server/cryptoManager"
import { sendAndConfirmTransaction } from "@/lib/solana"
CryptoManager.initialize()

const fetchWalletData = async (game_id: string) => {
    const { data, error } = await supabase.from("wallets").select("*").eq("arcade_id", game_id).maybeSingle()
    
    if (error) {
      console.error(`Error fetching wallet data`, error)
      return null
    }
    
    return data
  }
export async function POST(req: Request) {
  try {
    
    const { game_id } = await req.json();
    let data = await fetchWalletData(game_id);

    if (!data) {
      const keypair = Keypair.generate();
      const privateKeyHex = Buffer.from(keypair.secretKey).toString("hex");

      // Encrypt the private key using the unified encryption function
      const { iv, encrypted } = CryptoManager.encrypt(privateKeyHex);

      // Use upsert to avoid duplicates
      const { error: walletError } = await supabase.from("wallets").upsert(
        {
          type: "arcade",
          public_key: keypair.publicKey.toString(),
          encrypted_key: encrypted,
          iv: iv,
          arcade_id: game_id,
        },
        { onConflict: "arcade_id" } // Specify the conflict resolution column
      );

      if (walletError) throw walletError;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error creating game:", error)
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 })
  }
}


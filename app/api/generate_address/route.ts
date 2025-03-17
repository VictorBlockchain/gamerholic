import { NextResponse } from "next/server"
import { Keypair } from "@solana/web3.js"
import crypto from "crypto";
import { CryptoManager } from "@/lib/server/cryptoManager"
import { supabase } from "@/lib/supabase"

CryptoManager.initialize()

export async function POST(req: Request) {
  try {
    const { user, type } = await req.json();
    const keypair = Keypair.generate();
    const privateKeyHex = Buffer.from(keypair.secretKey).toString("hex");
    
    // // Encrypt the private key using the unified encryption function
    const { iv, encrypted } = CryptoManager.encrypt(privateKeyHex);
    if(type==1){
          // First check if the player exists
          const { data: existingWallet } = await supabase
            .from("wallet_players")
            .select("*")
            .eq("player", user)
            .maybeSingle()

          // Only proceed with insert if no wallet exists
          if (!existingWallet) {
            const walletData = { 
              wallet: keypair.publicKey.toString(), 
              sesime: encrypted, 
              iv: iv,
              player: user 
            }

            const { error: insertError } = await supabase
              .from("wallet_players")
              .insert(walletData)

            if (insertError) {
              console.log(insertError)
              return NextResponse.json({success:false, error: "Failed to create wallet" }, { status: 500 })
            }
          } else {

            return NextResponse.json({success:false, error: "Wallet already exists for this player" }, { status: 400 })
          }
    }
    return NextResponse.json({ success: true})
  
  } catch (e) {
    console.error("Error in /api/address:", e)
    return NextResponse.json({ error: "Failed to generate address" }, { status: 500 })
  }
}


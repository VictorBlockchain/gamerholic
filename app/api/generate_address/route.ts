import { NextResponse } from "next/server"
import { Keypair } from "@solana/web3.js"
import crypto from "crypto";
import { CryptoManager } from "@/lib/server/cryptoManager"
import { supabase } from "@/lib/supabase"

const cryptoManager = new CryptoManager();

export async function POST(req: Request) {
  try {
    const { user, type } = await req.json();
    const keypair = Keypair.generate();
    const privateKeyHex = Buffer.from(keypair.secretKey).toString("hex");
    
    // // Encrypt the private key using the unified encryption function
    const { iv, encrypted } = CryptoManager.encrypt(privateKeyHex);
    if(type==1){

          const { error: updateError } = await supabase.from("users").update({ deposit_wallet: keypair.publicKey.toString(), deposit_wallet_encryptedKey: encrypted, iv:iv }).eq("publicKey", user)
      
    }
    return NextResponse.json({ success: true, iv:iv, key: encrypted, address: keypair.publicKey.toString() })
  
  } catch (e) {
    console.error("Error in /api/address:", e)
    return NextResponse.json({ error: "Failed to generate address" }, { status: 500 })
  }
}


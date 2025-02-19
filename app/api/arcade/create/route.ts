import { NextResponse } from "next/server"
import { validateGameCode } from "@/lib/codeValidation"
import { supabase } from "@/lib/supabase"
import crypto from "crypto";
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { CryptoManager } from "@/lib/server/cryptoManager"
import { sendAndConfirmTransaction } from "@/lib/solana"

const cryptoManager = new CryptoManager();
const connection:any = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL)

const fetchUserData = async (publicKey: string) => {
  const { data, error } = await supabase.from("users").select("*").eq("publicKey", publicKey).single()
  
  if (error) {
    console.error(`Error fetching data for ${publicKey}:`, error)
    return null
  }
  
  return data
}

const fetchPlatformSettings = async () => {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("wallet_fee, fee_esports")
    .eq("id", 1)
    .single()
  
  if (error) {
    console.error("Error fetching platform settings:", error)
    return null
  }
  
  return data
}

async function transferSOL(fromPrivateKey: string, toAddress: string, amount: number) {
  try {
    const secretKey = Uint8Array.from(Buffer.from(fromPrivateKey, "hex"));
    const senderKeypair = Keypair.fromSecretKey(secretKey);
    const receiverPubKey = new PublicKey(toAddress);
        
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: receiverPubKey,
            lamports: amount * 1e9, // Convert SOL to lamports
        }),
    )
    
    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [senderKeypair]
    );
    console.log(signature)
    return signature
  
  } catch (error) {
    console.error("Error transferring SOL:", error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    
    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const playFee = formData.get("playFee") as string
    const topPayout = formData.get("topPayout") as string
    const category = formData.get("category") as string
    const rules = formData.get("rules") as string
    const gameCode = formData.get("gameCode") as string
    const gameCss = formData.get("gameCss") as string
    const creatorWallet = formData.get("creatorWallet") as string
    const thumbnailImage = formData.get("image") as File
    const fullSizeImage = formData.get("fullSizeImage") as File
    let fee_txid:any;

    // Validate the game code
    const validationResult = validateGameCode(gameCode)
    if (!validationResult.isValid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 })
    }

    const platformSettings = await fetchPlatformSettings()
    if (!platformSettings) {
      return NextResponse.json({ success: false, message: "Failed to fetch platform settings" })
    }
    
    const { wallet_fee, fee_arcade_create }:any = platformSettings
    
    const userData = await fetchUserData(creatorWallet)
        if (!userData) {
      return NextResponse.json({ success: false, message: "Failed to fetch user data" })
    }
    const userPrivateKey = CryptoManager.decrypt(userData.deposit_wallet_encryptedKey, userData.iv)
    if(fee_arcade_create>0){
        
      fee_txid = await transferSOL(userPrivateKey, wallet_fee, fee_arcade_create)
      if(!fee_txid){
        return NextResponse.json({ success: false, message: "error paying fee" })
      }
    }
    // Upload thumbnail image
    const { data: thumbnailData, error: thumbnailError } = await supabase.storage
      .from("images")
      .upload(`thumbnails/${Date.now()}-${thumbnailImage.name}`, thumbnailImage)
    
    if (thumbnailError) throw new Error("Failed to upload thumbnail image")

    // Upload full-size image
    const { data: fullSizeData, error: fullSizeError } = await supabase.storage
      .from("images")
      .upload(`full-size/${Date.now()}-${fullSizeImage.name}`, fullSizeImage)

    if (fullSizeError) throw new Error("Failed to upload full-size image")

    // Get public URLs for the uploaded images
    const thumbnailUrl = supabase.storage.from("images").getPublicUrl(thumbnailData.path).data.publicUrl
    const fullSizeUrl = supabase.storage.from("images").getPublicUrl(fullSizeData.path).data.publicUrl
    
    const arcadeWallet = Keypair.generate()
    const publicKey = arcadeWallet.publicKey.toString()
    const privateKey = Buffer.from(arcadeWallet.secretKey).toString("hex")
    
    // Encrypt the private key
    const { iv, encrypted } = CryptoManager.encrypt(privateKey)
    
    // // Insert game data into the database
    const { data:arcade, error: arcadeError }:any = await supabase
      .from("arcade")
      .insert({
        title: title,
        description: description,
        play_fee: Number.parseFloat(playFee),
        top_payout: Number.parseInt(topPayout),
        category: category,
        rules: rules,
        game_code: gameCode,
        game_css: gameCss,
        creator_wallet: creatorWallet,
        thumbnail_image: thumbnailUrl,
        full_size_image: fullSizeUrl,
        status: 1,
        fee_txid: fee_txid
      })
      .select()
        
      if (arcadeError) throw arcadeError
      // Insert the wallet information
      const { error: walletError } = await supabase.from("wallets").insert({
        type: "arcade",
        public_key: publicKey,
        encrypted_key: encrypted,
        iv,
        arcade_id: arcade.game_id,
        esports_id: null,
        tourmament_id: null,
        grabbit_id: null
      })
    if (walletError) throw walletError
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error creating game:", error)
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 })
  }
}


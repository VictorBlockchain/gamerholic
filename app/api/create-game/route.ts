import { NextResponse } from "next/server"
import { validateGameCode } from "@/lib/codeValidation"
import { supabase } from "@/lib/supabase"
import crypto from "crypto";
import { Keypair } from "@solana/web3.js"


const IV_LENGTH = 16; // AES block size

// Encryption and Decryption Class
class CryptoManager {
    private ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ;
  
  constructor() {
    if (!process.env.ENCRYPTION_KEY) {
      this.ENCRYPTION_KEY = crypto.randomBytes(32); // 256-bit key
      console.log("Generated ENCRYPTION_KEY:", this.ENCRYPTION_KEY.toString("hex"));
    } else {
      this.ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    }
  }
  
  encrypt(text: string): { iv: string; encrypted: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", this.ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString("hex"), encrypted: encrypted.toString("hex") };
  }
  
  decrypt(encrypted: string, iv: string): string {
    const ivBuffer = Buffer.from(iv, "hex");
    const encryptedBuffer = Buffer.from(encrypted, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.ENCRYPTION_KEY, ivBuffer);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
  }
}

const cryptoManager = new CryptoManager();

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
      

    // Validate the game code
    const validationResult = validateGameCode(gameCode)
    if (!validationResult.isValid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 })
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
    
    const keypair = Keypair.generate();
    const privateKeyHex = Buffer.from(keypair.secretKey).toString("hex");
    
    // // Encrypt the private key using the unified encryption function
    const { iv, encrypted } = cryptoManager.encrypt(privateKeyHex);
    
    // // Insert game data into the database
    const { data, error } = await supabase
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
        game_wallet: keypair.publicKey.toString(),
        game_wallet_encrypted_key: encrypted,
        game_wallet_iv: iv,
        status: 1
      })
      .select()
        
    if (error) throw error
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error creating game:", error)
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 })
  }
}


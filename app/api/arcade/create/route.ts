import { NextResponse } from "next/server";
import { validateGameCode } from "@/lib/codeValidation";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { CryptoManager } from "@/lib/server/cryptoManager";
import { sendAndConfirmTransaction } from "@/lib/solana";

CryptoManager.initialize();

const rpc:any = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
const connection = new Connection(rpc);

const fetchUserData = async (publicKey:any) => {
  const { data, error } = await supabase.from("users").select("*").eq("publicKey", publicKey).single();
  if (error) {
    console.error(`Error fetching data for ${publicKey}:`, error);
    return null;
  }
  return data;
};

const fetchPlatformSettings = async () => {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("wallet_fee, fee_arcade_create")
    .eq("id", 1)
    .single();
  if (error) {
    console.error("Error fetching platform settings:", error);
    return null;
  }
  return data;
};

async function transferSOL(fromPrivateKey:any, toAddress:any, amount:any) {
  try {
    const secretKey = Uint8Array.from(Buffer.from(fromPrivateKey, "hex"));
    const senderKeypair = Keypair.fromSecretKey(secretKey);
    const receiverPubKey = new PublicKey(toAddress);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: receiverPubKey,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    );
    const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
    return signature;
  } catch (error) {
    console.error("Error transferring SOL:", error);
    throw error;
  }
}

export async function POST(request:any) {
  try {
    const formData = await request.formData();
    const requiredFields = ["title", "description", "playFee", "topPayout", "category", "rules", "gameCode", "creatorWallet", "image", "fullSizeImage"];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        console.log(`Missing required field: ${field}`)
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    
    const title = formData.get("title");
    const description = formData.get("description");
    const playFee = formData.get("playFee");
    const topPayout = formData.get("topPayout");
    const category = formData.get("category");
    const rules = formData.get("rules");
    const gameCode = formData.get("gameCode");
    const gameCss = formData.get("gameCss");
    const creatorWallet = formData.get("creatorWallet");
    const thumbnailImage = formData.get("image");
    const fullSizeImage = formData.get("fullSizeImage");

    const validationResult = validateGameCode(gameCode);
    if (!validationResult.isValid) {
      console.log("error game code")
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const platformSettings = await fetchPlatformSettings();
    if (!platformSettings) {
      console.log("error 1")
      return NextResponse.json({ error: "Failed to fetch platform settings" }, { status: 500 });
    }

    const { wallet_fee, fee_arcade_create } = platformSettings;
    const userData = await fetchUserData(creatorWallet);
    if (!userData) {
      console.log("error 2")

      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }

    const userPrivateKey = CryptoManager.decrypt(userData.deposit_wallet_encryptedKey, userData.iv);
    let fee_txid;
    if (fee_arcade_create > 0) {
      try {
        fee_txid = await transferSOL(userPrivateKey, wallet_fee, fee_arcade_create);
        if (!fee_txid) {
          console.log("error 3")

          return NextResponse.json({ error: "Failed to pay fee" }, { status: 500 });
        }
      } catch (error) {
        console.error("Error transferring SOL:", error);
        return NextResponse.json({ error: "Failed to pay fee" }, { status: 500 });
      }
    }

    const { data: thumbnailData, error: thumbnailError } = await supabase.storage
      .from("images")
      .upload(`thumbnails/${Date.now()}-${thumbnailImage.name}`, thumbnailImage);
    if (thumbnailError) {
      console.error("Failed to upload thumbnail image:", thumbnailError);
      return NextResponse.json({ error: "Failed to upload thumbnail image" }, { status: 500 });
    }

    const { data: fullSizeData, error: fullSizeError } = await supabase.storage
      .from("images")
      .upload(`full-size/${Date.now()}-${fullSizeImage.name}`, fullSizeImage);
    if (fullSizeError) {
      console.error("Failed to upload full-size image:", fullSizeError);
      return NextResponse.json({ error: "Failed to upload full-size image" }, { status: 500 });
    }

    const thumbnailUrl = supabase.storage.from("images").getPublicUrl(thumbnailData.path).data.publicUrl;
    const fullSizeUrl = supabase.storage.from("images").getPublicUrl(fullSizeData.path).data.publicUrl;
    
    const arcadeWallet = Keypair.generate();
    const publicKey = arcadeWallet.publicKey.toString();
    const privateKey = Buffer.from(arcadeWallet.secretKey).toString("hex");
    const { iv, encrypted } = CryptoManager.encrypt(privateKey);
    
    const { data: arcade, error: arcadeError } = await supabase
      .from("arcade")
      .insert({
        title,
        description,
        play_fee: Number.parseFloat(playFee),
        top_payout: Number.parseInt(topPayout),
        play_time: 3,
        play_money: 1,
        category,
        rules,
        game_code: gameCode,
        game_css: gameCss,
        creator: creatorWallet,
        thumbnail_image: thumbnailUrl,
        full_size_image: fullSizeUrl,
        status: 1,
        fee_txid,
      })
      .select();
    
    if (arcadeError) {
      console.error("Failed to insert arcade data:", arcadeError);
      return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
    }
    
    const { error: walletError } = await supabase.from("wallets").insert({
      type: "arcade",
      public_key: publicKey,
      encrypted_key: encrypted,
      iv,
      arcade_id: arcade[0].game_id,
    });

    if (walletError) {
      console.error("Failed to insert wallet data:", walletError);
      return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
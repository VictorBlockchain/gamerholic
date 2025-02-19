import { NextResponse } from "next/server"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { supabase } from "@/lib/supabase"
import { CryptoManager } from "@/lib/server/cryptoManager"
import { sendAndConfirmTransaction } from "@/lib/solana"

CryptoManager.initialize()
const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com")
const PLATFORM_FEE_PERCENT = 0.03 // 3% platform fee
const GAME_TOKEN_ADDRESS = process.env.GAME_TOKEN_ADDRESS // GAMEr token mint address

const fetchUserData = async (publicKey: string) => {
  const { data, error } = await supabase.from("users").select("*").eq("publicKey", publicKey).single()

  if (error) {
    console.error(`Error fetching data for ${publicKey}:`, error)
    return null
  }
  
  return data
}

const fetchGameData = async (id: string) => {
  const { data, error: fetchError } = await supabase.from("esports").select("*").eq("game_id", id).single()

  if (fetchError) {
    console.error(`Error fetching game data`)
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
    
    const fromKeypair:any = Buffer.from(fromPrivateKey).toString("hex");
    const toPublicKey = new PublicKey(toAddress)
        
    const transaction = new Transaction().add(
      // Main transfer
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amount,
      }),
      // Platform fee transfer
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amount,
      }),
    )
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair])
    return signature

  } catch (error) {
    console.error("Error transferring SOL:", error)
    throw error
  }
}

const transferToken = async (fromPrivateKey: string, toAddress: string, amount: number, mintAddress: string) => {
  const fromKeypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(fromPrivateKey)))
  const mintPublicKey = new PublicKey(mintAddress)

  const toPublicKey = new PublicKey(toAddress)
  const fromTokenAccount = await getAssociatedTokenAddress(mintPublicKey, fromKeypair.publicKey)
  const toTokenAccount = await getAssociatedTokenAddress(mintPublicKey, toPublicKey)

  const transaction = new Transaction().add(
    createTransferInstruction(fromTokenAccount, toTokenAccount, fromKeypair.publicKey, amount, [], TOKEN_PROGRAM_ID),
  )

  const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair])
  console.log("Transaction successful with signature:", signature)
  return signature
}

const updateEsportsRecord = async (publicKey: string, game: string, isWinner: boolean) => {
  const { data, error } = await supabase
    .from("esports_records")
    .select("*")
    .eq("public_key", publicKey)
    .eq("game", game)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error(`Error fetching esports record for ${publicKey}:`, error)
    return
  }

  if (data) {
    const { error: updateError } = await supabase
      .from("esports_records")
      .update({
        wins: isWinner ? data.wins + 1 : data.wins,
        losses: isWinner ? data.losses : data.losses + 1,
        win_streak: isWinner ? data.win_streak + 1 : 0,
        loss_streak: isWinner ? data.loss_streak + 1 : 0
      })
      .eq("public_key", publicKey)
      .eq("game", game)

    if (updateError) {
      console.error(`Error updating esports record for ${publicKey}:`, updateError)
    }
  } else {
    const { error: insertError } = await supabase.from("esports_records").insert({
      public_key: publicKey,
      game: game,
      wins: isWinner ? 1 : 0,
      losses: isWinner ? 0 : 1,
      win_streak: isWinner ? 1 : 0,
      loss_streak: isWinner ? 1 : 0
    })

    if (insertError) {
      console.error(`Error inserting esports record for ${publicKey}:`, insertError)
    }
  }
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json()
    const gameData = await fetchGameData(id)
    let signature:any;

    if (!gameData) {
      return NextResponse.json({ success: false, message: "Game not found" })
    }
    
    if (gameData.status !== 3) {
      return NextResponse.json({
        success: false,
        message: gameData.status === 4 ? "Game already scored" : "Game cannot be scored",
      })
    }

    const platformSettings = await fetchPlatformSettings()
    if (!platformSettings) {
      return NextResponse.json({ success: false, message: "Failed to fetch platform settings" })
    }

    const { wallet_fee, fee_esports } = platformSettings
    const gameFee = gameData.amount * fee_esports

    const player1Data = await fetchUserData(gameData.player1)
    const player2Data = await fetchUserData(gameData.player2)

    if (!player1Data || !player2Data) {
      return NextResponse.json({ success: false, message: "Failed to fetch player data" })
    }

    const winner = gameData.player1score > gameData.player2score ? gameData.player1 : gameData.player2
    const loser = winner === gameData.player1 ? gameData.player2 : gameData.player1

    // Deduct fees from both players
    const player1PrivateKey = CryptoManager.decrypt(player1Data.deposit_wallet_encryptedKey, player1Data.iv)
    const player2PrivateKey = CryptoManager.decrypt(player2Data.deposit_wallet_encryptedKey, player2Data.iv)
    if(gameData.money==1){
            
      
      await transferSOL(player1PrivateKey, wallet_fee, gameFee)
      await transferSOL(player2PrivateKey, wallet_fee, gameFee)
   
      // Transfer the game amount to the winner
      const winnerPrivateKey = winner === gameData.player1 ? player1PrivateKey : player2PrivateKey
      signature =  await transferSOL(
        winner === gameData.player1 ? player2PrivateKey : player1PrivateKey,
        winner,
        gameData.amount - gameFee
      )
      
    }else{
      
      // await transferToken(player1PrivateKey, wallet_fee, gameFee, gameData.token_mint_address)
      // await transferToken(player2PrivateKey, wallet_fee, gameFee, gameData.token_mint_address)
          
      // Transfer the game amount to the winner
      const winnerPrivateKey = winner === gameData.player1 ? player1PrivateKey : player2PrivateKey
      signature = await transferToken(
        winner === gameData.player1 ? player2PrivateKey : player1PrivateKey,
        winner,
        gameData.amount - gameFee,
        gameData.token_mint_address,
      )
  
    }
    
    const { data, error } = await supabase
    .from('esports')
    .update({ txid: signature })
    .eq('game_id', id);

    // Update esports records
    await updateEsportsRecord(winner, gameData.game, true)
    await updateEsportsRecord(loser, gameData.game, false)

    // Update game status to completed
    const { error: updateError } = await supabase.from("esports").update({ status: 4 }).eq("game_id", id)

    if (updateError) {
      console.error("Error updating game status:", updateError)
      return NextResponse.json({ error: "Failed to update game status" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Error in /api/esports/score:", e)
    return NextResponse.json({ error: "Failed to process score" }, { status: 500 })
  }
}


import { NextResponse } from "next/server"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getAssociatedTokenAddress, createTransferInstruction, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { supabase } from "@/lib/supabase"
import { CryptoManager } from "@/lib/server/cryptoManager"
import { sendAndConfirmTransaction } from "@/lib/solana"

CryptoManager.initialize()
const connection:any = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL)
const PLATFORM_FEE_PERCENT = 0.03 // 3% platform fee
const GAME_TOKEN_ADDRESS = process.env.GAMERHOLIC // GAMEr token mint address

const fetchUserData = async (publicKey: string) => {
  const { data, error } = await supabase.from("users").select("*").eq("publicKey", publicKey).single()
  
  if (error) {
    console.error(`Error fetching data for ${publicKey}:`, error)
    return null
  }
  
  return data
}

const fetchGameData = async (game_id: string) => {
  const { data, error: fetchError } = await supabase.from("esports").select("*").eq("game_id", game_id).single()
  
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
    const secretKey = Uint8Array.from(Buffer.from(fromPrivateKey, "hex"));
    const senderKeypair = Keypair.fromSecretKey(secretKey);
    const receiverPubKey = new PublicKey(toAddress);
    
    const lamports = Math.round(amount * 10 ** 9);
    // console.log(lamports)
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: receiverPubKey,
            lamports: lamports, // Convert SOL to lamports
        }),
    )
    
    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [senderKeypair]
    );
    // console.log(signature)
    return signature

  } catch (error) {
    console.error("Error transferring SOL:", error)
    throw error
  }
}

async function transferToken(
    fromKeypair: any,
    toAddress: string,
    amount: number,
    tokenMint: PublicKey,
  ) {
    try {
        const secretKey = Uint8Array.from(Buffer.from(fromKeypair, "hex"));
        const senderKeypair = Keypair.fromSecretKey(secretKey);
    
      // Convert the receiver's address to a PublicKey
      const receiverPubKey = new PublicKey(toAddress);
      const token = new PublicKey(tokenMint);
      // Get or create the sender's associated token account
      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        senderKeypair, // Payer of the transaction (sender)
        token, // Mint address of the token
        senderKeypair.publicKey // Owner of the token account (sender)
      );
  
      // Get or create the receiver's associated token account
      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        senderKeypair, // Payer of the transaction (sender)
        token, // Mint address of the token
        receiverPubKey // Owner of the token account (receiver)
      );
  
      // Create the transfer instruction
      const transferInstruction = createTransferInstruction(
        fromTokenAccount.address, // Source token account
        toTokenAccount.address, // Destination token account
        senderKeypair.publicKey, // Owner of the source token account
        Math.floor(amount * Math.pow(10, 9)) // Amount in token's smallest unit (e.g., lamports for SOL)
      );
  
      // Create and send the transaction
      const transaction = new Transaction().add(transferInstruction);
      const signature = await sendAndConfirmTransaction(connection, transaction, [
        senderKeypair,
      ]);
  
      console.log("Transfer successful. Signature:", signature);
      return signature;
    } catch (error) {
      console.error("Error transferring token:", error);
      throw error;
    }
  }

const updateEsportsRecord = async (publicKey: string, game: string, isWinner: boolean, amount:number) => {
  
  let earnings = 0;
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
    if(isWinner){
      earnings = data.total_earnings + amount
    }else{
      earnings = data.total_earnings - amount

    }
    const { error: updateError } = await supabase
      .from("esports_records")
      .update({
        wins: isWinner ? data.wins + 1 : data.wins,
        losses: isWinner ? data.losses : data.losses + 1,
        win_streak: isWinner ? data.win_streak + 1 : 0,
        loss_streak: isWinner ? 0 : data.loss_streak + 1,
        total_earnings: earnings
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
      loss_streak: isWinner ? 0 : 1,
      total_earnings: isWinner ? amount : - amount
    })

    if (insertError) {
      console.error(`Error inserting esports record for ${publicKey}:`, insertError)
    }
  }
}

export async function POST(req: Request) {
  try {
    const { game_id } = await req.json()
    // console.log(game_id)
    const gameData = await fetchGameData(game_id)
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
    
    const { wallet_fee, fee_esports }:any = platformSettings
    const gameFee = parseFloat(gameData.fee)
    // console.log(gameFee)
    const player1Data = await fetchUserData(gameData.player1)
    const player2Data = await fetchUserData(gameData.player2)

    if (!player1Data || !player2Data) {
      return NextResponse.json({ success: false, message: "Failed to fetch player data" })
    }

    const winner = gameData.player1score > gameData.player2score ? gameData.player1 : gameData.player2
    console.log(winner)
    const loser = winner === gameData.player1 ? gameData.player2 : gameData.player1
    const winnerWallet = gameData.player1score > gameData.player2score ? player1Data.deposit_wallet : player2Data.deposit_wallet
    // Deduct fees from both players
    const player1PrivateKey = CryptoManager.decrypt(player1Data.deposit_wallet_encryptedKey, player1Data.iv)
    const player2PrivateKey = CryptoManager.decrypt(player2Data.deposit_wallet_encryptedKey, player2Data.iv)
    // console.log(player2PrivateKey)
    if(gameData.money==1){
            
      
     let p1_fee_txid = await transferSOL(player1PrivateKey, wallet_fee, gameFee)
     if(p1_fee_txid){
        const { error: updateError } = await supabase.from("esports").update({ player1_fee_txid: p1_fee_txid}).eq("game_id", game_id)
        if(!updateError){
            let p2_fee_txid =  await transferSOL(player2PrivateKey, wallet_fee, gameFee)
            const { error: updateError } = await supabase.from("esports").update({ player2_fee_txid: p2_fee_txid}).eq("game_id", game_id)
            if(updateError){
                return NextResponse.json({ success: false, message: "error collecting player 2 fee" })
    
            }
        }else{
            return NextResponse.json({ success: false, message: "error collecting player 1 fee" })
        
        }
     }
   
      // Transfer the game amount to the winner
      let finalAmount = parseFloat(gameData.amount)
      // console.log(finalAmount, gameData.amount)
      const loserPrivateKey = winner === gameData.player1 ? player2PrivateKey : player1PrivateKey
      signature =  await transferSOL(
        loserPrivateKey,
        winnerWallet,
        gameData.amount
      )
      if(!signature){
        return NextResponse.json({ success: false, message: "error paying winner" })
      }
    }else{
      
      //no fee when playing with Gamerholic tokens
      // await transferToken(player1PrivateKey, wallet_fee, gameFee, gameData.token_mint_address)
      // await transferToken(player2PrivateKey, wallet_fee, gameFee, gameData.token_mint_address)
          
      // Transfer the game amount to the winner
      const loserPrivateKey = winner === gameData.player1 ? player2PrivateKey : player1PrivateKey
      signature = await transferToken(
        loserPrivateKey,
        winner,
        gameData.amount,
        gameData.token_mint_address,
      )
  
    }
    // console.log(signature)
    // // Update esports records
    await updateEsportsRecord(winner, gameData.game, true, gameData.amount)
    await updateEsportsRecord(loser, gameData.game, false, gameData.amount)
    
    // Update game status to completed
    const { error: updateError } = await supabase.from("esports").update({ txid: signature, status: 9 }).eq("game_id", game_id)
    
    if (updateError) {
      console.error("Error updating game status:", updateError)
      return NextResponse.json({ error: "Failed to update game status" }, { status: 500 })
    }

    return NextResponse.json({ success: true, txid: signature })
  } catch (e) {
    console.error("Error in /api/esports/score:", e)
    return NextResponse.json({ error: "Failed to process score" }, { status: 500 })
  }
}


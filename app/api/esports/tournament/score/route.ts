import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token"
import { sendAndConfirmTransaction } from "@/lib/solana"
import { CryptoManager } from "@/lib/server/cryptoManager"

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed")
const PLATFORM_FEE_PERCENT = 0.03 // 3% platform fee
const GAME_TOKEN_ADDRESS = process.env.GAMERHOLIC // GAMEr token mint address

CryptoManager.initialize()

async function getWalletKeypair(tournamentId: string): Promise<Keypair> {
  const { data: wallet, error } = await supabase.from("wallets").select("*").eq("game_id", tournamentId).single()

  if (error) throw error
  
  const privateKey = CryptoManager.decrypt(wallet.encrypted_key, wallet.iv)
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(privateKey)))
}

async function transferSOL(fromKeypair: Keypair, toAddress: string, amount: number, feeAddress: string) {
  try {
    const toPublicKey = new PublicKey(toAddress)
    const feePublicKey = new PublicKey(feeAddress)
    
    const feeAmount = Math.floor(amount * PLATFORM_FEE_PERCENT * LAMPORTS_PER_SOL)
    const transferAmount = Math.floor(amount * (1 - PLATFORM_FEE_PERCENT) * LAMPORTS_PER_SOL)
    
    const transaction = new Transaction().add(
      // Main transfer
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: transferAmount,
      }),
      // Platform fee transfer
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: feePublicKey,
        lamports: feeAmount,
      }),
    )
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair])
    return signature
  } catch (error) {
    console.error("Error transferring SOL:", error)
    throw error
  }
}

async function transferGAMEr(fromKeypair: Keypair, toAddress: string, amount: number, feeAddress: string) {
  try {
    if (!GAME_TOKEN_ADDRESS) {
      throw new Error("GAMEr token address not configured")
    }
    
    const toPublicKey = new PublicKey(toAddress)
    const feePublicKey = new PublicKey(feeAddress)
    const tokenMint = new PublicKey(GAME_TOKEN_ADDRESS)
    
    // Get or create token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair,
      tokenMint,
      fromKeypair.publicKey,
    )
    
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromKeypair, tokenMint, toPublicKey)
    
    const feeTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromKeypair, tokenMint, feePublicKey)
    
    const feeAmount = Math.floor(amount * PLATFORM_FEE_PERCENT * Math.pow(10, 9)) // GAMEr has 9 decimals
    const transferAmount = Math.floor(amount * (1 - PLATFORM_FEE_PERCENT) * Math.pow(10, 9))
    
    const transaction = new Transaction().add(
      // Main transfer
      createTransferInstruction(
        fromTokenAccount.address,
        toTokenAccount.address,
        fromKeypair.publicKey,
        transferAmount,
      ),
      // Platform fee transfer
      createTransferInstruction(fromTokenAccount.address, feeTokenAccount.address, fromKeypair.publicKey, feeAmount),
    )
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair])
    return signature
  } catch (error) {
    console.error("Error transferring GAMEr:", error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const { tournamentId, winnerId } = await req.json()

    // Fetch tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single()

    if (tournamentError) throw tournamentError

    // Calculate prize pool and payouts
    const totalPrizePool = tournament.entry_fee * tournament.max_players
    const prizePool = totalPrizePool * (tournament.prize_percentage / 100)

    const firstPlacePrize = prizePool * (tournament.first_place_percentage / 100)
    const secondPlacePrize = prizePool * (tournament.second_place_percentage / 100)
    const thirdPlacePrize = prizePool * (tournament.third_place_percentage / 100)
    const hostPayout = totalPrizePool * 0.18 // 18% to host
    const platformPayout = totalPrizePool * 0.07 // 7% to platform

    // Get tournament wallet keypair
    const tournamentKeypair = await getWalletKeypair(tournamentId)

    // Get final match details
    const { data: finalMatch, error: matchError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("round", Math.log2(tournament.max_players))
      .single()

    if (matchError) throw matchError

    // Verify winner
    if (finalMatch.winner_id !== winnerId) {
      return NextResponse.json({ error: "Invalid winner or not the final match" }, { status: 400 })
    }

    // Get second and third place players
    const secondPlaceId = finalMatch.player1_id === winnerId ? finalMatch.player2_id : finalMatch.player1_id

    const { data: semifinalMatches, error: semifinalError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("round", Math.log2(tournament.max_players) - 1)

    if (semifinalError) throw semifinalError

    const thirdPlaceId = semifinalMatches
      .flatMap((match) => [match.player1_id, match.player2_id])
      .find((id) => id !== winnerId && id !== secondPlaceId)

    // Process payments based on token type
    const transferFunction = tournament.prize_type === "GAMEr" ? transferGAMEr : transferSOL
    const platformFeeAddress = process.env.PLATFORM_FEE_ADDRESS

    if (!platformFeeAddress) {
      throw new Error("Platform fee address not configured")
    }

    // Array of payments to process
    const payments = [
      { recipient: winnerId, amount: firstPlacePrize, position: 1 },
      { recipient: secondPlaceId, amount: secondPlacePrize, position: 2 },
      { recipient: tournament.host_id, amount: hostPayout, position: null },
    ]

    if (thirdPlaceId) {
      payments.push({ recipient: thirdPlaceId, amount: thirdPlacePrize, position: 3 })
    }

    // Process each payment
    for (const payment of payments) {
      try {
        // Create payment record
        const { data: paymentRecord, error: insertError } = await supabase
          .from("payments")
          .insert({
            user_id: payment.recipient,
            payment_type: "tournament",
            game_id: tournamentId,
            amount: payment.amount,
            token_type: tournament.prize_type,
            token_address: tournament.prize_type === "GAMEr" ? GAME_TOKEN_ADDRESS : null,
            status: "pending",
            position: payment.position,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Process the transfer
        const signature = await transferFunction(
          tournamentKeypair,
          payment.recipient,
          payment.amount,
          platformFeeAddress,
        )

        // Update payment record
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            status: "completed",
            transaction_hash: signature,
            completed_at: new Date().toISOString(),
          })
          .eq("id", paymentRecord.id)

        if (updateError) throw updateError
      } catch (error) {
        console.error(`Error processing payment to ${payment.recipient}:`, error)
        
        // Update payment record with error
        await supabase
          .from("payments")
          .update({
            status: "failed",
            error_message: error.message,
          })
          .eq("user_id", payment.recipient)
          .eq("game_id", tournamentId)
      }
    }

    // Update tournament status
    const { error: updateError } = await supabase
      .from("tournaments")
      .update({ status: "completed" })
      .eq("id", tournamentId)

    if (updateError) throw updateError

    return NextResponse.json({
      message: "Tournament payments processed successfully",
    })
  } catch (error) {
    console.error("Error processing tournament payments:", error)
    return NextResponse.json({ error: "Failed to process tournament payments" }, { status: 500 })
  }
}


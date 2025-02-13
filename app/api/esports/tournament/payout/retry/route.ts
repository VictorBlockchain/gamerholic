import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token"
import { sendAndConfirmTransaction, createConnection } from "@/lib/solana"
import { CryptoManager } from "@/lib/server/cryptoManager"

const connection = createConnection("https://api.mainnet-beta.solana.com")
const GAME_TOKEN_ADDRESS = process.env.GAME_TOKEN_ADDRESS
const PLATFORM_FEE_ADDRESS = process.env.PLATFORM_FEE_ADDRESS

const cryptoManager = new CryptoManager()

async function getWalletKeypair(tournamentId: number): Promise<Keypair> {
  const { data: wallet, error } = await supabase.from("wallets").select("*").eq("tournament_id", tournamentId).single()

  if (error) throw new Error(`Failed to fetch wallet for tournament ${tournamentId}: ${error.message}`)
  if (!wallet) throw new Error(`No wallet found for tournament ${tournamentId}`)

  const privateKey = cryptoManager.decrypt(wallet.encrypted_key, wallet.iv)
  return Keypair.fromSecretKey(Buffer.from(privateKey, "hex"))
}

async function transferSOL(fromKeypair: Keypair, toAddress: string, amount: number) {
  try {
    const toPublicKey = new PublicKey(toAddress)
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      }),
    )

    const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair])
    return signature
  } catch (error) {
    console.error("Error transferring SOL:", error)
    throw error
  }
}

async function transferGAMEr(fromKeypair: Keypair, toAddress: string, amount: number) {
  try {
    if (!GAME_TOKEN_ADDRESS) {
      throw new Error("GAMEr token address not configured")
    }

    const toPublicKey = new PublicKey(toAddress)
    const tokenMint = new PublicKey(GAME_TOKEN_ADDRESS)

    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair,
      tokenMint,
      fromKeypair.publicKey,
    )

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromKeypair, tokenMint, toPublicKey)

    const transaction = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount.address,
        toTokenAccount.address,
        fromKeypair.publicKey,
        Math.floor(amount * Math.pow(10, 9)), // GAMEr has 9 decimals
      ),
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
    const { tournamentId } = await req.json()

    // Fetch tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("game_id", tournamentId)
      .single()

    if (tournamentError) throw tournamentError

    // Get tournament wallet keypair
    const tournamentKeypair = await getWalletKeypair(tournament.id)

    // Fetch failed payments
    const { data: failedPayments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("game_id", tournamentId)
      .eq("status", "failed")

    if (paymentsError) throw paymentsError

    // Process each failed payment
    const transferFunction = tournament.prize_type === "GAMEr" ? transferGAMEr : transferSOL

    for (const payment of failedPayments) {
      try {
        // Process the transfer
        const signature = await transferFunction(tournamentKeypair, payment.user_id, payment.amount)

        // Update payment record
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            status: "completed",
            transaction_hash: signature,
            completed_at: new Date().toISOString(),
          })
          .eq("id", payment.id)

        if (updateError) throw updateError
      } catch (error) {
        console.error(`Error reprocessing payment to ${payment.user_id}:`, error)

        // Update payment record with new error
        await supabase
          .from("payments")
          .update({
            status: "failed",
            error_message: error.message,
          })
          .eq("id", payment.id)
      }
    }

    // Check if all payments are now completed
    const { data: remainingFailedPayments, error: checkError } = await supabase
      .from("payments")
      .select("id")
      .eq("game_id", tournamentId)
      .eq("status", "failed")

    if (checkError) throw checkError

    // If all payments are completed, update tournament status to "paid"
    if (remainingFailedPayments.length === 0) {
      const { error: updateError } = await supabase
        .from("tournaments")
        .update({ status: "paid" })
        .eq("game_id", tournamentId)

      if (updateError) throw updateError
    }

    return NextResponse.json({
      message: "Payouts reprocessed successfully",
      remainingFailedPayments: remainingFailedPayments.length,
    })
  } catch (error) {
    console.error("Error reprocessing tournament payments:", error)
    return NextResponse.json({ error: "Failed to reprocess tournament payments" }, { status: 500 })
  }
}


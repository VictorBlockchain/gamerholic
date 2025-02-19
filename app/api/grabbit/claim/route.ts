import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { PublicKey, Transaction, SystemProgram, Keypair } from "@solana/web3.js"
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token"
import { sendAndConfirmTransaction, createConnection } from "@/lib/solana"
import { CryptoManager } from "@/lib/server/cryptoManager"
CryptoManager.initialize()

export async function POST(req: Request) {
  try {
    const { grabbitId, winnerPublicKey } = await req.json()

    // Fetch the Grabbit game details
    const { data: grabbit, error: grabbitError } = await supabase
      .from("grabbit")
      .select("*")
      .eq("id", grabbitId)
      .single()

    if (grabbitError || !grabbit) {
      return NextResponse.json({ error: "Grabbit game not found" }, { status: 404 })
    }

    // Check if the requester is the winner
    if (grabbit.winner !== winnerPublicKey) {
      return NextResponse.json({ error: "Only the winner can claim the prize" }, { status: 403 })
    }

    // Check if the prize has already been claimed
    if (grabbit.prize_claimed) {
      return NextResponse.json({ error: "Prize has already been claimed" }, { status: 400 })
    }

    // Fetch platform settings
    const { data: platformSettings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("wallet_fee, fee_grabbit, fee_grabbit_host")
      .eq("id", 1)
      .single()

    if (settingsError || !platformSettings) {
      return NextResponse.json({ error: "Failed to fetch platform settings" }, { status: 500 })
    }

    // Fetch the wallet for this Grabbit game
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("grabbit_id", grabbitId)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Failed to fetch wallet for this game" }, { status: 500 })
    }

    // Calculate prize amount
    const totalAmount = grabbit.entry_fee !== 0 ? grabbit.entry_fee * grabbit.players_ready : grabbit.prize_amount

    // Calculate fees
    const platformFee = Math.floor(totalAmount * (platformSettings.fee_grabbit / 100))
    let hostFee = 0
    if (grabbit.entry_fee > 0) {
      hostFee = Math.floor(totalAmount * (platformSettings.fee_grabbit_host / 100))
    }
    const winnerAmount = totalAmount - platformFee - hostFee

    // Initialize Solana connection
    const connection = createConnection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!)
    
    // Decrypt wallet private key
    const decryptedPrivateKey = CryptoManager.decrypt(wallet.encrypted_key, wallet.iv)
    // const keypair = Keypair.fromSecretKey(Buffer.from(decryptedPrivateKey, "base64"))
    const secretKey = Uint8Array.from(Buffer.from(decryptedPrivateKey, "hex"));
    const senderKeypair = Keypair.fromSecretKey(secretKey);

    // Prepare transaction
    const transaction = new Transaction()

    if (grabbit.prize_token === "solana") {
      // SOL transfer
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: new PublicKey(platformSettings.wallet_fee),
          lamports: platformFee,
        }),
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: new PublicKey(winnerPublicKey),
          lamports: winnerAmount,
        }),
      )

      if (hostFee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: new PublicKey(grabbit.created_by),
            lamports: hostFee,
          }),
        )
      }
    } else {
      // SPL Token transfer
      const tokenMint = new PublicKey(grabbit.prize_token)
      const fromTokenAccount = await getAssociatedTokenAddress(tokenMint, senderKeypair.publicKey)
      const toPlatformTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        new PublicKey(platformSettings.wallet_fee),
      )
      const toWinnerTokenAccount = await getAssociatedTokenAddress(tokenMint, new PublicKey(winnerPublicKey))

      transaction.add(
        createTransferInstruction(fromTokenAccount, toPlatformTokenAccount, senderKeypair.publicKey, platformFee),
        createTransferInstruction(fromTokenAccount, toWinnerTokenAccount, senderKeypair.publicKey, winnerAmount),
      )

      if (hostFee > 0) {
        const toHostTokenAccount = await getAssociatedTokenAddress(tokenMint, new PublicKey(grabbit.created_by))
        transaction.add(createTransferInstruction(fromTokenAccount, toHostTokenAccount, senderKeypair.publicKey, hostFee))
      }
    }

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair])

    // Update Grabbit game status
    const { error: updateError } = await supabase
      .from("grabbit")
      .update({ prize_claimed: true, prize_claim_tx: signature })
      .eq("game_id", grabbitId)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update Grabbit game status" }, { status: 500 })
    }

    return NextResponse.json({ success: true, signature })
  } catch (error) {
    console.error("Error claiming prize:", error)
    return NextResponse.json({ error: "Failed to claim prize" }, { status: 500 })
  }
}


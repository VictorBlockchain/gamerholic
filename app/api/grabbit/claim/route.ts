import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { PublicKey,Connection, Transaction, SystemProgram, Keypair } from "@solana/web3.js"
import { getAssociatedTokenAddress, createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token"
import { sendAndConfirmTransaction, createConnection } from "@/lib/solana"
import { CryptoManager } from "@/lib/server/cryptoManager"
import { balanceManager } from "@/lib/balance"
const Balance = new balanceManager()
CryptoManager.initialize()
const connection: any = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL)

const fetchUserData = async (publicKey: string) => {
  const { data, error } = await supabase.from("users").select("*").eq("publicKey", publicKey).single()
  
  if (error) {
    console.error(`Error fetching data for ${publicKey}:`, error)
    return null
  }
  
  return data
}

async function transferSOL(fromPrivateKey: string, toAddress: string, amount: number) {
  try {
    console.log("trying to pay")
    const secretKey = Uint8Array.from(Buffer.from(fromPrivateKey, "hex"))
    const senderKeypair = Keypair.fromSecretKey(secretKey)
    const receiverPubKey = new PublicKey(toAddress)
    
    const lamports = Math.round(amount * 10 ** 9)
    console.log(lamports)
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: receiverPubKey,
        lamports: lamports, // Convert SOL to lamports
      }),
    )

    const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair])
    // console.log(signature)
    return signature
  } catch (error) {
    console.error("Error transferring SOL:", error)
    throw error
  }
}
async function transferSPLToken(
  fromPrivateKey: string,
  toAddress: string,
  tokenMintAddress: string,
  amount: number, // Amount in token units (e.g., 1 GAMEr = 1 * 10^decimals)
  decimals: number // Number of decimals for the token (e.g., 9 for GAMEr)
) {
  try {
    console.log("Trying to transfer SPL token");

    // Convert the private key to a keypair
    const secretKey = Uint8Array.from(Buffer.from(fromPrivateKey, "hex"));
    const senderKeypair = Keypair.fromSecretKey(secretKey);

    // Convert addresses to PublicKey objects
    const tokenMint = new PublicKey(tokenMintAddress);
    const toPublicKey = new PublicKey(toAddress);

    // Get or create the sender's associated token account
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      senderKeypair,
      tokenMint,
      senderKeypair.publicKey
    );

    // Get or create the receiver's associated token account
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      senderKeypair,
      tokenMint,
      toPublicKey
    );

    // Create the transfer instruction
    const transaction = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount.address, // Source token account
        toTokenAccount.address, // Destination token account
        senderKeypair.publicKey, // Owner of the source token account
        Math.round(amount * 10 ** decimals), // Amount in token units (adjusted for decimals)
        [] // No multisig signers
      )
    );

    // Send and confirm the transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
    console.log("SPL token transfer successful. Signature:", signature);
    return signature;
  } catch (error) {
    console.error("Error transferring SPL token:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { gameId, user } = await req.json()

    // Fetch the Grabbit game details
    const { data: grabbit, error: grabbitError } = await supabase
      .from("grabbit")
      .select("*")
      .eq("game_id", gameId)
      .single()
    
    if (grabbitError || !grabbit) {
      return NextResponse.json({success:false, message: "Grabbit game not found" }, { status: 404 })
    }

    if (user != grabbit.winner) {
      return NextResponse.json({ success:false, message: "you are not the winner" }, { status: 404 })
    }

    let winner = await fetchUserData(user);
    let host = await fetchUserData(grabbit.created_by);

    // Check if the requester is the winner
    if (grabbit.winner !== user) {
      return NextResponse.json({ success:false, message: "Only the winner can claim the prize" }, { status: 403 })
    }
    
    // Check if the prize has already been claimed
    if (grabbit.prize_claimed) {
      return NextResponse.json({ success:false, message: "Prize has already been claimed" }, { status: 400 })
    }

    // Fetch platform settings
    const { data: platformSettings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("wallet_fee, fee_grabbit, fee_grabbit_host")
      .eq("id", 1)
      .single()

    if (settingsError || !platformSettings) {
      return NextResponse.json({success:false, message: "Failed to fetch platform settings" }, { status: 500 })
    }

    // Fetch the wallet for this Grabbit game
    const { data: wallet, error: walletError } = await supabase
      .from("grabbit_wallet")
      .select("*")
      .eq("game_id", gameId)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ success:false, message: "Failed to fetch wallet for this game" }, { status: 500 })
    }
    
    // Calculate prize amount
    let totalAmount = await Balance.getBalance(wallet.wallet)
    totalAmount = totalAmount / 10 ** 9 - 0.015 //debit a little to cover transaction fees

    // Calculate fees
    const platformFee = Math.floor(totalAmount * (platformSettings.fee_grabbit / 100))
    let hostFee = 0
    if (grabbit.entry_fee > 0) {
      hostFee = Math.floor(totalAmount * (platformSettings.fee_grabbit_host / 100))
    }
    const winnerAmount = totalAmount - platformFee - hostFee
    
    // Decrypt game wallet private key
    const gameWalletPrivateKey = CryptoManager.decrypt(wallet.wallet_key, wallet.wallet_iv)
    let signatureFee:any;
    let signatureHost:any;
    let signatureWinner:any;
    
    if (grabbit.prize_token === "solana") {
      // pay platform fee
      console.log(platformFee)
      if(platformFee>0){
        signatureFee = await transferSOL(gameWalletPrivateKey, platformSettings.wallet_fee, platformFee)
        if(signatureFee){
                const { data: paymentRecord, error: insertError } = await supabase
                  .from("payments")
                  .insert({
                    user_id: platformSettings.wallet_fee,
                    payment_type: "grabbtFee",
                    game_id: grabbit.game_id,
                    amount: platformFee,
                    token: '11111111111111111111111111111111',
                    status: "completed",
                    txid: signatureFee,
                  })
        }else{
          return NextResponse.json({ success:false, message: "Failed to fetch wallet for this game" }, { status: 500 })
        }
      }
      if(hostFee>0){
        signatureHost = await transferSOL(gameWalletPrivateKey, host.deposit_wallet, hostFee)
        if(signatureHost){
          const { data: paymentRecord, error: insertError } = await supabase
            .from("payments")
            .insert({
              user_id: host.deposit_wallet,
              payment_type: "grabbtHost",
              game_id: grabbit.game_id,
              amount: hostFee,
              token: '11111111111111111111111111111111',
              status: "completed",
              txid: signatureHost,
            })
          }else{
            return NextResponse.json({ error: "error paying grabbit host" }, { status: 500 })
          }
      }
      signatureWinner = await transferSOL(gameWalletPrivateKey, winner.deposit_wallet, winnerAmount)
      if(signatureWinner){
        const { data: paymentRecord, error: insertError } = await supabase
          .from("payments")
          .insert({
            user_id: winner.deposit_wallet,
            payment_type: "grabbtWinner",
            game_id: grabbit.game_id,
            amount: winnerAmount,
            token: '11111111111111111111111111111111',
            status: "completed",
            txid: signatureWinner,
          })
        }else{
          return NextResponse.json({ success:false, message: "error paying grabbit host" }, { status: 500 })
        }
    
    } else {
      // SPL Token transfer
      // transferSPLToken(connection, fromPrivateKey, toAddress, tokenMintAddress, amount, decimals)
      // .then((signature) => {
      //   console.log("Transfer successful. Signature:", signature);
      // })
      // .catch((error) => {
      //   console.error("Transfer failed:", error);
      // });
    }
    
    // Update Grabbit game status
    const { error: updateError } = await supabase
      .from("grabbit")
      .update({ prize_claimed: true, prize_claim_tx: signatureWinner })
      .eq("game_id", gameId)

    if (updateError) {
      return NextResponse.json({ success:false, message: "Failed to update Grabbit game status" }, { status: 500 })
    }

    return NextResponse.json({ success: true, signatureWinner })
  } catch (error) {
    console.error("Error claiming prize:", error)
    return NextResponse.json({ success:false, message: "Failed to claim prize" }, { status: 500 })
  }
}


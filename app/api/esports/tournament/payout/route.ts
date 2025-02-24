import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js"
import { getAssociatedTokenAddress, createTransferInstruction, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { sendAndConfirmTransaction } from "@/lib/solana"
import { CryptoManager } from "@/lib/server/cryptoManager"

const connection: any = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL)
const PLATFORM_FEE_PERCENT = 0.03 // 3% platform fee
const GAME_TOKEN_ADDRESS:any = process.env.GAMERHOLIC // GAMEr token mint address

CryptoManager.initialize()

async function getWalletKeypair(tournamentId: number): Promise<any> {
  const { data: wallet, error } = await supabase.from("wallets").select("*").eq("tournament_id", tournamentId).single()

  if (error) throw new Error(`Failed to fetch wallet for tournament ${tournamentId}: ${error.message}`)
  if (!wallet) throw new Error(`No wallet found for tournament ${tournamentId}`)

  const privateKey = CryptoManager.decrypt(wallet.encrypted_key, wallet.iv)
  return privateKey
}

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

export async function POST(req: Request) {
  try {
    const { tournamentId, winnerId } = await req.json();
    
    // Fetch tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("game_id", tournamentId)
      .single();
    
    if (tournamentError) throw tournamentError;
    
    // Get tournament wallet keypair
    const tournamentKeypair = await getWalletKeypair(tournamentId);
    
    // Calculate prize pool and payouts
    const totalPrizePool = tournament.entry_fee * tournament.max_players;
    const hostPayout = totalPrizePool * 0.18; // 18% to host
    const platformPayout = totalPrizePool * 0.07; // 7% to platform
    const remainingPrizePool = totalPrizePool - hostPayout - platformPayout;
    
    const numRounds = Math.log2(tournament.max_players);
    let firstPlacePrize, secondPlacePrize, thirdPlacePrize;
    
    if (numRounds === 1) {
      // Only 2 players, no third place
      firstPlacePrize = remainingPrizePool * 0.7; // 70% to first place
      secondPlacePrize = remainingPrizePool * 0.3; // 30% to second place
      thirdPlacePrize = 0;
    } else {
      // More than 2 players, include third place
      firstPlacePrize = remainingPrizePool * 0.5; // 50% to first place
      secondPlacePrize = remainingPrizePool * 0.3; // 30% to second place
      thirdPlacePrize = remainingPrizePool * 0.2; // 20% to third place
    }
    
    const platformSettings = await fetchPlatformSettings();
    if (!platformSettings) {
      return NextResponse.json({ success: false, message: "Failed to fetch platform settings" });
    }
    const { wallet_fee, fee_esports }: any = platformSettings;
    
    // Get final match details
    const { data: finalMatch, error: matchError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("round", Math.log2(tournament.max_players))
      .single();
    
    if (matchError) throw matchError;
    
    // Verify winner
    if (finalMatch.winner_id !== winnerId) {
      return NextResponse.json({ error: "Invalid winner or not the final match" }, { status: 400 });
    }
    
    // Get second and third place players
    const secondPlaceId = finalMatch.player1_id === winnerId ? finalMatch.player2_id : finalMatch.player1_id;
    
    const { data: semifinalMatches, error: semifinalError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("round", Math.log2(tournament.max_players) - 1);

    if (semifinalError) throw semifinalError;

    const thirdPlaceId = semifinalMatches
      .flatMap((match) => [match.player1_id, match.player2_id])
      .find((id) => id !== winnerId && id !== secondPlaceId);

    let winner = await fetchUserData(winnerId);
    let winner2 = await fetchUserData(secondPlaceId);
    let winner3;

    // Array of payments to process
    const payments: any = [
      { recipient: tournament.host_id, amount: hostPayout, position: null },
      { recipient: wallet_fee, amount: platformPayout, position: null },
      { recipient: winner.deposit_wallet, amount: firstPlacePrize, position: 1 },
      { recipient: winner2.deposit_wallet, amount: secondPlacePrize, position: 2 },
    ];

    if (numRounds > 1 && thirdPlaceId) {
      winner3 = await fetchUserData(thirdPlaceId);
      payments.push({ recipient: winner3.deposit_wallet, amount: thirdPlacePrize, position: 3 });
    }
    
    // Track remaining balance
    let remainingBalance = totalPrizePool;

    // Process each payment
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];

      try {
        // Deduct the payment amount from the remaining balance
        remainingBalance -= payment.amount;

        // If this is the last payment, adjust the amount to the remaining balance
        if (i === payments.length - 1) {
          payment.amount = remainingBalance;
        }

        // Create payment record
        const { data: paymentRecord, error: insertError } = await supabase
          .from("payments")
          .insert({
            user_id: payment.recipient,
            payment_type: "tournament",
            game_id: tournamentId,
            amount: payment.amount,
            token: tournament.money === "2" ? GAME_TOKEN_ADDRESS : '11111111111111111111111111111111',
            status: "pending",
            position: payment.position,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        // Process the transfer
        let signature;
        if (tournament.money == 1) {
          signature = await transferSOL(tournamentKeypair, payment.recipient, payment.amount);
        } else {
          signature = await transferToken(tournamentKeypair, payment.recipient, payment.amount,GAME_TOKEN_ADDRESS);
        }

        if (!signature) {
          return NextResponse.json({ error: "Error paying winners" }, { status: 400 });
        }
        
        // Update payment record
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            status: "completed",
            txid: signature,
            pay_date: new Date().toISOString(),
          })
          .eq("id", paymentRecord.id);
        
        if (updateError) throw updateError;
      } catch (error: any) {
        console.error(`Error processing payment to ${payment.recipient}:`, error);
        
        // Update payment record with error
        await supabase
          .from("payments")
          .update({
            status: "failed",
            error_message: error.message,
          })
          .eq("user_id", payment.recipient)
          .eq("game_id", tournamentId);
      }
    }
    
    return NextResponse.json({
      message: "Tournament payments processed successfully",
    });
  } catch (error) {
    console.error("Error processing tournament payments:", error);
    return NextResponse.json({ error: "Failed to process tournament payments" }, { status: 500 });
  }
}


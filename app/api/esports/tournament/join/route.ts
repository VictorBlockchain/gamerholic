import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createTransferInstruction, getOrCreateAssociatedTokenAccount,getMint ,getAccount,getAssociatedTokenAddress} from "@solana/spl-token"
import { sendAndConfirmTransaction } from "@/lib/solana"
import { CryptoManager } from "@/lib/server/cryptoManager"
import { balanceManager } from "@/lib/balance"
import { useToast } from "@/components/ui/use-toast"
CryptoManager.initialize()

let BALANCE = new balanceManager()
const connection:any = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL)
const GAME_TOKEN_ADDRESS = process.env.GAME_TOKEN_ADDRESS // GAMEr token mint address

// async function transferSOL(fromKeypair: Keypair, toAddress: string, amount: number) {
//   try {
//     const toPublicKey = new PublicKey(toAddress)
        
//     const transaction = new Transaction().add(
//       // Main transfer
//       SystemProgram.transfer({
//         fromPubkey: fromKeypair.publicKey,
//         toPubkey: toPublicKey,
//         lamports: amount,
//       }),
    
//     )
    
//     const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair])
//     return signature
//   } catch (error) {
//     console.error("Error transferring SOL:", error)
//     throw error
//   }
// }

async function transferSOL(fromPrivateKey: string, toAddress: string, amount: number) {
  try {
    const secretKey = Uint8Array.from(Buffer.from(fromPrivateKey, "hex"));
    const senderKeypair = Keypair.fromSecretKey(secretKey);
    const receiverPubKey = new PublicKey(toAddress);
    
    const lamports = Math.round(amount * 10 ** 9);
    console.log(lamports)
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

async function transferGAMEr(fromKeypair: string, toAddress: string, amount: number, tokenMintAddress:any) {
  try {
    if (!GAME_TOKEN_ADDRESS) {
      throw new Error("GAMEr token address not configured")
    }
    
    // const toPublicKey = new PublicKey(toAddress)
    // const tokenMint = new PublicKey(tokenMintAddress)
    
    // // Get or create token accounts
    // const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   fromKeypair,
    //   tokenMint,
    //   fromKeypair.publicKey,
    // )
    
    // const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromKeypair, tokenMint, toPublicKey)
        
    // const transaction = new Transaction().add(
    //   // Main transfer
    //   createTransferInstruction(
    //     fromTokenAccount.address,
    //     toTokenAccount.address,
    //     fromKeypair.publicKey,
    //     amount,
    //   ),
    // )
    
    // const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair])
    return
  } catch (error) {
    console.error("Error transferring GAMEr:", error)
    throw error
  }
}

export async function POST(req: Request) {
  try {

    const { tournamentId, player } = await req.json();
    let tokensToJoinAmount = 0;
    let balancePlayerSol = 0;
    let balancePlayerToken = 0;
    let entryFee = 0;
    let signature: any;

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("game_id", tournamentId)
      .single();
    if (tournamentError) throw tournamentError;

    // Get user's deposit wallet
    const { data: user, error: userError }: any = await supabase
      .from("users")
      .select("*")
      .eq("publicKey", player)
      .single();
    if (userError) throw userError;

    // Get tournament wallet
    const { data: tournamentWallet, error: walletError }: any = await supabase
      .from("wallets")
      .select("public_key")
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (walletError) throw walletError;

    if (!tournamentWallet) {
      return NextResponse.json(
        { success: false, message: "Tournament wallet not found" },
        { status: 404 }
      );
    }

    // Get approved token
    const { data: approvedToken, error: tokenError } = await supabase
      .from("approved_tokens")
      .select("*")
      .eq("status", 1)
      .neq("name", "Solana")
      .single();
    if (tokenError) throw tokenError;

    // Get platform settings
    const { data: platformSettings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("min_tokens_tournament")
      .eq("id", 1)
      .single();
    if (settingsError) throw settingsError;

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, "confirmed");
    
    // Check if user has enough tokens in their public wallet
    const userPublicKey: any = new PublicKey(player);
    const tokenMintAddress: any = new PublicKey(approvedToken.address);
    balancePlayerSol = await BALANCE.getBalance(user.deposit_wallet)
    balancePlayerSol = balancePlayerSol / LAMPORTS_PER_SOL
    const privateKey = CryptoManager.decrypt(user.deposit_wallet_encryptedKey, user.iv);
    
    // const depositWalletKeypair:any = Buffer.from(privateKey).toString("hex");
    
    if(platformSettings.min_tokens_tournament > 0){
      
        tokensToJoinAmount = platformSettings.min_tokens_tournament / 10 ** 9
        balancePlayerToken = await BALANCE.getTokenBalance(user.deposit_wallet, tokenMintAddress.toString())
        const mintInfo = await getMint(connection, tokenMintAddress);
        const decimals = mintInfo.decimals;
        balancePlayerToken = balancePlayerToken * Math.pow(10, decimals)
    
        ///user needs gamer tokens to join
        if (balancePlayerToken < tokensToJoinAmount) {
          return NextResponse.json(
            { success: false, message: "You are not holding enough GAMEr tokens to join tournaments" },
            { status: 400 }
          )
      }
    }

    if (tournament.money === 1) {
      ///entry fee is in solana, prize is solana
      if(tournament.entry_fee>0){

        entryFee = tournament.entry_fee;
        // console.log(balancePlayerSol, entryFee)
        if (balancePlayerSol < entryFee) {
          return NextResponse.json(
            { success: false, message: "You need more solana to cover entry fee" },
            { status: 400 }
          )
        }
        signature = await transferSOL(
          privateKey,
          tournamentWallet.public_key,
          entryFee
        );
        if(!signature){
          return NextResponse.json(
            { success: false, message: "error paying entry fee" },
            { status: 400 }
          )
        }
      }
    }
    
    if (tournament.money === 2) {
      ///prize is token
      if(tournament.entry_fee>0){
        ///entry fee is paid in token
        const mintInfo = await getMint(connection, tokenMintAddress);
        const decimals = mintInfo.decimals;
        
        entryFee = tournament.entry_fee * Math.pow(10, decimals)
        if(balancePlayerToken<entryFee){
          return NextResponse.json(
            { success: false, message: "You need more tokens to cover entry fee" },
            { status: 400 }
          )
        }
        signature = await transferGAMEr(
          privateKey,
          tournamentWallet.public_key,
          entryFee,
          tokenMintAddress
        );
        if(!signature){
          return NextResponse.json(
            { success: false, message: "error paying entry fee" },
            { status: 400 }
          )
        }
      }
    }
    
    // Add user to tournament table
    const { error: joinError } = await supabase
    .from("tournament_players")
    .insert({ tournament_id: tournamentId, player_id: player, txid:signature });
    if (joinError) throw joinError;

    return NextResponse.json(
      { success: true, message: "Successfully joined tournament" },
    );

    
  } catch (error) {
    console.error("Error joining tournament:", error);
    return NextResponse.json({ success: false, error: "Failed to join tournament" }, { status: 500 });
  }
}
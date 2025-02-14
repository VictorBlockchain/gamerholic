import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createTransferInstruction, getOrCreateAssociatedTokenAccount,getMint ,getAccount,getAssociatedTokenAddress} from "@solana/spl-token"
import { sendAndConfirmTransaction } from "@/lib/solana"
import { CryptoManager } from "@/lib/server/cryptoManager"
import { balanceManager } from "@/lib/balance"
import { useToast } from "@/components/ui/use-toast"
let BALANCE = new balanceManager()
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed")
const GAME_TOKEN_ADDRESS = process.env.GAME_TOKEN_ADDRESS // GAMEr token mint address

async function getTokenBalance(userPublicKey:any, tokenMintAddress:any) {
  try {
    // Derive the associated token account address
    const associatedTokenAddress = await getAssociatedTokenAddress(tokenMintAddress, userPublicKey);
    
    // Attempt to fetch the token account
    const tokenAccount:any = await getAccount(connection, associatedTokenAddress);
    
    // Fetch the mint info to determine decimals
    const mintInfo = await getMint(connection, tokenMintAddress);
    const decimals = mintInfo.decimals;
    
    // Calculate the formatted balance
    const userTokenBalanceFormatted = Number.parseFloat(tokenAccount.amount) / Math.pow(10, decimals);
    return userTokenBalanceFormatted || 0;
  } catch (error:any) {
    // console.log(error)
    // if (error.message.includes("TokenAccountNotFoundError")) {
    //   // Token account does not exist, so the balance is 0
    //   return 0;
    // } else {
    //   // Re-throw other errors
    //   throw error;
    // }
  }
}

async function transferSOL(fromKeypair: Keypair, toAddress: string, amount: number) {
  try {
    const toPublicKey = new PublicKey(toAddress)
        
    const transaction = new Transaction().add(
      // Main transfer
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

async function transferGAMEr(fromKeypair: Keypair, toAddress: string, amount: number, tokenMintAddress:any) {
  try {
    if (!GAME_TOKEN_ADDRESS) {
      throw new Error("GAMEr token address not configured")
    }
    
    const toPublicKey = new PublicKey(toAddress)
    const tokenMint = new PublicKey(tokenMintAddress)
    
    // Get or create token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair,
      tokenMint,
      fromKeypair.publicKey,
    )
    
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromKeypair, tokenMint, toPublicKey)
        
    const transaction = new Transaction().add(
      // Main transfer
      createTransferInstruction(
        fromTokenAccount.address,
        toTokenAccount.address,
        fromKeypair.publicKey,
        amount,
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
    const { tournamentId, player } = await req.json();

  
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
    const cryptoManager = new CryptoManager();

    // Check if user has enough tokens in their public wallet
    const userPublicKey: any = new PublicKey(player);
    const tokenMintAddress: any = new PublicKey(approvedToken.address);
    
    let userTokenBalance = await BALANCE.getTokenBalance(userPublicKey.toString(), tokenMintAddress.toString())
    // console.log(userTokenBalance)
    if (userTokenBalance > 0) {
        userTokenBalance = userTokenBalance / 10 ** 9
      if (userTokenBalance < (platformSettings.min_tokens_tournament / 10 ** 9)) {
        return NextResponse.json(
          { success: false, message: "You are not holding enough GAMEr tokens to join tournaments" },
          { status: 400 }
        );
      } else {
        const privateKey = cryptoManager.decrypt(user.deposit_wallet_encryptedKey, user.iv);
        const depositWalletKeypair = Keypair.fromSecretKey(Buffer.from(privateKey, "base64"));

        let signature: string;

        if (tournament.prize_type === "Solana") {
          if (tournament.entry_fee > 0) {
            const userSolBalance = await connection.getBalance(new PublicKey(user.deposit_wallet));
            const solBalance = userSolBalance / LAMPORTS_PER_SOL;

            if (solBalance < tournament.entry_fee) {
              return NextResponse.json(
                { success: false, message: "Deposit more SOL to cover the entry fee" },
                { status: 400 }
              );
            } else {
              signature = await transferSOL(
                depositWalletKeypair,
                tournamentWallet.public_key,
                tournament.entry_fee * LAMPORTS_PER_SOL
              );
            }
          }
        } else if (tournament.prize_type === "GAMEr") {
          if (tournament.entry_fee > 0) {
            const mintInfo = await getMint(connection, tokenMintAddress);
            const decimals = mintInfo.decimals;
            
            const depositWalletTokenBalance:any = await getTokenBalance(
              new PublicKey(user.deposit_wallet),
              tokenMintAddress
            );

            if (depositWalletTokenBalance < tournament.entry_fee) {
              return NextResponse.json(
                { success: false, message: "Deposit more GAMEr tokens to cover the entry fee" },
                { status: 400 }
              );
            } else {
              signature = await transferGAMEr(
                depositWalletKeypair,
                tournamentWallet.public_key,
                tournament.entry_fee * Math.pow(10, decimals),
                tokenMintAddress
              );
            }
          }
        }

        // Add user to tournament table
        const { error: joinError } = await supabase
          .from("tournament_players")
          .insert({ tournament_id: tournamentId, player_id: player });
        if (joinError) throw joinError;

        return NextResponse.json(
          { success: true, message: "Successfully joined tournament" },
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "You are not holding enough GAMEr tokens to join tournaments" },
      );
    }
  } catch (error) {
    console.error("Error joining tournament:", error);
    return NextResponse.json({ success: false, error: "Failed to join tournament" }, { status: 500 });
  }
}
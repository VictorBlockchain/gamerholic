import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generateGameToken } from "@/lib/gameSession"
import { deductUserCredits } from "@/lib/userCredits"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createTransferInstruction, getOrCreateAssociatedTokenAccount,getMint ,getAccount,getAssociatedTokenAddress} from "@solana/spl-token"
import { sendAndConfirmTransaction } from "@/lib/solana"
import { balanceManager } from "@/lib/balance"
import { CryptoManager } from "@/lib/server/cryptoManager"
let BALANCE = new balanceManager()
const cryptoManager = new CryptoManager();

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed")
const GAMEr:any = process.env.GAMEr // GAMEr token mint address

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

export async function POST(request: Request) {
  const { gameId, player } = await request.json()
  let signature: any;

  if (!gameId || !player) {
    return NextResponse.json({ error: "Missing gameId or userId" }, { status: 400 })
  }

  try {

    // Check if the platform is paused
    const { data: platformSettings, error: platformError } = await supabase
      .from("platform_settings")
      .select("is_paused")
      .single()

    if (platformError) throw platformError
    
    if (platformSettings.is_paused) {
      return NextResponse.json({ success:false, message: 'games paused'})
    }

    // Fetch game details and check if the game is paused
    const { data: arcade, error: arcadeError } = await supabase
      .from("arcade")
      .select("play_fee, is_paused")
      .eq("game_id", gameId)
      .single()
    
    if (arcadeError) throw arcadeError

    if (arcade.is_paused) {
      return NextResponse.json({ success:false, message: 'game paused'})
    }
    
    if(arcade.play_fee>0){
      
          // Get user's deposit wallet
        const { data: user, error: userError }: any = await supabase
        .from("users")
        .select("*")
        .eq("publicKey", player)
        .single();
      if (userError) throw userError;
          
          // Get tournament wallet
        const { data: arcadeWallet, error: walletError }: any = await supabase
        .from("wallets")
        .select("public_key")
        .eq("arcade_id", gameId)
        .maybeSingle();
      if (walletError) throw walletError;
      
      let balance = await BALANCE.getTokenBalance(player, GAMEr)
      const privateKey = cryptoManager.decrypt(user.deposit_wallet_encryptedKey, user.iv);
      const depositWalletKeypair:any = Buffer.from(privateKey).toString("hex");
      const tokenMintAddress: any = new PublicKey(GAMEr);
      
      const mintInfo = await getMint(connection, GAMEr);
      const decimals = mintInfo.decimals;
      let play_fee = arcade.play_fee * Math.pow(10, decimals)

      if(balance >= play_fee){
        
        signature = await transferGAMEr(
          depositWalletKeypair,
          arcadeWallet.public_key,
          play_fee,
          tokenMintAddress
        );

      }else{

        return NextResponse.json({success:false, message: "Insufficient credits" })
      
      }
    }    
    // Create game session
    const { data, error } = await supabase
      .from("arcade_sessions")
      .insert({ arcade_id: gameId, user_id: player, start_time: new Date().toISOString(), signature: signature })
      .select()

    if (error) throw error

    const gameToken = generateGameToken(gameId, player)

    return NextResponse.json({ sessionId: data[0].id, gameToken })
  } catch (error) {
    console.error("Error starting game:", error)
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
  }
}


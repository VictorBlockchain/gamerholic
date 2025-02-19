import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generateGameToken } from "@/lib/gameSession"
import { deductUserCredits } from "@/lib/userCredits"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createTransferInstruction, getOrCreateAssociatedTokenAccount,getMint ,getAccount,getAssociatedTokenAddress} from "@solana/spl-token"
import { sendAndConfirmTransaction } from "@/lib/solana"
import { balanceManager } from "@/lib/balance"
import { CryptoManager } from "@/lib/server/cryptoManager"
import moment from 'moment';
let BALANCE = new balanceManager()
const cryptoManager = new CryptoManager();

const connection:any = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL)
const GAMEr:any = process.env.NEXT_PUBLIC_GAMER // GAMEr token mint address

async function transferSOL(fromPrivateKey: string, toAddress: string, amount: number) {
  try {
    const secretKey = Uint8Array.from(Buffer.from(fromPrivateKey, "hex"));
    const senderKeypair = Keypair.fromSecretKey(secretKey);
    const receiverPubKey = new PublicKey(toAddress);
        
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: receiverPubKey,
            lamports: amount * 1e9, // Convert SOL to lamports
        }),
    )
    
    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [senderKeypair]
    );
    console.log(signature)
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
  let balance: any;
  let txid_fee:any;
  let txid_play:any;

  if (!gameId || !player) {
    return NextResponse.json({ error: "Missing gameId or userId" }, { status: 400 })
  }

  try {
    let balance: any;

    // Check if the platform is paused
    const { data: platformSettings, error: platformError } = await supabase
      .from("platform_settings")
      .select("is_paused, wallet_fee, fee_arcade")
      .eq("id", 1)
      .single()

    if (platformError) throw platformError
    
    if (platformSettings.is_paused) {
      return NextResponse.json({ success:false, message: 'games paused'})
    }

    // Fetch game details and check if the game is paused
    const { data: arcade, error: arcadeError } = await supabase
      .from("arcade")
      .select("play_fee, is_paused, play_money")
      .eq("game_id", gameId)
      .single()
    
    if (arcadeError) throw arcadeError
    
    if (arcade.is_paused) {
      return NextResponse.json({ success:false, message: 'game paused'})
    }
    //get arcade wallet
    const { data: wallet, error: walletError }:any = await supabase
    .from("wallets")
    .select("public_key")
    .eq("arcade_id", gameId)
    .single()
    
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
      
      const playerPrivateKey:any = cryptoManager.decrypt(user.deposit_wallet_encryptedKey, user.iv);

      const tokenMintAddress: any = new PublicKey(GAMEr);
      
      if(arcade.play_money==1){
        //game uses solana
        balance = await BALANCE.getBalance(user.deposit_wallet)

        if(balance>arcade.play_fee){
          //collect platform play fee
          let fee = platformSettings.fee_arcade
      
          txid_fee = await transferSOL(playerPrivateKey, platformSettings.wallet_fee, fee)
          if(!txid_fee){
            
            return NextResponse.json({ success:false, message: 'error inserting coins'})
          
          }else{
            
            ///insert coins
            txid_play = await transferSOL(playerPrivateKey, wallet.public_key, arcade.play_fee)
            if(!txid_play){
              return NextResponse.json({ success:false, message: 'error inserting coins'})
            
            }
          
          }
        }
      }else{
          
          const secretKey = Uint8Array.from(Buffer.from(playerPrivateKey, "hex"));
          const senderKeypair = Keypair.fromSecretKey(secretKey);
    
          balance = await BALANCE.getTokenBalance(player, GAMEr)
          const mintInfo = await getMint(connection, GAMEr);
          const decimals = mintInfo.decimals;
          let fee = platformSettings.fee_arcade/100
          const playFee = arcade.play_fee * fee
          if(balance >= playFee){
          
            txid_play = await transferGAMEr(
              senderKeypair,
              arcadeWallet.public_key,
              playFee,
              tokenMintAddress
            );
            if(!txid_play){
              return NextResponse.json({ success:false, message: 'error inserting coins'})
            
            }
        }else{
          
          return NextResponse.json({success:false, message: "Insufficient Tokens" })
        
        }
      }
    
    }    
    // Create game session
    const { data, error } = await supabase
      .from("arcade_sessions")
      .insert({ arcade_id: gameId, player: player, start_time: moment().toISOString(), txid_play: txid_play, txid_fee:txid_fee })
      .select()
    
    if (error) throw error
    
    const gameToken = generateGameToken(gameId, player)
    
    return NextResponse.json({success:true, sessionId: data[0].id, token:gameToken })
  } catch (error) {
    console.error("Error starting game:", error)
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
  }
}


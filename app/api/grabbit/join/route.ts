import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token"
import moment from "moment";
import "moment-timezone"; // Import moment-timezone for timezone handling
const timezone = "America/New_York";
import crypto from "crypto";
import { CryptoManager } from "@/lib/server/cryptoManager"
CryptoManager.initialize()

const IV_LENGTH = 16; // AES block size
const connection: any = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL)
const GAME_TOKEN_ADDRESS:any = process.env.GAMERHOLIC // GAMEr token mint address

const fetchGameData = async (gameid:any) => {
  const { data, error: fetchError } = await supabase
  .from("grabbit")
  .select("*")
  .eq("game_id", gameid)
  .single();
  
  if (fetchError) {
    console.error(`Error fetching game data`);
    return null;
  }
  
  return data;
};

const fetchPlayersData = async (gameid:any) => {
  const { data, error: fetchError } = await supabase
  .from("grabbit_players")
  .select("*")
  .eq("game_id", gameid)
  .eq("status", 1)
  
  if (fetchError) {
    console.error(`Error fetching players data`);
    return null;
  }
  
  return data;
};

const fetchPlayerData = async (gameid:any, userId:any) => {
//   console.log(gameid, userId)
  const { data, error: fetchError } = await supabase
  .from("grabbit_players")
  .select("*")
  .eq("player", userId)
  .eq("status", 1)
  .maybeSingle()
  
  if (fetchError) {
    console.error(`Error fetching player data`);
    
    return null;
  }
  
  return data;
};

const fetchUserData = async (publicKey:any) => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("player", publicKey)
      .single();
  
  if (error) {
    console.error(`Error fetching players data`);
    return null;
  }
  
  return data;
};

const fetchWalletData = async (publicKey:any) => {
  const { data, error: fetchError } = await supabase
  .from("wallet_players")
  .select("*")
  .eq("player", publicKey)
  .single();
  
  if (fetchError) {
    console.error(`Error fetching wallet data`);
    return null;
  }
  
  return data;
};

const updateGameData = async (gameid:any, userId:any, userName:any, userAvatar:any, endTime:any) => {
    const { data, error } = await supabase
    .from("grabbit")
    .update({
      end_time: endTime,
      winner: userId,
      winner_name: userName,
      winner_avatar: userAvatar
    })
    .eq("game_id", gameid) 
    
    if (error) {
      console.error(`Error updating game data`);
      
      return {success:false};
    }
    
    return {success:true};
    ;
  };
  
async function transferSOL(fromPrivateKey: string, toAddress: string, amount: number) {
  try {
    const secretKey = Uint8Array.from(Buffer.from(fromPrivateKey, "hex"))
    const senderKeypair = Keypair.fromSecretKey(secretKey)
    const receiverPubKey = new PublicKey(toAddress)
    
    const lamports = Math.round(amount * 10 ** 9)
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, publicKey } = body;
    const currentTime:any = new Date().toISOString();
    let txid_play:any;
    
    let gameData:any = await fetchGameData(gameId)
    let playerData:any = await fetchPlayerData(gameId,publicKey)
    let userData:any = await fetchUserData(publicKey)
    let walletData:any = await fetchWalletData(publicKey)
    const timeNow = moment();
    
    if(playerData){
        
        return NextResponse.json({success:false, message:'you are seated in another game'})
    }
    let count = gameData.players_ready + 1
    if(gameData.players_max < count){

        return NextResponse.json({success:false, message: 'max players reached'})
    }
    if(gameData.status==3){
        return NextResponse.json({success:false, message: 'game started'})
    }
    if(gameData.status==4){
        return NextResponse.json({success:false, message: 'game over'})
    }
    
        //collect entry fee and send it to game wallet
        if(gameData.entry_fee>0){
            // console.log(gameData.entry_fee)
          let userKey:any = CryptoManager.decrypt(walletData.sesime, walletData.iv);
          let fee_entry = gameData.entry_fee
            if(gameData.play_money==1){
              //entry fee is in solana
                  txid_play = await transferSOL(userKey, gameData.wallet, fee_entry)
                  if(!txid_play){
                    return NextResponse.json({ success: false, message: "error paying entry fee" })
                  }
            
            }
        }else{
          console.log("no entry fee")
        }
        // Calculate the expiration time (now + 3 minutes)
        const seatExpire = timeNow.add(180, "seconds");
        // Insert the player data into the "grabbit_players" table
        const {  data: upsertedRecord, error: insertError  } = await supabase
        .from("grabbit_players")
        .upsert(
            {
            game_id: gameId,
            player: publicKey,
            player_avatar: userData.avatar,
            player_name: userData.name,
            grabs: gameData.free_grabs,
            slaps: gameData.free_slaps,
            sneaks: gameData.free_sneaks,
            seat_expire: seatExpire, // Set to now + 2 minutes
            status:1,
            txid:txid_play
            },{ onConflict: "game_id,player" } // Specify the unique constraint columns
        ).select(); 
            
            // Handle errors
            if (insertError) {
                console.error("Insert error:", insertError.message);
                return NextResponse.json({success:false, message:'error joining game'})
            
            }else{
                return NextResponse.json({success:true, message:'you are in', data:upsertedRecord})
            } 
        


  }catch(error){
    return NextResponse.json({success:false})
  }
}

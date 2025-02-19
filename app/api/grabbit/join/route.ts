import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import moment from "moment";
import "moment-timezone"; // Import moment-timezone for timezone handling
const timezone = "America/New_York";
import crypto from "crypto";
import { CryptoManager } from "@/lib/server/cryptoManager"
const cryptoManager = new CryptoManager();

const IV_LENGTH = 16; // AES block size
const connection = new Connection("https://api.mainnet-beta.solana.com"); // Replace with appropriate RPC endpoint
const FEE_ADDRESS:any = process.env.FEE_ADDRESS;



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
      .from("users")
      .select("*")
      .eq("publicKey", publicKey)
      .single();
  
  if (error) {
    console.error(`Error fetching players data`);
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

  const sendTokenTransactions = async (
    recipientAddress: string,
    amount: number,
    privateKey: Uint8Array
  ): Promise<any> => {
    try {
      const senderKeypair = Keypair.fromSecretKey(new Uint8Array(privateKey));
  
      const feeAmount = amount * 0.03;
      const recipientAmount = amount - feeAmount;
  
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: new PublicKey(recipientAddress),
          lamports: recipientAmount * 10 ** 9,
        }),
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: new PublicKey(FEE_ADDRESS),
          lamports: feeAmount * 10 ** 9,
        })
      );
  
      const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
      console.log("Transaction successful with signature:", signature);
  
      return Promise.resolve({success:true, message: signature});
    } catch (error:any) {
      console.error("Transaction failed:", error);
      return Promise.reject({success:false, message: error.message});
    }
  };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, publicKey } = body;
    const currentTime:any = new Date().toISOString();
    let txid_play:any;
    
    let gameData:any = await fetchGameData(gameId)
    let playerData:any = await fetchPlayerData(gameId,publicKey)
    let userData:any = await fetchUserData(publicKey)
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
            
          let userKey:any = cryptoManager.decrypt(userData.deposit_wallet_encryptedKey, userData.iv);
          let fee_entry = gameData.entry_fee / 10 ** 9
            if(gameData.play_money==1){
              //entry fee is in solana
                  txid_play = await transferSOL(userKey, gameData.wallet, fee_entry)
                  if(!txid_play){
                    return NextResponse.json({ success: false, message: "error paying entry fee" })
                  }
            
            }
        }
        // Calculate the expiration time (now + 3 minutes)
        const seatExpire = timeNow.add(180, "seconds");
        // Insert the player data into the "grabbit_players" table
        const { error: insertError } = await supabase
        .from("grabbit_players")
        .upsert(
            {
            game_id: gameId,
            player: publicKey,
            player_avatar: userData.avatar_url,
            player_name: userData.username,
            grabs: gameData.free_grabs,
            slaps: gameData.free_slaps,
            sneaks: gameData.free_sneaks,
            seat_expire: seatExpire, // Set to now + 2 minutes
            status:1,
            txid:txid_play
            },{ onConflict: "game_id,player" } // Specify the unique constraint columns
        );

            // Handle errors
            if (insertError) {
                console.error("Insert error:", insertError.message);
                return NextResponse.json({success:false, message:'error joining game'})
            
            }else{
                return NextResponse.json({success:true, message:'you are in'})
            } 
        


  }catch(error){
    return NextResponse.json({success:false})
  }
}

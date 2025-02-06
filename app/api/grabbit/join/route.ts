import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import moment from "moment";
import "moment-timezone"; // Import moment-timezone for timezone handling
const timezone = "America/New_York";
import crypto from "crypto";

const IV_LENGTH = 16; // AES block size
const connection = new Connection("https://api.mainnet-beta.solana.com"); // Replace with appropriate RPC endpoint
const FEE_ADDRESS:any = process.env.FEE_ADDRESS;

// Encryption and Decryption Class
class CryptoManager {
    private ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ;
  
  constructor() {
    if (!process.env.ENCRYPTION_KEY) {
      this.ENCRYPTION_KEY = crypto.randomBytes(32); // 256-bit key
      console.log("Generated ENCRYPTION_KEY:", this.ENCRYPTION_KEY.toString("hex"));
    } else {
      this.ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    }
  }

  encrypt(text: string): { iv: string; encrypted: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", this.ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString("hex"), encrypted: encrypted.toString("hex") };
  }
  
  decrypt(encrypted: string, iv: string): string {
    const ivBuffer = Buffer.from(iv, "hex");
    const encryptedBuffer = Buffer.from(encrypted, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.ENCRYPTION_KEY, ivBuffer);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
  }
}
const cryptoManager = new CryptoManager();

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
            let fee = gameData.entry_fee / 10 ** 9
            let userKey:any = cryptoManager.decrypt(userData.deposit_wallet_encryptedKey, userData.iv);
            let data:any = await sendTokenTransactions(gameData.wallet, fee, userKey)
            if(!data.success){
                return NextResponse.json({success:false, message: 'error collecting fee'})
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
            status:1
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

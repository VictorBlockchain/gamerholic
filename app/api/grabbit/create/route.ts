import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server"
import moment from "moment";
import { truncateSync } from "node:fs";
import { Keypair } from "@solana/web3.js"
import crypto from "crypto";

const IV_LENGTH = 16; // AES block size

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
const fetchRandom = async (): Promise<number> => {
  const rand = Math.floor(Math.random() * 36); // Generate a random number between 0 and 35
  return rand; // Return the generated random number
};

const setWallet = async (gameId:any, wallet:any, wallet_key:any, iv:any) =>{
    console.log(gameId, wallet)
    const { error } = await supabase.from("grabbit_wallet").insert({
      game_id:gameId,
      wallet: wallet,
      wallet_key: wallet_key,
      wallet_iv: iv
    })
    if(!error){
        return ({success:true})
    }else{
      console.log("error here")
      console.log(error)
        return({success:false})
    }
}

export async function POST(req: Request) {
  try {
    
    const body = await req.json();
    const { gData } = body;
    const currentTime:any = new Date().toISOString();
     console.log(gData)
    //generate address for this game
    const keypair = Keypair.generate();
    const privateKeyHex = Buffer.from(keypair.secretKey).toString("hex");
    
    // // Encrypt the private key using the unified encryption function
    const { iv, encrypted } = cryptoManager.encrypt(privateKeyHex);
    // let numb  = await fetchRandom();
    //   console.log(numb)
    const { data, error }:any = await supabase.from("grabbit").insert({
        created_by: gData.publicKey,
        details: gData.description,
        end_time: null,
        free_grabs: await fetchRandom(),
        free_slaps: await fetchRandom(),
        free_sneaks: await fetchRandom(),
        grabs_to_join: 0,
        image: gData.image,
        last_grab: null,
        players: [],
        players_max: gData.maxPlayers,
        players_min: gData.minPlayers,
        players_ready: 0,
        prize_amount: 0,
        prize_token: gData.tokenAddress,
        prize_token_name: gData.tokenName,
        slapper: null,
        start_time: null,
        status:1,
        title: gData.title,
        entry_fee: gData.entryFee,
        entry_fee_token: null,
        wallet: keypair.publicKey.toString(),
        winner: null,
        winner_avatar:null,
        winner_name: null
      })
      .select();
      // console.log(data)
      if(data){
        console.log(data[0])
        if(data[0].game_id>0){
          console.log('we here 2')

          let gameId = data[0].game_id
          let resp = await setWallet(gameId,keypair.publicKey.toString(),encrypted, iv)
          if(resp.success){
            return NextResponse.json({success:true})
          
          }else{
            console.log('we here 4')

            return NextResponse.json({success:false})
          
          }
        }else{
          console.log('we here 3')

           return NextResponse.json({success:false})
        }
      
      }else{
        console.log("error there")

        console.log(error)

        return NextResponse.json({success:false})
      
      }
  
  }catch(error){
    return NextResponse.json({success:false})
  }
}

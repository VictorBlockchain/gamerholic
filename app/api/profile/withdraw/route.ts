import { NextResponse } from "next/server";
import { validateGameCode } from "@/lib/codeValidation";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { CryptoManager } from "@/lib/server/cryptoManager";
import { sendAndConfirmTransaction } from "@/lib/solana";

CryptoManager.initialize();

const rpc:any = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
const connection = new Connection(rpc);
const GAMER = process.env.NEXT_PUBLIC_GAMERHOLIC;

const fetchUserData = async (publicKey:any) => {
  const { data, error } = await supabase.from("users").select("*").eq("publicKey", publicKey).single();
  if (error) {
    console.error(`Error fetching data for ${publicKey}:`, error);
    return null;
  }
  return data;
};

const fetchEsports = async (user:any) => {
    const { data, error } = await supabase
      .from("esports")
      .select("*")
      .or(`player1.eq.${user.toString()},player2.eq.${user.toString()}`)
      .in("status", [1, 2, 3, 4, 5, 6])
  
  if (error) {
    console.error("Error fetching esports", error);
    return null;
  }
  return data;
};

async function transferSOL(fromPrivateKey:any, toAddress:any, amount:any) {
  try {
    const secretKey = Uint8Array.from(Buffer.from(fromPrivateKey, "hex"));
    const senderKeypair = Keypair.fromSecretKey(secretKey);
    const receiverPubKey = new PublicKey(toAddress);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: receiverPubKey,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    );
    const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
    return signature;
  } catch (error) {
    console.error("Error transferring SOL:", error);
    throw error;
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

export async function POST(req:any) {
  try {
    const { user, amount, type, token } = await req.json();
    let signature:any
    
    //get esports
    const activeData:any = await fetchEsports(user)
    if(activeData.length>0){
        return NextResponse.json({ success: false, message: 'you are in an active esport game. Report score 1st before withdrawing' });
    }
    
    //get user data
    const userData:any = await fetchUserData(user)
    const userPrivateKey = CryptoManager.decrypt(userData.deposit_wallet_encryptedKey, userData.iv)

    if(type==1){
        //withdrawing solana
        signature =  await transferSOL(
            userPrivateKey,
            user,
            amount
          )
          if(!signature){
            
            return NextResponse.json({ success: false, message: 'error withdrawing solana' });
        }
    }else{
    // console.log(user, amount, token)
          signature =  await transferToken(userPrivateKey, user, amount, token)
          if(!signature){
            
            return NextResponse.json({ success: false, message: 'error withdrawing token' });
        }
    
    }
    
    const { data, error } = await supabase
    .from('withdraws')  // Specify the table name
    .insert([
      {
        deposit_wallet: userData.deposit_wallet,
        public_key: user,
        token: token,
        amount: amount,
        txid: signature,
        date: new Date().toISOString()  // Automatically set the current timestamp with timezone
      }
    ]);
    
    if (error) {
        return NextResponse.json({ success: false, message: 'error completing withdraw' });
    } 
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
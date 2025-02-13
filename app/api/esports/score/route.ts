import { NextResponse } from "next/server"
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import { CryptoManager } from "@/lib/server/cryptoManager"
const cryptoManager = new CryptoManager();

const connection = new Connection("https://api.mainnet-beta.solana.com"); // Replace with appropriate RPC endpoint
const FEE_ADDRESS = 'YourFeeAddressHere';

const fetchUserData = async (publicKey:any) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("publicKey", publicKey)
      .single();
  
    if (error) {
      console.error(`Error fetching data for ${publicKey}:`, error);
      return null;
    }
  
    return data;
  };
  
  const fetchGameData = async (id:any) => {
    const { data, error: fetchError } = await supabase
    .from("esports")
    .select("*")
    .eq("id", id)
    .single();
  
    if (fetchError) {
      console.error(`Error fetching game data`);
      return null;
    }
  
    return data;
  };

  const transferToken = async (fromPrivateKey: string, toAddresses: string[], amount: number, mintAddress: string) => {
    const fromKeypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(fromPrivateKey)));
    const mintPublicKey = new PublicKey(mintAddress);
    
    for (const toAddress of toAddresses) {
        const toPublicKey = new PublicKey(toAddress);
        const fromTokenAccount = await getAssociatedTokenAddress(mintPublicKey, fromKeypair.publicKey);
        const toTokenAccount = await getAssociatedTokenAddress(mintPublicKey, toPublicKey);
        
        const transaction = new Transaction().add(
            createTransferInstruction(
                fromTokenAccount,
                toTokenAccount,
                fromKeypair.publicKey,
                amount / toAddresses.length,
                [],
                TOKEN_PROGRAM_ID
            )
        );
        await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
    }
};

const sendTokenTransactions = async (recipientAddress:any, amount:any, privateKey:any) => {
    try {
      const senderKeypair = Keypair.fromSecretKey(new Uint8Array(privateKey));

      const feeAmount = amount * 0.03;
      const recipientAmount = amount - feeAmount;
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: new PublicKey(recipientAddress),
          lamports: recipientAmount * 10 ** 9, // convert to lamports
        }),
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: new PublicKey(FEE_ADDRESS),
          lamports: feeAmount * 10 ** 9, // 3% fee
        })
      );

      const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
      console.log('Transaction successful with signature:', signature);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    const mintAddress:any = '';
    // console.log(player1, player2, player1score, player2score)
    let gameData = await fetchGameData(id)
    if(gameData){
        if(gameData.status==3){
            //game scored and ready to process confirm score
            let player1PrivateKey:any;
            let player2PrivateKey:any;
            
            const player1Data = await fetchUserData(gameData.player1);
            if (player1Data) {
                player1PrivateKey = cryptoManager.decrypt(player1Data.deposit_wallet_encryptedKey, player1Data.iv);
            }
            
            const player2Data = await fetchUserData(gameData.player2);
            if (player2Data) {
                player2PrivateKey = cryptoManager.decrypt(player2Data.deposit_wallet_encryptedKey, player2Data.iv);
            }
            
            const winner = gameData.player1score > gameData.player2score ? gameData.player1 : gameData.player2;
            const loser = winner === gameData.player1 ? gameData.player2 : gameData.player1;
            const amount = 0.1; // Example amount to transfer in SOL
            
            await transferToken(
                winner === gameData.player1 ? player1PrivateKey : player2PrivateKey,
                [winner, loser],
                amount,
                mintAddress
            );
            
            return NextResponse.json({ success: true})
        }else if (gameData.status==4){
            //game already scored
            return NextResponse.json({ success: false})

        }else{
            //game can't be scored
            return NextResponse.json({ success: false})
        }
    }else{
        return NextResponse.json({ success: false})

    }
  
  } catch (e) {
    console.error("Error in /api/address:", e)
    return NextResponse.json({ error: "Failed to generate address" }, { status: 500 })
  }
}


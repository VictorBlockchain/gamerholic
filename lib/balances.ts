import { Keypair, PublicKey, Connection, Transaction, SystemProgram } from "@solana/web3.js"
import {  getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
const RPC_ENDPOINT:any = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
const connection = new Connection(RPC_ENDPOINT);
const axios = require('axios');
const API_KEY = process.env.NEXT_PUBLIC_HELIUS;
const GAMER = process.env.NEXT_PUBLIC_GAMERHOLIC
const HELIUS_URL = `https://api.helius.xyz/v0/addresses/{address}/balances?api-key=${API_KEY}`;
import crypto from "crypto";

export class balanceManager {
    

async getBalance(address: any): Promise<any> {
try {
    let balance = 0
    if(address){
        console.log(address)
        const url = HELIUS_URL.replace('{address}', address);
        const response = await axios.get(url);
        let balance_gamer = 0;
        const { nativeBalance, tokens } = response.data;
        const gamer = tokens.find((t:any) => t.tokenAccount === GAMER);
        if (gamer) {
            balance_gamer = gamer.amount
        } 
        console.log(nativeBalance, balance_gamer, GAMER)
        
        return {solana: nativeBalance, gamer:balance_gamer}

    }else{
        return 0
    }

} catch (error) {
   // console.error("Failed to get balance:", error)
    return 0
}
}

async getTokenBalance(userAddress: any, tokenMintAddress: any): Promise<number> {
    try {
        // const userPublicKey = new PublicKey("8C7Q8GBbCN4Y7a3Xe9P8T4dkugubN8ypFW5fFbiCrVtj");
        // const tokenMintPublicKey:any = new PublicKey("ECxMKDURVmnyvav42xDMC44Btuaf1eWC8nLQk6Tcpump");
        const userPublicKey = new PublicKey(userAddress);
        const tokenMintPublicKey:any = new PublicKey(tokenMintAddress);
        
        let balance = 0;
        // const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        //     userPublicKey,
        //     {
        //         programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // SPL Token Program
        //     }
        // );
        // // console.log(tokenAccounts.value[1].account.data.parsed.info.mint)
        // // console.log(JSON.stringify(tokenAccounts))
        // const account:any = tokenAccounts.value.find(
        //     (acc:any) => acc.account.data.parsed.info.mint === tokenMintPublicKey.toString()
        // );
        // // console.log(account)
        // if (account) {
        //     balance = account.account.data.parsed.info.tokenAmount.uiAmount;
        //     // console.log(`Token Balance: ${balance}`);
        // } else {
        //     console.log('No balance found for this token.');
        // }
        const url = `https://api.helius.xyz/v0/addresses/${userPublicKey}/balances?api-key=${API_KEY}`;
        const response = await axios.get(url);
        
        const tokens = response.data.tokens;
        // console.log(tokens)
        const token = tokens.find((t:any) => t.tokenAccount === tokenMintAddress);
        if (token) {
            balance = token.amount
            console.log(`Token Balance: ${token.amount}`);
        } else {
            console.log('No balance found for this token.');
        }
        // console.log(balance)
        return balance;
        
    } catch (error) {
        console.error("Failed to get token balance:", error);
        return 0;
    }
}

}
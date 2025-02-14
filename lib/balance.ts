import { Keypair, PublicKey, Connection, Transaction, SystemProgram } from "@solana/web3.js"
import {  getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_ENDPOINT);
const axios = require('axios');
const API_KEY = process.env.NEXT_PUBLIC_HELIUS;
import crypto from "crypto";

export class balanceManager {
    


async getBalance(address: any): Promise<number> {
try {
    const publicKey = new PublicKey(address)
    const balance = await connection.getBalance(publicKey)
    // console.log(balance)
    return balance / 10 ** 9 // Convert lamports to SOL
} catch (error) {
    console.error("Failed to get balance:", error)
    return 0
}
}

async getTokenBalance(userAddress: any, tokenMintAddress: any): Promise<number> {
    try {
        const userPublicKey = new PublicKey(userAddress);
        const tokenMintPublicKey:any = new PublicKey(tokenMintAddress);
        
        const url = `https://api.helius.xyz/v0/addresses/${userPublicKey}/balances?api-key=${API_KEY}`;
        const response = await axios.get(url);
        
        const tokens = response.data.tokens;
        // console.log(tokens)
        const token = tokens.find((t:any) => t.tokenAccount === tokenMintAddress);
        let amount = 0
        if (token) {
            amount = token.amount
            console.log(`Token Balance: ${token.amount}`);
        } else {
            console.log('No balance found for this token.');
        }
        return amount;
        
    } catch (error) {
        console.error("Failed to get token balance:", error);
        return 0;
    }
}

}
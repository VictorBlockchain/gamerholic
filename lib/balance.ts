import { Keypair, PublicKey, Connection, Transaction, SystemProgram } from "@solana/web3.js"
import {  getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import crypto from "crypto";

export class balanceManager {
    private connection: Connection
    
    constructor() {
      this.connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com")
    }

async getBalance(address: any): Promise<number> {
try {
    const publicKey = new PublicKey(address)
    const balance = await this.connection.getBalance(publicKey)
    console.log(balance)
    return balance / 10 ** 9 // Convert lamports to SOL
} catch (error) {
    console.error("Failed to get balance:", error)
    return 0
}
}

async getTokenBalance(userAddress: string, tokenMintAddress: string): Promise<number> {
    try {
        const userPublicKey = new PublicKey(userAddress);
        const tokenMintPublicKey = new PublicKey(tokenMintAddress);
        
        // Get the associated token account for the user
        const associatedTokenAccount = await getAssociatedTokenAddress(
            tokenMintPublicKey,
            userPublicKey
        );
        
        // 🔹 Check if the token account exists before fetching balance
        try {
            const accountInfo = await getAccount(this.connection, associatedTokenAccount);
            if (!accountInfo) {
                console.warn("Token account does not exist for user.");
                return 0; // If the token account doesn't exist, return 0 balance
            }
        } catch (error) {
            console.warn("Token account does not exist for user.");
            return 0; // If an error occurs, assume the account does not exist
        }

        // Fetch the token balance
        const tokenAccountInfo = await this.connection.getTokenAccountBalance(associatedTokenAccount);
        return tokenAccountInfo.value.uiAmount || 0;
        
    } catch (error) {
        console.error("Failed to get token balance:", error);
        return 0;
    }
}

}
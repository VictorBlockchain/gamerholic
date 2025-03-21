import { Keypair, PublicKey, Connection, Transaction, SystemProgram } from "@solana/web3.js"
import {  getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { supabase } from "@/lib/supabase"
const RPC_ENDPOINT:any = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
const connection = new Connection(RPC_ENDPOINT);
const axios = require('axios');
const API_KEY = process.env.NEXT_PUBLIC_HELIUS
const GAMER = process.env.NEXT_PUBLIC_GAMERHOLIC
const HELIUS_URL = `https://api.helius.xyz/v0/addresses/{address}/balances?api-key=${API_KEY}`;
const moment = require("moment")
import crypto from "crypto";


export class balanceManager {
    
    async checkIfUpdateNeeded(address: string, type:number): Promise<any> {
        try {
          // Check if the address exists in the users table
        //   console.log(address)
        if(type==1){
          //getting user balance
            const { data: walletData, error: walletError }: any = await supabase
            .from('wallet_players')
            .select('updated_at, solana, gamer')
            .eq('wallet', address)
            .single();
      
          if (!walletError && walletData) {
            // Address found in users table
            const last_updated = walletData.updated_at;
      
            // Check if last_updated is null or one minute has passed
            const success = !last_updated || moment().diff(moment(last_updated), 'minutes') >= 1;
      
            // Return the result with the current balance
            return {
              success,
              solana: walletData.solana,
              gamer: walletData.gamer,
            };
          }
        }

        if(type==2){
          //getting esports game wallet balance
            const { data: walletData, error: walletError }: any = await supabase
            .from('wallet_esports')
            .select('updated_at, solana, gamer')
            .eq('wallet', address)
            .single();
      
          if (!walletError && walletData) {
            // Address found in users table
            const last_updated = walletData.updated_at;
      
            // Check if last_updated is null or one minute has passed
            const success = !last_updated || moment().diff(moment(last_updated), 'minutes') >= 1;
      
            // Return the result with the current balance
            return {
              success,
              solana: walletData.solana,
              gamer: walletData.gamer,
            };
          }
        }

        if(type==3){
          //getting tournament game wallet balance
            const { data: walletData, error: walletError }: any = await supabase
            .from('wallet_tournament')
            .select('updated_at, solana, gamer')
            .eq('wallet', address)
            .single();
      
          if (!walletError && walletData) {
            // Address found in users table
            const last_updated = walletData.updated_at;
      
            // Check if last_updated is null or one minute has passed
            const success = !last_updated || moment().diff(moment(last_updated), 'minutes') >= 1;
      
            // Return the result with the current balance
            return {
              success,
              solana: walletData.solana,
              gamer: walletData.gamer,
            };
          }
        }

        if(type==4){
          //getting grabbit wallet balance
            const { data: walletData, error: walletError }: any = await supabase
            .from('wallet_grabbit')
            .select('updated_at, solana, gamer')
            .eq('wallet', address)
            .single();
      
          if (!walletError && walletData) {
            // Address found in users table
            const last_updated = walletData.updated_at;
      
            // Check if last_updated is null or one minute has passed
            const success = !last_updated || moment().diff(moment(last_updated), 'minutes') >= 1;
      
            // Return the result with the current balance
            return {
              success,
              solana: walletData.solana,
              gamer: walletData.gamer,
            };
          }
        }
          
        if(type==5){
          //getting arcade wallet balance
            const { data: walletData, error: walletError }: any = await supabase
            .from('wallet_arcade')
            .select('updated_at, solana, gamer')
            .eq('wallet', address)
            .single();
      
          if (!walletError && walletData) {
            // Address found in users table
            const last_updated = walletData.updated_at;
      
            // Check if last_updated is null or one minute has passed
            const success = !last_updated || moment().diff(moment(last_updated), 'minutes') >= 1;
      
            // Return the result with the current balance
            return {
              success,
              solana: walletData.solana,
              gamer: walletData.gamer,
            }
          }
        }

        } catch (error: any) {
          console.error('Error checking if update is needed:', error.message);
          return {
            success: false, // Prevent API call on error
            solana: 0, // Default balance values
            gamer: 0,
          };
        }
      }

    async updateLastUpdated(address: string, type:number) {
        try {

          if(type==1){
          
            const { data: walletData, error: walletError } = await supabase
            .from('wallet_players')
            .select('updated_at')
            .eq('wallet', address)
            .single();
      
            if (!walletError && walletData) {
              // Update the last_updated field in the users table
              await supabase
                .from('wallet_players')
                .update({ updated_at: moment().toISOString() })
                .eq('wallet', address);
        
              console.log('Updated last_updated in wallet_players table.');
              return;
            }
          
          }

          if(type==2){
          
            const { data: walletData, error: walletError } = await supabase
            .from('wallet_esports')
            .select('updated_at')
            .eq('wallet', address)
            .single();
      
            if (!walletError && walletData) {
              // Update the last_updated field in the users table
              await supabase
                .from('wallet_esports')
                .update({ updated_at: moment().toISOString() })
                .eq('wallet', address);
        
              console.log('Updated last_updated in wallet_players table.');
              return;
            }
          
          }
          
          if(type==3){
          
            const { data: walletData, error: walletError } = await supabase
            .from('wallet_tournament')
            .select('updated_at')
            .eq('wallet', address)
            .single();
      
            if (!walletError && walletData) {
              // Update the last_updated field in the users table
              await supabase
                .from('wallet_tournament')
                .update({ updated_at: moment().toISOString() })
                .eq('wallet', address);
        
              console.log('Updated last_updated in wallet_players table.');
              return;
            }
          
          }

          if(type==4){
          
            const { data: walletData, error: walletError } = await supabase
            .from('wallet_grabbit')
            .select('updated_at')
            .eq('wallet', address)
            .single();
      
            if (!walletError && walletData) {
              // Update the last_updated field in the users table
              await supabase
                .from('wallet_grabbit')
                .update({ updated_at: moment().toISOString() })
                .eq('wallet', address);
        
              console.log('Updated last_updated in wallet_players table.');
              return;
            }
          
          }
          
          if(type==5){
          
            const { data: walletData, error: walletError } = await supabase
            .from('wallet_arcade')
            .select('updated_at')
            .eq('wallet', address)
            .single();
      
            if (!walletError && walletData) {
              // Update the last_updated field in the users table
              await supabase
                .from('wallet_arcade')
                .update({ updated_at: moment().toISOString() })
                .eq('wallet', address);
        
              console.log('Updated last_updated in wallet_players table.');
              return;
            }
          
          }

        } catch (error:any) {
          console.error('Error updating last_updated:', error.message);
        }
    }

async getBalance(address: any, type:number): Promise<any> {
try {
    let balance = 0
    if (!address) {
        console.log('No address provided.');
        return 0;
      }
  
      // Check if the address exists in the users or wallets table and if an update is needed
      const shouldUpdate = await this.checkIfUpdateNeeded(address, type);
  
      if (!shouldUpdate.success) {
        console.log('Skipping Helius API call as last update was less than a minute ago.');
        return {solana:shouldUpdate.solana, gamer:shouldUpdate.gamer}; // Return early to avoid unnecessary API calls
      }
  
      // Call the Helius API to fetch balance
      const url = HELIUS_URL.replace('{address}', address);
      const response = await axios.get(url);
      const { nativeBalance, tokens } = response.data;
  
      // Calculate GAMER token balance
      const gamer = tokens.find((t: any) => t.mint === GAMER);
      const balance_gamer = gamer ? gamer.amount : 0;
  
      // Return the balance object
      const balanceResult = { solana: nativeBalance, gamer: balance_gamer };
  
      // Update the last_updated column in the respective table
      await this.updateLastUpdated(address, type);
  
      return balanceResult;

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
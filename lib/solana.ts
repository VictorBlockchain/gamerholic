import {
    Connection,
    type Keypair,
    type Transaction,
    sendAndConfirmTransaction as _sendAndConfirmTransaction,
  } from "@solana/web3.js"
  
  // Re-export the sendAndConfirmTransaction function with our custom error handling
  export async function sendAndConfirmTransaction(
    connection: Connection,
    transaction: Transaction,
    signers: Keypair[],
  ): Promise<string> {
    try {
      const signature = await _sendAndConfirmTransaction(connection, transaction, signers, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      })
      return signature
    } catch (error) {
      console.error("Error in sendAndConfirmTransaction:", error)
      throw new Error(`Failed to send and confirm transaction: ${error.message}`)
    }
  }
  
  // Add any other Solana-related utility functions here
  export function createConnection(endpoint: string): Connection {
    return new Connection(endpoint, "confirmed")
  }
  
  export function getBalance(connection: Connection, publicKey: string): Promise<number> {
    return connection.getBalance(publicKey)
  }
  
  // Add more Solana-related functions as needed
  
  
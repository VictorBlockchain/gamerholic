import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { supabase } from "./supabase"

const connection = new Connection("https://api.mainnet-beta.solana.com")

// Initialize platformWallet as null
let platformWallet: PublicKey | null = null

async function initializePlatformWallet(retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase.from("platform_settings").select("platform_wallet_address").single()

      if (error) throw error

      if (data && data.platform_wallet_address) {
        platformWallet = new PublicKey(data.platform_wallet_address)
        console.log("Platform wallet initialized successfully")
        return
      } else {
        throw new Error("Platform wallet address not found in database")
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed to initialize platform wallet:`, error)
      if (i === retries - 1) {
        throw new Error("Failed to initialize platform wallet after multiple attempts")
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
    }
  }
}

// Call this function when your application starts
initializePlatformWallet().catch((error) => {
  console.error("Failed to initialize platform wallet on startup:", error)
})

// Use environment variables for encryption key and IV
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const ENCRYPTION_IV = process.env.ENCRYPTION_IV!

async function encrypt(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const key = await crypto.subtle.importKey("raw", Buffer.from(ENCRYPTION_KEY, "hex"), { name: "AES-CBC" }, false, [
    "encrypt",
  ])
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, data)
  return Buffer.from(iv).toString("hex") + ":" + Buffer.from(new Uint8Array(encrypted)).toString("hex")
}

async function decrypt(encryptedText: string): Promise<string> {
  const [ivHex, encryptedHex] = encryptedText.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")
  const key = await crypto.subtle.importKey("raw", Buffer.from(ENCRYPTION_KEY, "hex"), { name: "AES-CBC" }, false, [
    "decrypt",
  ])
  const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, encrypted)
  return new TextDecoder().decode(decrypted)
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select()
      .eq("table_name", tableName)
      .maybeSingle()
    
    if (error) throw error
    return data !== null
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

export async function createDepositAddress(userId: string): Promise<string> {
  console.log("Creating deposit address for user:", userId)
  if (!platformWallet) {
    console.error("Platform wallet not initialized")
    throw new Error("Platform wallet not initialized")
  }

  try {
    new PublicKey(userId)
  } catch (error) {
    console.error("Invalid user ID:", error)
    throw new Error("Invalid user ID: must be a valid Solana address")
  }

  // Check if the table exists
  const tableExists = await checkTableExists("user_deposit_addresses")
  console.log("user_deposit_addresses table exists:", tableExists)
  if (!tableExists) {
    throw new Error("user_deposit_addresses table does not exist. Please run migrations.")
  }

  try {
    const response = await fetch("/api/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: userId }),
    })
    
    if (!response.ok) {
      throw new Error("Failed to generate deposit address")
    }
    
    const { iv, key: encryptedPrivateKey } = await response.json()
    const keypair = Keypair.fromSecretKey(Buffer.from(encryptedPrivateKey, "hex"))
    const publicKey = keypair.publicKey.toBase58()
    
    const { data, error } = await supabase.from("user_deposit_addresses").insert({
      user_id: userId,
      deposit_address: publicKey,
      encrypted_private_key: encryptedPrivateKey,
      iv: iv,
    })
    
    if (error) throw error

    return publicKey
  } catch (error) {
    console.error("Error creating deposit address:", error)
    throw error
  }
}

export async function monitorAndSweepDeposits() {
  if (!platformWallet) {
    console.warn("Platform wallet not initialized. Attempting to initialize...")
    try {
      await initializePlatformWallet()
    } catch (error) {
      console.error("Failed to initialize platform wallet. Skipping sweep.", error)
      return
    }
  }

  if (!platformWallet) {
    console.error("Platform wallet still not initialized after attempt. Skipping sweep.")
    return
  }

  const { data: depositAddresses, error } = await supabase
    .from("user_deposit_addresses")
    .select("user_id, deposit_address, encrypted_private_key, iv")

  if (error) throw error

  for (const address of depositAddresses) {
    try {
      const publicKey = new PublicKey(address.deposit_address)
      const balance = await connection.getBalance(publicKey)

      if (balance > 0) {
        await sweepFunds(address.user_id, address.deposit_address, address.encrypted_private_key, address.iv, balance)
      }
    } catch (error) {
      console.error(`Error processing deposit address for user ${address.user_id}: ${address.deposit_address}`, error)
    }
  }
}

async function sweepFunds(
  userId: string,
  depositAddress: string,
  encryptedPrivateKey: string,
  iv: string,
  amount: number,
) {
  if (!platformWallet) {
    throw new Error("Platform wallet not initialized")
  }

  let fromPublicKey: PublicKey
  try {
    fromPublicKey = new PublicKey(depositAddress)
  } catch (error) {
    throw new Error(`Invalid deposit address: ${depositAddress}`)
  }

  const response = await fetch("/api/decrypt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ encrypted: encryptedPrivateKey, iv }),
  })

  if (!response.ok) {
    throw new Error("Failed to decrypt private key")
  }

  const { decrypted: privateKeyHex } = await response.json()
  const privateKey = Buffer.from(privateKeyHex, "hex")
  const fromAccount = Keypair.fromSecretKey(privateKey)

  const accountCreationFee = await connection.getMinimumBalanceForRentExemption(0)
  const amountToSweep = amount - accountCreationFee

  if (amountToSweep <= 0) return // Not enough balance to sweep

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey: platformWallet,
      lamports: amountToSweep,
    }),
  )

  const signature = await connection.sendTransaction(transaction, [fromAccount])
  await connection.confirmTransaction(signature)

  // Credit the user
  const credits = (amountToSweep / LAMPORTS_PER_SOL) * 1000 // Convert lamports to SOL, then to credits
  await supabase.rpc("add_user_credits", {
    p_user_id: userId,
    p_credits: Math.floor(credits),
  })
}

export async function encryptPlatformWallet(privateKey: string): Promise<string> {
  return await encrypt(privateKey)
}

export async function decryptPlatformWallet(encryptedPrivateKey: string): Promise<string> {
  return await decrypt(encryptedPrivateKey)
}

// Run this function periodically
setInterval(monitorAndSweepDeposits, 60000) // Check every minute


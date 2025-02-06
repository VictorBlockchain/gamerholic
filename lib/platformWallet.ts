// This file contains the platform wallet initialization and related functions
import { PublicKey, LAMPORTS_PER_SOL, type Connection, Keypair } from "@solana/web3.js"
import { createClient } from "@supabase/supabase-js"
import { decryptPlatformWallet } from "./depositAddresses"

type PlatformSettings = {
  platform_wallet_address: string
  boost_fee: number
  dev_fee_percentage: number
  platform_fee_percentage: number
  top_player_percentage: number
  initial_super_admin_address: string
  encrypted_private_key: string
  iv: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

let platformSettings: PlatformSettings | null = null

export async function initializePlatformWallet(retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase.from("platform_settings").select("*").single()

      if (error) throw error

      if (!data) {
        console.warn("Platform settings not found. Please generate a new platform wallet.")
        return
      }

      platformSettings = data as PlatformSettings
      return
    } catch (error) {
      console.error(`Attempt ${i + 1} failed to initialize platform wallet:`, error)
      if (i === retries - 1) {
        throw new Error("Failed to initialize platform wallet after multiple attempts")
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
    }
  }
}

export function getPlatformWalletPublicKey(): PublicKey {
  if (!platformSettings) {
    throw new Error("Platform settings not initialized")
  }
  return new PublicKey(platformSettings.platform_wallet_address)
}

export function getBoostFee(): number {
  if (!platformSettings) {
    throw new Error("Platform settings not initialized")
  }
  return platformSettings.boost_fee
}

export function getPlatformSettings(): PlatformSettings {
  if (!platformSettings) {
    throw new Error("Platform settings not initialized")
  }
  return { ...platformSettings }
}

export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}

export async function withdrawUserCredits(userId: string, amount: number): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("withdraw_user_credits", {
      p_user_id: userId,
      p_amount: amount,
    })

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error withdrawing user credits:", error)
    return false
  }
}

export async function createDepositAddress(userId: string): Promise<string> {
  try {
    // Validate the userId as a valid Solana public key
    new PublicKey(userId)

    const { data, error } = await supabase.rpc("create_deposit_address", {
      p_user_id: userId,
    })

    if (error) {
      console.error("Error in create_deposit_address RPC:", error)
      throw new Error(`Failed to create deposit address: ${error.message}`)
    }

    if (!data || typeof data !== "string") {
      throw new Error("Invalid response from create_deposit_address RPC")
    }

    return data
  } catch (error) {
    console.error("Error creating deposit address:", error)
    throw error
  }
}

export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key)
    return true
  } catch {
    return false
  }
}

export async function getFinancialStatistics() {
  try {
    const { data, error } = await supabase.rpc("get_financial_statistics")

    if (error) throw error

    return {
      total_game_additions: data.total_game_additions || 0,
      total_boosts: data.total_boosts || 0,
      total_play_fees: data.total_play_fees || 0,
    }
  } catch (error) {
    console.error("Error fetching financial statistics:", error)
    return {
      total_game_additions: 0,
      total_boosts: 0,
      total_play_fees: 0,
    }
  }
}

export async function getPlatformWalletBalance(connection: Connection): Promise<number> {
  const platformWallet = getPlatformWalletPublicKey()
  const balance = await connection.getBalance(platformWallet)
  return balance / LAMPORTS_PER_SOL
}

export async function getTotalUserCredits(): Promise<number> {
  const { data, error } = await supabase.rpc("get_total_user_credits")
  if (error) throw error
  return data
}

export async function getGameStatistics() {
  const { data, error } = await supabase
    .from("games")
    .select("id, title, play_count, boost_count, upvotes, downvotes, is_paused")
    .order("play_count", { ascending: false })

  if (error) throw error
  return data
}

export async function updatePayWallet(
  newPayAddress: string,
):Promise<{ success:boolean}> {
  
  
  const { error } = await supabase
    .from("platform_settings")
    .update({
      payment_wallet: newPayAddress
    })
    .eq("id", 3)
  
  if (error) throw error
  return {success:true}
  
}

export async function updatePlatformFees(
  devFeePercentage: number,
  platformFeePercentage: number,
  topPlayerPercentage: number,
  boostFee: number,
): Promise<void> {
  const { error } = await supabase
    .from("platform_settings")
    .update({
      dev_fee_percentage: devFeePercentage,
      platform_fee_percentage: platformFeePercentage,
      top_player_percentage: topPlayerPercentage,
      boost_fee: boostFee,
    })
    .eq("id", 1)

  if (error) throw error
}

export async function updateGameFees(
  gameId: string,
  devPlayFee: number,
  platformPlayFee: number,
  highestScorePercentage: number,
): Promise<void> {
  const { error } = await supabase
    .from("games")
    .update({
      dev_play_fee: devPlayFee,
      platform_play_fee: platformPlayFee,
      highest_score_percentage: highestScorePercentage,
    })
    .eq("id", gameId)

  if (error) throw error
}

export async function searchUsers(searchTerm: string) {
  const { data, error } = await supabase
    .from("users")
    .select("wallet, username, credits")
    .or(`username.ilike.%${searchTerm}%,wallet.ilike.%${searchTerm}%`)
    .limit(10)

  if (error) throw error
  return data
}

const getRandomBytes = (length: number) => {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function getPlatformWallet(): Promise<{ success:boolean, wallet_platform: string, wallet_payment:string }> {
  
  const { data: existingEntry, error: fetchError }:any = await supabase
  .from('platform_settings')
  .select('platform_wallet_address, payment_wallet')
  .limit(1)
  .single();
  if (existingEntry) {
    console.log('Address already exists:', existingEntry.platform_wallet_address);
    return { success:true, wallet_platform: existingEntry.platform_wallet_address, wallet_payment:existingEntry.payment_wallet };
  }else{
    return { success:false, wallet_platform: '',wallet_payment:'' };
 
  }

}

export async function generateDepositWallet(publicKey:any): Promise<{ success:boolean, message: any}> {

  try{
  
    console.log('user public key is' + publicKey)
    const response = await fetch("/api/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: "platform" }),
    })

    if (!response.ok) {
      return {success:false, message: response.statusText}
      // throw new Error(`Failed to generate deposit wallet: ${response.statusText}`)
    }
  
    const resp:any = await response.json()
    const address = resp.address
    const encryptedPrivateKey = resp.key
    
    const { data, error } = await supabase
    .from("users")
    .update({ 
      deposit_wallet: address, 
      deposit_wallet_encryptedKey: encryptedPrivateKey 
    })
    .eq("publicKey", publicKey); // Condition to match the publicKey
  
  if (error) {
    console.error("Error updating user:", error);
    return {success:false, message: error}
  } else {
    console.log("User updated successfully:", publicKey);
    return {success:true, message: publicKey}
  }
      
  
  } catch (error) {
    console.error("Error in generateDepositWallet:", error)
    throw new Error("Failed to generate platform wallet")
  }

}

export async function generatePlatformWallet(): Promise<{ success:boolean, message: string}> {
  try {
    const response = await fetch("/api/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: "platform" }),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate platform wallet: ${response.statusText}`)
    }
    
      // Check if an address already exists
      const { data: existingEntry, error: fetchError } = await supabase
      .from('platform_settings')
      .select('platform_wallet_address, encrypted_private_key, iv')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "No rows found" error
      console.error('Error checking existing wallet:', fetchError);
      return { success: false, message: '' };
    }
    
    if (existingEntry) {
      console.log('Address already exists:', existingEntry.platform_wallet_address);
      return { success:true, message: existingEntry.platform_wallet_address };
    }
    
    const resp:any = await response.json()
    const publicKey = resp.address
    const encryptedPrivateKey = resp.key
    
    const { data, error } = await supabase
    .from('platform_settings')
    .insert([{ platform_wallet_address: publicKey, encrypted_private_key: encryptedPrivateKey, iv:resp.iv }]);
    
    if (error) {
      return { success:false, message: 'error saving to database' };

    } else {
      return { success:true, message: publicKey };
    
    }
  } catch (error) {
    console.error("Error in generatePlatformWallet:", error)
    throw new Error("Failed to generate platform wallet")
  }
}

export async function processPlatformWithdrawal(amount: number, recipientAddress: string): Promise<string> {
  if (!platformSettings) {
    throw new Error("Platform settings not initialized")
  }

  const { data, error } = await supabase.from("platform_settings").select("encrypted_private_key", "iv").single()

  if (error) throw error

  const decryptedPrivateKey = await decryptPlatformWallet(data.encrypted_private_key, data.iv)
  const keypair = Keypair.fromSecretKey(Buffer.from(decryptedPrivateKey, "base64"))

  // Implement the actual withdrawal logic here using the keypair
  // This is a placeholder and should be replaced with actual Solana transaction code
  console.log(`Withdrawing ${amount} SOL to ${recipientAddress}`)

  // Return the transaction signature
  return "transaction_signature_placeholder"
}

export async function addAdmin(
  superAdminAddress: string,
  newAdminAddress: string,
  adminRole: "admin" | "super_admin",
): Promise<void> {
  const { error } = await supabase.rpc("add_admin", {
    super_admin_user_id: superAdminAddress,
    new_admin_user_id: newAdminAddress,
    admin_role: adminRole,
  })

  if (error) throw error
}

export {
  initializePlatformWallet as initializePlatformWalletOnLoad,
}


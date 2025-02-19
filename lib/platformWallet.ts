import { PublicKey, LAMPORTS_PER_SOL, type Connection, Keypair } from "@solana/web3.js"
import { supabase } from "@/lib/supabase"

type PlatformSettings = {
  boost_fee: number
  initial_super_admin_address: string
  is_paused:boolean
  min_tokens_esports: number
  min_tokens_arcade: number
  min_tokens_tournaments: number
  min_tokens_grabbit: number
  wallet_fee: string
  wallet_platform: string
  fee_esports: number
  fee_tournament: number
  fee_arcade: number
  fee_grabbit: number
  fee_grabit_host:number
  fee_arcade_create: number
  wallet_platform_encrypted_key:string
  wallet_platform_iv:string

}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

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

export function getPlatformWallet(): PublicKey {
  if (!platformSettings) {
    throw new Error("Platform settings not initialized")
  }
  return new PublicKey(platformSettings.wallet_platform)
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
  const platformWallet = getPlatformWallet()
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

export async function updatePlatformWallet(
  newWalletAddress: string,
  encryptedPrivateKey: string,
  iv: string,
): Promise<void> {
  const { error } = await supabase
    .from("platform_settings")
    .update({
      wallet_platform: newWalletAddress,
      encrypted_private_key: encryptedPrivateKey,
      iv: iv,
    })
    .eq("id", 1)

  if (error) throw error

  // Update the local platformSettings
  if (platformSettings) {
    platformSettings.wallet_platform = newWalletAddress
    platformSettings.wallet_platform_encrypted_key = encryptedPrivateKey
    platformSettings.wallet_platform_iv = iv
  }
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

///change this
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

export async function generatePlatformWallet(): Promise<{
  publicKey: string
  encryptedPrivateKey: string
  iv: string
}> {
  try {
    const keypair = Keypair.generate()
    const publicKey = keypair.publicKey.toBase58()
    const privateKey = Buffer.from(keypair.secretKey).toString("base64")
    const { encrypted, iv } = await encryptWalletKey(privateKey)

    return { publicKey, encryptedPrivateKey: encrypted, iv }
  } catch (error) {
    console.error("Error in generatePlatformWallet:", error)
    throw new Error("Failed to generate platform wallet")
  }
}

export async function decryptPlatformWallet(encryptedPrivateKey: string, iv: string): Promise<string> {
  return decryptWalletKey(encryptedPrivateKey, iv)
}

export async function processPlatformWithdrawal(amount: number, recipientAddress: string): Promise<string> {
  if (!platformSettings) {
    throw new Error("Platform settings not initialized")
  }

  const { data, error } = await supabase.from("platform_settings").select("encrypted_private_key, iv").single()

  if (error) throw error

  const decryptedPrivateKey = await decryptWalletKey(data.encrypted_private_key, data.iv)
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

export async function getGamerTokenSettings(): Promise<{
  min_tokens_arcade: number
  min_tokens_esports: number
  min_tokens_tournaments: number
  min_tokens_grabbit: number
}> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("min_tokens_arcade, min_tokens_esports, min_tokens_tournaments, min_tokens_grabbit")
    .single()

  if (error) throw error
  return data
}

export async function updateGamerTokenSettings(settings: {
  min_tokens_arcade: number;
  min_tokens_esports: number;
  min_tokens_tournament: number;
  min_tokens_grabbit: number;
}): Promise<void> {
  // Add the `id` field to the settings object
  const settingsWithId = { id: 1, ...settings };

  // Perform the upsert operation
  const { error } = await supabase
    .from("platform_settings")
    .upsert(settingsWithId, { onConflict: "id" }); // Specify the conflict resolution column

  // Throw an error if something goes wrong
  if (error) throw error;
}

export async function getApprovedTokens() {
  const { data, error } = await supabase.from("approved_tokens").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function addApprovedToken(token: {
  name: string
  ticker: string
  address: string
  status: string
}): Promise<void> {
  const { error } = await supabase.from("approved_tokens").insert(token)

  if (error) throw error
}

export async function updateApprovedToken(
  tokenId: number,
  updates: Partial<{
    name: string
    ticker: string
    address: string
    status: number
  }>,
): Promise<void> {
  const { error } = await supabase.from("approved_tokens").update(updates).eq("id", tokenId)

  if (error) throw error
}

export async function getWallets() {
  const { data, error } = await supabase.from("wallets").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function refreshWallet(walletId: string): Promise<void> {
  // Implement wallet refresh logic here
  // This might involve fetching the latest balance or updating other wallet-related information
  console.log(`Refreshing wallet with ID: ${walletId}`)
}

export async function encryptWalletKey(walletKey: string): Promise<{ encrypted: string; iv: string }> {
  const response = await fetch("/api/crypto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "encrypt", data: walletKey }),
  })
  const result = await response.json()
  if (!result.success) throw new Error("Encryption failed")
  return { encrypted: result.encrypted, iv: result.iv }
}

export async function decryptWalletKey(encrypted: string, iv: string): Promise<string> {
  const response = await fetch("/api/crypto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "decrypt", data: encrypted, iv }),
  })
  const result = await response.json()
  if (!result.success) throw new Error("Decryption failed")
  return result.decrypted
}


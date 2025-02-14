import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Connection, Transaction, SystemProgram, PublicKey, Keypair } from "@solana/web3.js"
import { Token, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token"
import { CryptoManager } from "@/lib/server/cryptoManager"

export async function POST(req: Request) {
  try {
    const { tournamentId, player } = await req.json()

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("game_id", tournamentId)
      .single()

    if (tournamentError) throw tournamentError

    // Get user's deposit wallet
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("deposit_wallet")
      .eq("publicKey", player)
      .single()

    if (userError) throw userError

    // Get tournament wallet
    const { data: tournamentWallet, error: walletError } = await supabase
      .from("wallets")
      .select("address")
      .eq("tournament_id", tournamentId)
      .single()

    if (walletError) throw walletError

    // Get approved token
    const { data: approvedToken, error: tokenError } = await supabase
    .from("approved_tokens")
    .select("*")
    .eq("status", 1) // Only select tokens with status = 1
    .neq("name", "Solana") // Exclude tokens with the name "Solana"
    .single(); // Ensure only one row is returned

    if (tokenError) throw tokenError

    // Get platform settings
    const { data: platformSettings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("min_tokens_tournaments")
      .single()

    if (settingsError) throw settingsError

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, "confirmed")
    const cryptoManager = new CryptoManager()

    // Check if user has enough tokens in their public wallet
    const userPublicKey = new PublicKey(player)
    const tokenMintAddress = new PublicKey(approvedToken.address)
    const userTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, userPublicKey)
    const userTokenBalance = await connection.getTokenAccountBalance(userTokenAccount)

    if (Number.parseFloat(userTokenBalance.value.amount) < platformSettings.min_tokens_tournaments) {
      return NextResponse.json({ error: "Insufficient tokens in wallet to join tournament" }, { status: 400 })
    }

    // Check if user has enough balance in deposit wallet
    let userBalance: number
    if (tournament.prize_type === "Solana") {
      userBalance = await connection.getBalance(new PublicKey(user.deposit_wallet))
      userBalance = userBalance / 1e9 // Convert lamports to SOL
    } else if (tournament.prize_type === "GAMEr") {
      const userDepositTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        new PublicKey(user.deposit_wallet),
      )
      const tokenBalance = await connection.getTokenAccountBalance(userDepositTokenAccount)
      userBalance = Number.parseFloat(tokenBalance.value.amount) / 1e9 // Assuming 9 decimals
    } else {
      throw new Error(`Invalid prize type: ${tournament.prize_type}`)
    }

    if (userBalance < tournament.entry_fee) {
      return NextResponse.json({ error: "Insufficient balance in deposit wallet to join tournament" }, { status: 400 })
    }

    // Decrypt user's deposit wallet private key
    const { data: encryptedWallet, error: encryptedWalletError } = await supabase
      .from("wallets")
      .select("encrypted_private_key, iv")
      .eq("address", user.deposit_wallet)
      .single()

    if (encryptedWalletError) throw encryptedWalletError

    const privateKey = cryptoManager.decrypt(encryptedWallet.encrypted_private_key, encryptedWallet.iv)
    const userKeypair = Keypair.fromSecretKey(Buffer.from(privateKey, "base64"))

    let transaction: Transaction
    if (tournament.prize_type === "Solana") {
      transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: userKeypair.publicKey,
          toPubkey: new PublicKey(tournamentWallet.address),
          lamports: tournament.entry_fee * 1e9, // Convert SOL to lamports
        }),
      )
    } else if (tournament.prize_type === "GAMEr") {
      const fromTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, userKeypair.publicKey)
      const toTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, new PublicKey(tournamentWallet.address))

      transaction = new Transaction().add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          fromTokenAccount,
          toTokenAccount,
          userKeypair.publicKey,
          [],
          tournament.entry_fee * 1e9, // Assuming GAMEr token has 9 decimals like SOL
        ),
      )
    } else {
      throw new Error(`Invalid prize type: ${tournament.prize_type}`)
    }

    const signature = await connection.sendTransaction(transaction, [userKeypair])
    await connection.confirmTransaction(signature)

    // Add user to tournament_players
    const { error: joinError } = await supabase
      .from("tournament_players")
      .insert({ tournament_id: tournamentId, player_id: player })

    if (joinError) throw joinError

    return NextResponse.json({ message: "Successfully joined tournament", signature })
  } catch (error) {
    console.error("Error joining tournament:", error)
    return NextResponse.json({ error: "Failed to join tournament" }, { status: 500 })
  }
}


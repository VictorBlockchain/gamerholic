import { supabase } from "@/lib/supabase"
import Decimal from "decimal.js"

// Set the precision to 9 decimal places
Decimal.set({ precision: 9 })

export async function updateLeaderboardAndPayouts(gameId: string, playerPublicKey: string, score: number) {
  // 1. Get the game details from arcade table
  const { data: game, error: gameError } = await supabase
    .from("arcade")
    .select("play_fee, top_payout, creator")
    .eq("id", gameId)
    .single()

  if (gameError) throw gameError

  const { play_fee, top_payout, creator } = game

  if (play_fee > 0) {
    // 2. Get fee percentages from platform settings
    const { data: settings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("top_player_percentage, dev_fee_percentage, platform_fee_percentage")
      .eq("id", 1)
      .single()

    if (settingsError) throw settingsError

    const { top_player_percentage, dev_fee_percentage, platform_fee_percentage } = settings

    // 3. Get current leaderboard
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from("arcade_leaderboard")
      .select("player, score")
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .limit(top_payout)

    if (leaderboardError) throw leaderboardError

    // Find the position of the new score
    const position = leaderboard.findIndex((entry) => score > entry.score)
    const isNewTopScore = position === 0
    const payoutPositions = position === -1 ? leaderboard.length : position

    if (isNewTopScore || payoutPositions < top_payout) {
      // Calculate fees
      const playFeeDecimal = new Decimal(play_fee)
      const devFee = playFeeDecimal.times(dev_fee_percentage)
      const platformFee = playFeeDecimal.times(platform_fee_percentage)
      const totalPlayerPayout = playFeeDecimal.minus(devFee).minus(platformFee)

      // Calculate payouts
      const topPlayerPayout = totalPlayerPayout.times(top_player_percentage).dividedBy(100)
      const remainingPayout = totalPlayerPayout.minus(topPlayerPayout)

      // Calculate tiered payouts for other positions
      const payouts = calculateTieredPayouts(remainingPayout, payoutPositions - 1)

      // Update leaderboard and distribute payouts
      const { data: updatedLeaderboard, error: updateError } = await supabase
        .from("arcade_leaderboard")
        .upsert({ game_id: gameId, player: playerPublicKey, score })
        .select()

      if (updateError) throw updateError

      // Distribute payouts
      if (isNewTopScore) {
        await creditUser(gameId, playerPublicKey, topPlayerPayout.toNumber())
        for (let i = 1; i < payoutPositions; i++) {
          await creditUser(gameId, leaderboard[i].player, payouts[i - 1].toNumber())
        }
      } else {
        await creditUser(gameId, leaderboard[0].player, topPlayerPayout.toNumber())
        for (let i = 1; i < payoutPositions; i++) {
          const recipientPublicKey = i < position ? leaderboard[i].player : playerPublicKey
          await creditUser(gameId, recipientPublicKey, payouts[i - 1].toNumber())
        }
      }

      // Credit developer and platform
      await creditDeveloperAndPlatform(gameId, devFee.toNumber(), platformFee.toNumber())
    }
  } else {
    // If play_fee is 0, just update the leaderboard without payouts
    const { error: updateError } = await supabase
      .from("arcade_leaderboard")
      .upsert({ game_id: gameId, player: playerPublicKey, score })

    if (updateError) throw updateError
  }
}

function calculateTieredPayouts(remainingPayout: Decimal, positions: number): Decimal[] {
  const payouts: Decimal[] = []
  let remainingAmount = remainingPayout
  const decayFactor = new Decimal(0.5) // Adjust this to change the steepness of the payout curve

  for (let i = 0; i < positions; i++) {
    const share = remainingAmount.times(Decimal.sub(1, decayFactor))
    payouts.push(share)
    remainingAmount = remainingAmount.minus(share)
  }

  // Distribute any remaining amount to the last position
  if (remainingAmount.greaterThan(0) && payouts.length > 0) {
    payouts[payouts.length - 1] = payouts[payouts.length - 1].plus(remainingAmount)
  }

  return payouts
}

async function creditUser(gameId: string, playerPublicKey: string, amount: number) {
  const { data, error } = await supabase.rpc("increment_player_credits", {
    game_id: gameId,
    player: playerPublicKey,
    credits: amount,
  })

  if (error) throw error
}

async function creditDeveloperAndPlatform(gameId: string, devAmount: number, platformAmount: number) {
  const { data, error } = await supabase.rpc("increment_commision_credits", {
    game_id: gameId,
    dev_amount: devAmount,
    platform_amount: platformAmount,
  })

  if (error) throw error
}


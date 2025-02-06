import { supabase } from "@/lib/supabase"

export async function updateLeaderboardAndPayouts(gameId: string, userId: string, score: number) {
  const { data: game, error: gameError } = await supabase.from("games").select("*").eq("id", gameId).single()

  if (gameError) throw gameError

  const { data: leaderboard, error: leaderboardError } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(game.leaderboard_size)

  if (leaderboardError) throw leaderboardError

  const newPosition = leaderboard.findIndex((entry) => score > entry.score)
  const isNewTopScore = newPosition === 0
  const payoutAmount = game.play_fee * (1 - game.dev_fee_percentage - game.platform_fee_percentage)

  if (isNewTopScore) {
    // Player took the #1 spot, no payouts to other players
    await creditDeveloperAndPlatform(game, userId)
  } else if (newPosition > 0) {
    // Player made it to the leaderboard but not #1
    await processPayouts(leaderboard, newPosition, payoutAmount)
    await creditDeveloperAndPlatform(game, userId)
  } else if (newPosition === -1 && leaderboard.length < game.leaderboard_size) {
    // Player didn't beat any scores but the leaderboard isn't full
    await creditDeveloperAndPlatform(game, userId)
  }

  // Update the leaderboard
  if (newPosition !== -1 || leaderboard.length < game.leaderboard_size) {
    await updateLeaderboardEntry(gameId, userId, score)
  }
}

async function processPayouts(leaderboard: any[], newPosition: number, payoutAmount: number) {
  const payouts = calculatePayouts(newPosition, payoutAmount)
  for (let i = 0; i < newPosition; i++) {
    await creditUser(leaderboard[i].user_id, payouts[i])
  }
}

function calculatePayouts(newPosition: number, totalAmount: number): number[] {
  if (newPosition === 1) {
    return [totalAmount]
  } else {
    const firstPlacePayout = totalAmount * 0.7
    const remainingPayout = totalAmount * 0.3
    return [firstPlacePayout, remainingPayout]
  }
}

async function creditUser(userId: string, amount: number) {
  const { error } = await supabase.rpc("add_user_credits", {
    p_user_id: userId,
    p_amount: amount,
  })

  if (error) throw error
}

async function creditDeveloperAndPlatform(game: any, userId: string) {
  const devAmount = game.play_fee * game.dev_fee_percentage
  const platformAmount = game.play_fee * game.platform_fee_percentage

  await creditUser(game.developer_id, devAmount)
  await creditPlatform(platformAmount)
}

async function creditPlatform(amount: number) {
  const { data: admin, error: adminError } = await supabase.from("users").select("id").eq("role", "admin").single()

  if (adminError) throw adminError

  await creditUser(admin.id, amount)
}

async function updateLeaderboardEntry(gameId: string, userId: string, score: number) {
  const { error } = await supabase.from("leaderboard").upsert({ game_id: gameId, user_id: userId, score })

  if (error) throw error
}


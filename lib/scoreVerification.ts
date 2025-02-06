import { supabase } from "@/lib/supabase"
import type { GameMetrics } from "./types"

export async function verifyScore(gameId: string, userId: string, score: number, playTime: number): Promise<boolean> {
  // Fetch game metrics
  const { data: gameMetrics, error } = await supabase.from("game_metrics").select("*").eq("game_id", gameId).single()

  if (error) {
    console.error("Error fetching game metrics:", error)
    return false
  }

  const metrics: GameMetrics = gameMetrics

  // Check against maximum possible score if it exists
  if (metrics.maxPossibleScore !== null && score > metrics.maxPossibleScore) {
    console.warn(`Score ${score} exceeds max possible score of ${metrics.maxPossibleScore}`)
    return false
  }

  // Check if score is within typical range
  if (score < metrics.typicalScoreRange.min || score > metrics.typicalScoreRange.max) {
    console.warn(
      `Score ${score} is outside typical range: ${metrics.typicalScoreRange.min} - ${metrics.typicalScoreRange.max}`,
    )
    // Don't immediately return false, but flag for further investigation
  }

  // Check score rate based on scoring type
  const scorePerMinute = score / (playTime / 60000)
  let scoreFactor: number

  switch (metrics.scoringType) {
    case "linear":
      scoreFactor = scorePerMinute / metrics.averageScorePerMinute
      if (scoreFactor > 5) {
        // Allow up to 5x the average for linear scoring
        console.warn(`Suspicious linear score rate: ${scoreFactor}x average`)
        return false
      }
      break
    case "exponential":
      // For exponential scoring, we'll use a logarithmic comparison
      scoreFactor = Math.log(scorePerMinute) / Math.log(metrics.averageScorePerMinute)
      if (scoreFactor > 2) {
        // Allow up to 2x the log of the average for exponential scoring
        console.warn(`Suspicious exponential score rate: ${scoreFactor}x log average`)
        return false
      }
      break
    case "achievement-based":
      // For achievement-based scoring, check against the highest recorded achievement score
      const highestAchievementScore = metrics.scoreDistribution[metrics.scoreDistribution.length - 1].score
      if (score > highestAchievementScore * 1.5) {
        // Allow up to 50% more than the highest recorded achievement
        console.warn(`Suspicious achievement score: ${score} vs highest ${highestAchievementScore}`)
        return false
      }
      break
  }

  // Check against historical score distribution
  const playerPercentile =
    metrics.scoreDistribution.findIndex((d) => score <= d.score) / metrics.scoreDistribution.length
  if (playerPercentile > 0.9999) {
    // If the score is higher than 99.99% of all previous scores
    console.warn(`Exceptionally high score detected: ${score} (top ${(1 - playerPercentile) * 100}%)`)
    // Flag for manual review, but don't immediately reject
  }

  return true
}


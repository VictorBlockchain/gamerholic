import { supabase } from "@/lib/supabase"

export async function updateAdaptiveThresholds(gameId: string) {
  const { data: recentScores, error } = await supabase
    .from("game_sessions")
    .select("score, play_time")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(1000)

  if (error) {
    console.error("Error fetching recent scores:", error)
    return
  }

  const scores = recentScores.map((s) => s.score).sort((a, b) => a - b)
  const playTimes = recentScores.map((s) => s.play_time)

  const newMetrics = {
    averageScorePerMinute: calculateAverageScorePerMinute(scores, playTimes),
    typicalScoreRange: {
      min: scores[Math.floor(scores.length * 0.01)], // 1st percentile
      max: scores[Math.floor(scores.length * 0.99)], // 99th percentile
    },
    scoreDistribution: calculateScoreDistribution(scores),
  }

  await supabase.from("game_metrics").update(newMetrics).eq("game_id", gameId)
}

function calculateAverageScorePerMinute(scores: number[], playTimes: number[]): number {
  const scorePerMinute = scores.map((score, i) => score / (playTimes[i] / 60000))
  return scorePerMinute.reduce((a, b) => a + b, 0) / scorePerMinute.length
}

function calculateScoreDistribution(scores: number[]): { percentile: number; score: number }[] {
  return [0.5, 0.75, 0.9, 0.95, 0.99, 0.999, 0.9999].map((percentile) => ({
    percentile,
    score: scores[Math.floor(scores.length * percentile)],
  }))
}


export interface GameMetrics {
  gameId: string
  maxPossibleScore: number | null // null if there's no upper limit
  averageScorePerMinute: number
  scoringType: "linear" | "exponential" | "achievement-based"
  typicalScoreRange: {
    min: number
    max: number
  }
  scoreDistribution: {
    percentile: number
    score: number
  }[]
}


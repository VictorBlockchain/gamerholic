import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyGameToken, checkAndStoreNonce } from "@/lib/gameSession"
import { verifyScore } from "@/lib/scoreVerification"
import { decryptScore } from "@/lib/scoreEncryption"
import { updateLeaderboardAndPayouts } from "@/lib/leaderboardPayouts"

export async function POST(request: Request) {
  const { gameId, userId, sessionId, encryptedScore, gameToken, playTime } = await request.json()

  if (!gameId || !userId || !sessionId || !encryptedScore || !gameToken || !playTime) {
    return NextResponse.json({success: false, message: "Missing required fields" }, { status: 400 })
  }
  
  const decodedToken = verifyGameToken(gameToken)
  if (!decodedToken || decodedToken.gameId !== gameId || decodedToken.userId !== userId) {
    return NextResponse.json({success:false, message: "Invalid game token" }, { status: 401 })
  }

  if (!checkAndStoreNonce(decodedToken.nonce)) {
    return NextResponse.json({ success:false, message: "Token already used" }, { status: 401 })
  }

  const score = decryptScore(encryptedScore)

  if (!(await verifyScore(gameId, userId, score, playTime))) {
    // Instead of immediately rejecting, flag for review
    await supabase.from("flagged_scores").insert({ gameId, userId, score, playTime })
    console.warn(`Flagged suspicious score for review: Game ${gameId}, User ${userId}, Score ${score}`)
  }

  try {
    // Update game session
    const { error: sessionError } = await supabase
      .from("game_sessions")
      .update({ end_time: new Date().toISOString(), score, play_time: playTime })
      .eq("id", sessionId)

    if (sessionError) throw sessionError

    // Update leaderboard and process payouts
    await updateLeaderboardAndPayouts(gameId, userId, score)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error ending game:", error)
    return NextResponse.json({ error: "Failed to end game" }, { status: 500 })
  }
}


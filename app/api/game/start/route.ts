import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generateGameToken } from "@/lib/gameSession"
import { deductUserCredits } from "@/lib/userCredits"

export async function POST(request: Request) {
  const { gameId, userId } = await request.json()

  if (!gameId || !userId) {
    return NextResponse.json({ error: "Missing gameId or userId" }, { status: 400 })
  }

  try {
    // Check if the platform is paused
    const { data: platformSettings, error: platformError } = await supabase
      .from("platform_settings")
      .select("is_paused")
      .single()

    if (platformError) throw platformError

    if (platformSettings.is_paused) {
      return NextResponse.json({ error: "Platform is currently paused", isPaused: true }, { status: 403 })
    }

    // Fetch game details and check if the game is paused
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("play_fee, is_paused")
      .eq("id", gameId)
      .single()

    if (gameError) throw gameError

    if (game.is_paused) {
      return NextResponse.json({ error: "This game is currently paused", isPaused: true }, { status: 403 })
    }

    // Deduct play fee from user credits
    const deductionResult = await deductUserCredits(userId, game.play_fee)
    if (!deductionResult.success) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Create game session
    const { data, error } = await supabase
      .from("game_sessions")
      .insert({ game_id: gameId, user_id: userId, start_time: new Date().toISOString() })
      .select()

    if (error) throw error

    const gameToken = generateGameToken(gameId, userId)

    return NextResponse.json({ sessionId: data[0].id, gameToken })
  } catch (error) {
    console.error("Error starting game:", error)
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
  }
}


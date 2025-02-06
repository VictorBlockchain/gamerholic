import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const { gameId } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if the user is the game creator
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("creator_wallet")
    .eq("id", gameId)
    .single()

  if (gameError) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  if (game.creator_wallet === user.id) {
    return NextResponse.json({ error: "Game creators cannot test their own games" }, { status: 403 })
  }

  // Assign the game to the tester
  const { data, error } = await supabase
    .from("games")
    .update({ current_tester_id: user.id, status: "in_testing", last_test_date: new Date().toISOString() })
    .eq("id", gameId)
    .select()

  if (error) {
    return NextResponse.json({ error: "Failed to assign game for testing" }, { status: 500 })
  }

  return NextResponse.json({ success: true, game: data[0] })
}


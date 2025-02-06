import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const { gameId, testResult, score, feedback } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if the user is the current tester for this game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("current_tester_id")
    .eq("id", gameId)
    .single()

  if (gameError || game.current_tester_id !== user.id) {
    return NextResponse.json({ error: "You are not authorized to submit test results for this game" }, { status: 403 })
  }

  // Update the game status based on the test result
  const newStatus = testResult === "pass" ? "test_passed" : "test_failed"
  const { data, error } = await supabase
    .from("games")
    .update({
      status: newStatus,
      test_feedback: feedback,
      high_score: score, // Only update if it's a passing test
    })
    .eq("id", gameId)
    .select()

  if (error) {
    return NextResponse.json({ error: "Failed to submit test results" }, { status: 500 })
  }

  // If the test passed, allocate credits to the tester
  if (testResult === "pass") {
    const { error: allocationError } = await supabase.rpc("allocate_tester_credits", {
      p_game_id: gameId,
      p_tester_id: user.id,
    })

    if (allocationError) {
      console.error("Error allocating tester credits:", allocationError)
      // We don't return an error here as the test submission was successful
    }
  }

  return NextResponse.json({ success: true, game: data[0] })
}


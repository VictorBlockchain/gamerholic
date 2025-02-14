import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { refundPlayers } from "@/lib/tournament-utils"

export async function POST(req: Request) {
  try {
    const { tournamentId } = await req.json()

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("game_id", tournamentId)
      .single()

    if (tournamentError) throw tournamentError

    // Get players
    const { data: players, error: playersError } = await supabase
      .from("tournament_players")
      .select("player_id")
      .eq("tournament_id", tournamentId)

    if (playersError) throw playersError

    // Refund players
    await refundPlayers(
      tournamentId,
      players.map((p) => p.player_id),
      tournament.entry_fee,
      tournament.prize_type,
    )

    // Update tournament status
    const { error: updateError } = await supabase
      .from("tournaments")
      .update({ status: "canceled" })
      .eq("game_id", tournamentId)

    if (updateError) throw updateError

    return NextResponse.json({ message: "Tournament canceled successfully" })
  } catch (error) {
    console.error("Error canceling tournament:", error)
    return NextResponse.json({ error: "Failed to cancel tournament" }, { status: 500 })
  }
}


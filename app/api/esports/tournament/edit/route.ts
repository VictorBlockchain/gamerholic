import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { tournamentId, title, startDate, startTime, maxPlayers } = await req.json()

    const { data, error } = await supabase
      .from("tournaments")
      .update({
        title,
        start_date: startDate,
        start_time: startTime,
        max_players: maxPlayers,
      })
      .eq("game_id", tournamentId)

    if (error) throw error

    return NextResponse.json({ message: "Tournament updated successfully", data })
  } catch (error) {
    console.error("Error updating tournament:", error)
    return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 })
  }
}


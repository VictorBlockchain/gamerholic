import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { tournamentId, winnerId } = await req.json()

    // Fetch the tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("game_id", tournamentId)
      .single()

    if (tournamentError) throw tournamentError

    // Fetch the final match
    const finalRound = Math.log2(tournament.max_players)
    const { data: finalMatch, error: matchError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("round", finalRound)
      .single()

    if (matchError) throw matchError

    // Check if this is indeed the final match and the winner is correct
    if (finalMatch.winner_id !== winnerId) {
      return NextResponse.json({ error: "Invalid winner or not the final match" }, { status: 400 })
    }

    // Calculate the prize amount
    const totalPrize = tournament.entry_fee * tournament.max_players * (tournament.prize_percentage / 100)
    const winnerPrize = totalPrize * (tournament.first_place_percentage / 100)

    // TODO: Implement the actual payment logic here
    // This could involve interacting with a payment API or updating the user's balance in your database

    // Update the tournament status to completed
    const { error: updateError } = await supabase
      .from("tournaments")
      .update({ status: "completed" })
      .eq("game_id", tournamentId)

    if (updateError) throw updateError

    return NextResponse.json({ message: "Winner paid successfully", prize: winnerPrize })
  } catch (error) {
    console.error("Error processing winner payment:", error)
    return NextResponse.json({ error: "Failed to process winner payment" }, { status: 500 })
  }
}


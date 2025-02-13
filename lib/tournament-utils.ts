import type { SupabaseClient } from "@supabase/supabase-js"

export async function updateTournamentBracket(
  supabase: SupabaseClient,
  tournamentId: number,
  matchId: number,
  winnerId: string,
) {
  const { data: currentMatch, error: currentMatchError } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("id", matchId)
    .single()

  if (currentMatchError) throw currentMatchError

  // Find or create the next round match
  const nextRound = currentMatch.round + 1
  const nextMatchOrder = Math.ceil(currentMatch.match_order / 2)

  const { data: existingNextMatch, error: existingMatchError } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("round", nextRound)
    .eq("match_order", nextMatchOrder)
    .maybeSingle()

  if (existingMatchError && existingMatchError.code !== "PGRST116") throw existingMatchError

  if (existingNextMatch) {
    // Update existing next round match
    const updateData = existingNextMatch.player1_id === null ? { player1_id: winnerId } : { player2_id: winnerId }

    const { error: nextMatchUpdateError } = await supabase
      .from("tournament_matches")
      .update(updateData)
      .eq("id", existingNextMatch.id)

    if (nextMatchUpdateError) throw nextMatchUpdateError
  } else {
    // Check if this was the final match
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("game_id", tournamentId)
      .single()

    if (tournamentError) throw tournamentError

    if (currentMatch.round === Math.log2(tournament.max_players)) {
      // This was the final match, update tournament status and create results
      await updateTournamentResults(supabase, tournamentId, winnerId)
    } else {
      // Create new next round match
      const { error: insertError } = await supabase.from("tournament_matches").insert({
        tournament_id: tournamentId,
        round: nextRound,
        match_order: nextMatchOrder,
        player1_id: winnerId,
        player2_id: null,
        winner_id: null,
        player1_score: null,
        player2_score: null,
        match_date: new Date().toISOString(),
      })

      if (insertError) throw insertError
    }
  }
}

async function updateTournamentResults(supabase: SupabaseClient, tournamentId: number, winnerId: string) {
  // Update tournament status to completed
  const { error: tournamentUpdateError } = await supabase
    .from("tournaments")
    .update({ status: "completed" })
    .eq("game_id", tournamentId)

  if (tournamentUpdateError) throw tournamentUpdateError

  // Get tournament details
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("game_id", tournamentId)
    .single()

  if (tournamentError) throw tournamentError

  // Get final match
  const { data: finalMatch, error: finalMatchError } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("round", Math.log2(tournament.max_players))
    .single()

  if (finalMatchError) throw finalMatchError

  // Calculate prize amounts
  const totalPrizePool = tournament.entry_fee * tournament.max_players * (tournament.prize_percentage / 100)
  const firstPlacePrize = totalPrizePool * (tournament.first_place_percentage / 100)
  const secondPlacePrize = totalPrizePool * (tournament.second_place_percentage / 100)
  const thirdPlacePrize = totalPrizePool * (tournament.third_place_percentage / 100)

  // Insert results for 1st and 2nd place
  const { error: insertResultsError } = await supabase.from("tournament_results").insert([
    { tournament_id: tournamentId, player_id: winnerId, position: 1, prize_amount: firstPlacePrize },
    {
      tournament_id: tournamentId,
      player_id: finalMatch.player1_id === winnerId ? finalMatch.player2_id : finalMatch.player1_id,
      position: 2,
      prize_amount: secondPlacePrize,
    },
  ])

  if (insertResultsError) throw insertResultsError

  // Find and update third place
  const { data: semifinalMatches, error: semifinalMatchesError } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("round", Math.log2(tournament.max_players) - 1)

  if (semifinalMatchesError) throw semifinalMatchesError

  const thirdPlaceId = semifinalMatches
    .flatMap((match) => [match.player1_id, match.player2_id])
    .find((id) => id !== finalMatch.player1_id && id !== finalMatch.player2_id)

  if (thirdPlaceId) {
    const { error: insertThirdPlaceError } = await supabase
      .from("tournament_results")
      .insert({ tournament_id: tournamentId, player_id: thirdPlaceId, position: 3, prize_amount: thirdPlacePrize })

    if (insertThirdPlaceError) throw insertThirdPlaceError
  }
}


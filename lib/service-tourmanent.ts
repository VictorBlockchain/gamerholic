import { supabase } from "./supabase"

export interface Tournament {
  game_id: number
  title: string
  game: string
  console: string
  entry_fee: number
  prize_percentage: number
  first_place_percentage: number
  second_place_percentage: number
  third_place_percentage: number
  rules: string
  start_date: string
  start_time?: string
  money: number
  max_players: number
  image_url: string
  status: string
  host_id: string
  winner_take_all: boolean
  type: number
  gamer_to_join: number
  is_team_tournament: boolean
}

export interface TournamentPlayer {
  id: string
  tournament_id: number
  player_id: string
  joined_at: string
}

export interface TournamentTeam {
  id: string
  tournament_id: number
  team_id: string
  joined_at: string
}

export interface TournamentWallet {
  wallet: string
  solana: number
  gamer: number
}

export interface Match {
  id: number
  tournament_id: number
  round: number
  match_order: number
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  player1_score: number | null
  player2_score: number | null
  match_date: string | null
}

export interface TournamentResult {
  id: string
  tournament_id: number
  player_id: string
  position: number
  prize_amount: number
}

// Get all tournaments
export async function getTournaments(limit = 20): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("start_time", { ascending: true })
    .limit(limit)
  
  if (error) {
    console.error("Error fetching tournaments:", error)
    return []
  }

  return data || []
}

// Get tournament by ID
export async function getTournamentById(tournamentId: number): Promise<Tournament | null> {
  const { data, error } = await supabase.from("tournaments").select("*").eq("tournament_id", tournamentId).single()
  
  if (error) {
    console.error("Error fetching tournament:", error)
    return null
  }

  return data
}

// Get tournament wallet
export async function getTournamentWallet(tournamentId: number): Promise<TournamentWallet | null> {
  const { data, error } = await supabase.from("wallet_tournament").select("*").eq("tournament_id", tournamentId).maybeSingle()
  let wallet = null
  let solana = 0
  let gamer = 0
  if (error) {
    console.error("Error fetching tournament wallet:", error)
    return null
  }
  if(data){
    wallet = data.wallet
    solana = data.solana
    gamer = data.gamer
  }
  
  return {
    wallet: wallet,
    solana: solana,
    gamer: gamer,
  }
}

// Get tournament matches
export async function getTournamentMatches(tournamentId: number): Promise<Match[]> {
  const { data, error } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: true })
    .order("match_order", { ascending: true })

  if (error) {
    console.error("Error fetching tournament matches:", error)
    return []
  }

  return data || []
}

// Get tournament players
export async function getTournamentPlayers(tournamentId: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("tournament_players")
    .select("player_id")
    .eq("tournament_id", tournamentId)

  if (error) {
    console.error("Error fetching tournament players:", error)
    return []
  }

  return data.map((p) => p.player_id) || []
}

// Get tournament teams
export async function getTournamentTeams(tournamentId: number): Promise<string[]> {
  const { data, error } = await supabase.from("tournament_teams").select("team_id").eq("tournament_id", tournamentId)

  if (error) {
    console.error("Error fetching tournament teams:", error)
    return []
  }

  return data.map((t) => t.team_id) || []
}

// Get player details
export async function getPlayerDetails(playerIds: string[]): Promise<any[]> {
  if (playerIds.length === 0) return []

  const { data, error } = await supabase
    .from("players")
    .select("player, name, avatar")
    .in("player", playerIds)

  if (error) {
    console.log("Error fetching player details:", error)
    return []
  }

  return data || []
}

// Get player records
export async function getPlayerRecords(playerIds: string[], game: string): Promise<any[]> {
  if (playerIds.length === 0) return []

  const { data, error } = await supabase
    .from("esports_records")
    .select("player, wins, losses, win_streak, loss_streak")
    .in("player", playerIds)
    .eq("game", game)

  if (error) {
    console.error("Error fetching player records:", error)
    return []
  }

  return data || []
}

// Join tournament (individual)
export async function joinTournament(
  tournamentId: number,
  playerId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if player is already in the tournament
    const { data: existingPlayer, error: checkError } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("player_id", playerId)
      .single()

    if (existingPlayer) {
      return { success: false, message: "You are already registered for this tournament" }
    }
    
    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("tournament_id", tournamentId)
      .single()
    
    if (tournamentError) throw tournamentError

    // Check if tournament is full
    const { count, error: countError }:any = await supabase
      .from("tournament_players")
      .select("id", { count: true })
      .eq("tournament_id", tournamentId)

    if (countError) throw countError

    if (count >= tournament.max_players) {
      return { success: false, message: "Tournament is already full" }
    }

    // Add player to tournament
    const { error: joinError } = await supabase.from("tournament_players").insert({
      tournament_id: tournamentId,
      player_id: playerId,
      joined_at: new Date().toISOString(),
    })

    if (joinError) throw joinError

    return { success: true, message: "Successfully joined the tournament" }
  } catch (error) {
    console.error("Error joining tournament:", error)
    return { success: false, message: "An error occurred while joining the tournament" }
  }
}

// Join tournament (team)
export async function joinTournamentAsTeam(
  tournamentId: number,
  teamId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if team is already in the tournament
    const { data: existingTeam, error: checkError } = await supabase
      .from("tournament_teams")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("team_id", teamId)
      .single()

    if (existingTeam) {
      return { success: false, message: "This team is already registered for this tournament" }
    }

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("tournament_id", tournamentId)
      .single()

    if (tournamentError) throw tournamentError

    // Check if tournament is for teams
    if (!tournament.is_team_tournament) {
      return { success: false, message: "This tournament is for individual players only" }
    }

    // Check if tournament is full
    const { count, error: countError } = await supabase
      .from("tournament_teams")
      .select("id", { count: true })
      .eq("tournament_id", tournamentId)

    if (countError) throw countError

    if (count >= tournament.max_players) {
      return { success: false, message: "Tournament is already full" }
    }

    // Add team to tournament
    const { error: joinError } = await supabase.from("tournament_teams").insert({
      tournament_id: tournamentId,
      team_id: teamId,
      joined_at: new Date().toISOString(),
    })

    if (joinError) throw joinError

    return { success: true, message: "Successfully joined the tournament" }
  } catch (error) {
    console.error("Error joining tournament as team:", error)
    return { success: false, message: "An error occurred while joining the tournament" }
  }
}

// Start tournament
export async function startTournament(tournamentId: number): Promise<{ success: boolean; message: string }> {
  try {
    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("tournament_id", tournamentId)
      .single()

    if (tournamentError) throw tournamentError

    if (tournament.status !== "upcoming") {
      return { success: false, message: "Tournament has already started or is completed" }
    }

    // Get participants (players or teams)
    let participants: string[] = []

    if (tournament.is_team_tournament) {
      const teams = await getTournamentTeams(tournamentId)
      participants = teams
    } else {
      const players = await getTournamentPlayers(tournamentId)
      participants = players
    }

    const participantCount = participants.length

    if (participantCount < 2) {
      return { success: false, message: "At least 2 participants are required to start the tournament" }
    }

    // For bracket tournaments, check if participant count is a power of 2
    if (tournament.type === 1 && (participantCount & (participantCount - 1)) !== 0) {
      return {
        success: false,
        message: "For bracket tournaments, the number of participants must be a power of 2 (2, 4, 8, 16, etc.)",
      }
    }

    // Shuffle participants
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5)

    // Create matches for bracket tournament
    if (tournament.type === 1) {
      const matches = []
      for (let i = 0; i < shuffledParticipants.length; i += 2) {
        matches.push({
          tournament_id: tournamentId,
          round: 1,
          match_order: Math.floor(i / 2) + 1,
          player1_id: shuffledParticipants[i],
          player2_id: shuffledParticipants[i + 1] || null,
          match_date: new Date().toISOString(),
        })
      }

      const { error: matchesError } = await supabase.from("tournament_matches").insert(matches)
      if (matchesError) throw matchesError
    }

    // Update tournament status
    const { error: updateError } = await supabase
      .from("tournaments")
      .update({ status: "in-progress" })
      .eq("tournament_id", tournamentId)

    if (updateError) throw updateError

    return { success: true, message: "Tournament started successfully" }
  } catch (error) {
    console.error("Error starting tournament:", error)
    return { success: false, message: "An error occurred while starting the tournament" }
  }
}

// Report match score
export async function reportMatchScore(
  matchId: number,
  player1Score: number,
  player2Score: number,
): Promise<{ success: boolean; message: string }> {
  try {
    if (player1Score === player2Score) {
      return { success: false, message: "Scores cannot be tied. Please enter different scores for each player." }
    }

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("id", matchId)
      .single()

    if (matchError) throw matchError

    // Determine winner
    const winnerId = player1Score > player2Score ? match.player1_id : match.player2_id

    // Update match
    const { error: updateError } = await supabase
      .from("tournament_matches")
      .update({
        player1_score: player1Score,
        player2_score: player2Score,
        winner_id: winnerId,
      })
      .eq("id", matchId)

    if (updateError) throw updateError

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("tournament_id", match.tournament_id)
      .single()

    if (tournamentError) throw tournamentError

    // Update bracket
    await updateTournamentBracket(match.tournament_id, matchId, winnerId)

    // Check if this was the final match
    const isLastRound = match.round === Math.log2(tournament.max_players)

    if (tournament.status === "in-progress" && isLastRound) {
      // Process tournament completion and payouts
      await processTournamentCompletion(match.tournament_id, winnerId)
      return {
        success: true,
        message: "Match score updated and tournament completed. Payouts have been processed.",
      }
    }

    return { success: true, message: "Match score updated successfully" }
  } catch (error) {
    console.error("Error reporting match score:", error)
    return { success: false, message: "An error occurred while updating the match score" }
  }
}

// Update tournament bracket
async function updateTournamentBracket(tournamentId: number, matchId: number, winnerId: string): Promise<void> {
  try {
    // Get the current match
    const { data: currentMatch, error: matchError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("id", matchId)
      .single()

    if (matchError) throw matchError

    // Get all matches in the tournament
    const { data: allMatches, error: allMatchesError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("round", { ascending: true })
      .order("match_order", { ascending: true })

    if (allMatchesError) throw allMatchesError

    // Find the next match in the bracket
    const nextRound = currentMatch.round + 1
    const nextMatchOrder = Math.ceil(currentMatch.match_order / 2)

    const nextMatch = allMatches.find((m) => m.round === nextRound && m.match_order === nextMatchOrder)

    if (!nextMatch) return // No next match (this was the final)

    // Determine which player slot to update in the next match
    const isFirstPlayerInNextMatch = currentMatch.match_order % 2 !== 0

    // Update the next match with the winner
    if (isFirstPlayerInNextMatch) {
      await supabase.from("tournament_matches").update({ player1_id: winnerId }).eq("id", nextMatch.id)
    } else {
      await supabase.from("tournament_matches").update({ player2_id: winnerId }).eq("id", nextMatch.id)
    }
  } catch (error) {
    console.error("Error updating tournament bracket:", error)
    throw error
  }
}

// Process tournament completion
async function processTournamentCompletion(tournamentId: number, winnerId: string): Promise<void> {
  try {
    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("tournament_id", tournamentId)
      .single()

    if (tournamentError) throw tournamentError

    // Update tournament status
    await supabase.from("tournaments").update({ status: "completed" }).eq("tournament_id", tournamentId)

    // Calculate prize pool
    const prizePool = tournament.entry_fee * tournament.max_players * (tournament.prize_percentage / 100)

    // Create tournament results
    const results = []

    // Winner (1st place)
    const firstPlacePrize = tournament.winner_take_all
      ? prizePool
      : prizePool * (tournament.first_place_percentage / 100)

    results.push({
      tournament_id: tournamentId,
      player_id: winnerId,
      position: 1,
      prize_amount: firstPlacePrize,
    })

    if (!tournament.winner_take_all && tournament.max_players > 2) {
      // Find 2nd place (loser of final match)
      const { data: finalMatch, error: finalMatchError } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("round", Math.log2(tournament.max_players))
        .single()

      if (!finalMatchError && finalMatch) {
        const secondPlaceId = finalMatch.player1_id === winnerId ? finalMatch.player2_id : finalMatch.player1_id

        const secondPlacePrize = prizePool * (tournament.second_place_percentage / 100)

        results.push({
          tournament_id: tournamentId,
          player_id: secondPlaceId,
          position: 2,
          prize_amount: secondPlacePrize,
        })

        // For 3rd place, we'd need to track semifinal losers
        // This is a simplified implementation
        if (tournament.max_players >= 4) {
          const thirdPlacePrize = prizePool * (tournament.third_place_percentage / 100)

          // Find semifinal matches
          const { data: semifinalMatches, error: semifinalError } = await supabase
            .from("tournament_matches")
            .select("*")
            .eq("tournament_id", tournamentId)
            .eq("round", Math.log2(tournament.max_players) - 1)

          if (!semifinalError && semifinalMatches && semifinalMatches.length > 0) {
            // Find the semifinal losers
            const semifinalLosers = semifinalMatches
              .filter((match) => match.winner_id && match.winner_id !== match.player1_id)
              .map((match) => match.player1_id)
              .concat(
                semifinalMatches
                  .filter((match) => match.winner_id && match.winner_id !== match.player2_id)
                  .map((match) => match.player2_id),
              )
              .filter((id) => id) // Remove nulls

            // Add 3rd place result(s)
            if (semifinalLosers.length > 0) {
              // If there are multiple semifinal losers, they share 3rd place
              const individualThirdPlacePrize = thirdPlacePrize / semifinalLosers.length

              semifinalLosers.forEach((loserId) => {
                results.push({
                  tournament_id: tournamentId,
                  player_id: loserId,
                  position: 3,
                  prize_amount: individualThirdPlacePrize,
                })
              })
            }
          }
        }
      }
    }

    // Insert results
    if (results.length > 0) {
      await supabase.from("tournament_results").insert(results)
    }

    // Process payouts (this would typically call an API endpoint)
    // For now, we'll just update the status
    await supabase.from("tournaments").update({ status: "paid" }).eq("tournament_id", tournamentId)
  } catch (error) {
    console.error("Error processing tournament completion:", error)
    throw error
  }
}

// Create tournament
export async function createTournament(
  tournamentData: Partial<Tournament>,
): Promise<{ success: boolean; tournamentId?: number; message: string }> {
  try {
    const { data, error } = await supabase.from("tournaments").insert(tournamentData).select()

    if (error) throw error

    if (!data || data.length === 0) {
      throw new Error("No data returned after creating tournament")
    }

    // Create tournament wallet
    // await supabase.from("wallets").insert({
    //   tournament_id: data[0].tournament_id,
    //   public_key: `tournament_${data[0].tournament_id}`,
    //   solana: 0,
    //   gamer: 0,
    //   last_update: new Date().toISOString(),
    // })
    
    return {
      success: true,
      tournamentId: data[0].game_id,
      message: "Tournament created successfully",
    }
  } catch (error) {
    console.error("Error creating tournament:", error)
    return {
      success: false,
      message: "An error occurred while creating the tournament",
    }
  }
}


import { supabase } from "@/lib/supabase"
import Decimal from "decimal.js"

// Set the precision to 9 decimal places
Decimal.set({ precision: 9 })

const fetchLeaderData = async (game_id: number, player: string) => {
  const { data, error: fetchError } = await supabase
    .from("arcade_leaderboard")
    .select("id, credits, credits_available")
    .eq("game_id", game_id)
    .eq("player", player)
    .single()
  
  if (fetchError) {
    console.error(`Error fetching leaderboard data for player ${player}:`, fetchError)
    return null
  }
  
  return data
}

const fetchArcadeData = async (game_id: number) => {
  const { data, error: fetchError } = await supabase
    .from("arcade")
    .select("id, earnings_creator, earnings_creator_available")
    .eq("game_id", game_id)
    .single()
  
  if (fetchError) {
    console.error(`Error fetching aracade data`, fetchError)
    return null
  }
  
  return data
}
export async function updateLeaderboardAndPayouts(gameId: string, playerPublicKey: string, score: number) {
  try {
    // 1. Get the game details from arcade table
    const { data: game, error: gameError } = await supabase
      .from("arcade")
      .select("play_fee, top_payout, creator")
      .eq("game_id", gameId)
      .single();

    if (gameError) throw gameError;

    const { play_fee, top_payout, creator } = game;

    if (play_fee > 0) {
      // 2. Get current leaderboard
      const { data: leaderboard, error: leaderboardError } = await supabase
        .from("arcade_leaderboard")
        .select("*")
        .eq("game_id", gameId)
        .order("score", { ascending: false })
        .limit(top_payout);

      if (leaderboardError) throw leaderboardError;

      // Find the position of the new score
      const position = leaderboard.findIndex((entry) => score > entry.score);
      const isNewTopScore = position === 0;
      const payoutPositions = position === -1 ? leaderboard.length : position;

      // Determine eligible players for payouts
      const eligiblePlayers = leaderboard.slice(0, payoutPositions);

      // Exclude the submitting player from payouts
      const filteredPlayers = eligiblePlayers.filter((player) => player.player !== playerPublicKey);

      // Calculate fees
      let dev_fee_percentage = 10 / 100; // Developer fee percentage
      const playFeeDecimal = new Decimal(play_fee);
      const devFee = playFeeDecimal.times(dev_fee_percentage); // Developer fee
      const totalPlayerPayout = playFeeDecimal.minus(devFee);

      // Credit the developer
      await creditDeveloper(gameId, creator, devFee.toNumber());

      if (filteredPlayers.length > 0) {
        // If there are eligible players, distribute payouts
        if (filteredPlayers.length === 1) {
          // If only one eligible player, they get the entire payout
          await creditUser(gameId, filteredPlayers[0].player, totalPlayerPayout.toNumber());
        } else {
          // Otherwise, use the tiered payout logic
          const top_player_percentage = 40 / 100;
          const topPlayerPayout = totalPlayerPayout.times(top_player_percentage);
          const remainingPayout = totalPlayerPayout.minus(topPlayerPayout);

          // Credit the top player
          if (filteredPlayers[0]) {
            await creditUser(gameId, filteredPlayers[0].player, topPlayerPayout.toNumber());
          }

          // Credit remaining players with scaled payouts
          if (filteredPlayers.length > 1) {
            const payouts = calculateTieredPayouts(remainingPayout, filteredPlayers.length - 1);

            for (let i = 1; i < filteredPlayers.length; i++) {
              await creditUser(gameId, filteredPlayers[i].player, payouts[i - 1].toNumber());
            }
          }
        }
      } else {
        // If no eligible players, credit the entire remaining amount to the developer
        await creditDeveloper(gameId, creator, totalPlayerPayout.toNumber());
      }
    } else {
      // If play_fee is 0, just update the leaderboard without payouts
      const { error: updateError } = await supabase
        .from("arcade_leaderboard")
        .upsert({ game_id: gameId, player: playerPublicKey, score });

      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error("Error updating leaderboard and payouts:", error);
  }
}

// Function to calculate tiered payouts
function calculateTieredPayouts(remainingPayout: Decimal, positions: number): Decimal[] {
  const payouts: Decimal[] = [];
  let remainingAmount = remainingPayout;
  const decayFactor = new Decimal(0.5); // Adjust this to change the steepness of the payout curve

  for (let i = 0; i < positions; i++) {
    const share = remainingAmount.times(Decimal.sub(1, decayFactor));
    payouts.push(share);
    remainingAmount = remainingAmount.minus(share);
  }

  // Distribute any remaining amount to the last position
  if (remainingAmount.greaterThan(0) && payouts.length > 0) {
    payouts[payouts.length - 1] = payouts[payouts.length - 1].plus(remainingAmount);
  }

  return payouts;
}
async function creditUser(gameId: any, playerPublicKey: string, amount: any) {
  try {
    const data = await fetchLeaderData(gameId, playerPublicKey)
    if (!data) {
      console.error("No leaderboard data found for the player.")
      return
    }

    // Step 2: Calculate the new values
    const newCredits = data.credits + amount
    const newCreditsAvailable = data.credits_available + amount

    // Step 3: Update the database
    const { error } = await supabase
      .from("arcade_leaderboard")
      .update({
        credits: newCredits,
        credits_available: newCreditsAvailable,
      })
      .eq("id", data.id)

    if (error) {
      console.error(`Error crediting user ${playerPublicKey}:`, error)
    } else {
      console.log(`Credited ${amount} to user ${playerPublicKey}`)
    }
  } catch (error) {
    console.error(`Error crediting user ${playerPublicKey}:`, error)
  }
}

async function creditDeveloper(gameId: any, developerPublicKey: string, amount: number) {
  try {
    const data = await fetchArcadeData(gameId);
    if (!data) {
      console.error("No leaderboard data found for the developer.");
      return;
    }
    
    // Step 2: Calculate the new values
    const newCredits = data.earnings_creator + amount;
    const newCreditsAvailable = data.earnings_creator_available + amount;

    // Step 3: Update the database
    const { error } = await supabase
      .from("arcade")
      .update({
        earnings_creator: newCredits,
        earnings_creator_available: newCreditsAvailable,
      })
      .eq("game_id", gameId);

    if (error) {
      console.error(`Error crediting developer ${developerPublicKey}:`, error);
    } else {
      console.log(`Credited ${amount} to developer ${developerPublicKey}`);
    }
  } catch (error) {
    console.error(`Error crediting developer ${developerPublicKey}:`, error);
  }
}
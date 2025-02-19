import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyGameToken, checkAndStoreNonce } from "@/lib/gameSession"
import { verifyScore } from "@/lib/scoreVerification"
import { decryptScore } from "@/lib/scoreEncryption"
import { updateLeaderboardAndPayouts } from "@/lib/leaderboardPayouts"
import moment from 'moment';

const fetchGameData = async (game_id:number) => {
  const { data, error: fetchError } = await supabase
  .from("arcade")
  .select("*")
  .eq("game_id", game_id)
  .single(); // Limit to the most recent entry
  
  if (fetchError) {
    console.error(`Error fetching game data`)
    return null
  }
  
  return data
}

const fetchSessionData = async (session_id:number) => {
  const { data, error: fetchError } = await supabase
  .from("arcade_session")
  .select("*")
  .eq("id", session_id)
  .single(); // Limit to the most recent entry
  
  if (fetchError) {
    console.error(`Error fetching game data`)
    return null
  }
  
  return data
}

const fetchPlayData = async (player: string, game_id:number) => {
  const { data, error: fetchError } = await supabase
  .from("arcade_sessions")
  .select("*")
  .eq("arcade_id", game_id)
  .eq("player", player)
  .order("start_time", { ascending: false }) // Order by 'created_at' in descending order
  .limit(1); // Limit to the most recent entry
  
  if (fetchError) {
    console.error(`Error fetching game data`)
    return null
  }
  
  return data
}

const fetchLeaderBoardData = async (player: string, game_id:number) => {
  const { data, error: fetchError } = await supabase
  .from("arcade_leaderboard")
  .select("*")
  .eq("game_id", game_id)
  .eq("player", player)
  .maybeSingle()

  if (fetchError) {
    console.error(`Error fetching game data`)
    return null
  }
  
  return data
}

export async function POST(request: Request) {
  let { gameId, userId, sessionId, encryptedScore, gameToken } = await request.json()
  if(sessionId && !userId){
   let session = await fetchSessionData(sessionId)
   if(session){
    userId = session.player
   }
  }
  console.log(gameId, userId, sessionId, encryptedScore, gameToken)

  if (!gameId || !userId || !sessionId || !encryptedScore || !gameToken) {
    return NextResponse.json({success: false, message: "Missing required fields" }, { status: 400 })
  }
  
  const decodedToken = verifyGameToken(gameToken)
  if (!decodedToken || decodedToken.gameId !== gameId || decodedToken.userId !== userId) {
    console.log("Invalid token");
    return NextResponse.json({success:false, message: "Invalid game token" }, { status: 401 })
  }
  
  if (!checkAndStoreNonce(decodedToken.nonce)) {
    console.log("Invalid nonce");
    return NextResponse.json({ success:false, message: "Token already used" }, { status: 401 })
  }
  
  const score = decryptScore(encryptedScore)
  console.log('score is ' + score)
  // if (!(await verifyScore(gameId, userId, score, playTime))) {
  //   // Instead of immediately rejecting, flag for review
  //   await supabase.from("flagged_scores").insert({ game_id:gameId, player:userId, score:score, play_time:playTime })
  //   console.warn(`Flagged suspicious score for review: Game ${gameId}, User ${userId}, Score ${score}`)
  // }
  
  try {
    
    const gameData:any = await fetchGameData(gameId)
    
    const data:any = await fetchPlayData(userId, gameId)    
        // Update game session
        const { error: sessionError } = await supabase
        .from("arcade_sessions")
        .update({ end_time: moment().toISOString(), score:score, play_time: gameData.play_time })
        .eq("id", data[0].id)
      
      if (sessionError){
        console.log(sessionError)
      }
  
    // Update leaderboard and process payouts
    const { data: existingData, error: fetchError } = await supabase
      .from("arcade_leaderboard")
      .select("score")
      .eq("game_id", gameId)
      .eq("player", userId)
      .single();
    
    if (fetchError && fetchError.code !== "PGRST116") {
      // Ignore "no rows" error (code PGRST116 means no matching row was found)
      console.error("Error fetching existing leaderboard entry:", fetchError);
      return;
    }
    
    const existingScore = existingData?.score || 0;
    console.log(existingScore)
    // Step 2: Only upsert if the new score is greater than the existing score
    if (score > existingScore) {
      const { data: upsertData, error: upsertError } = await supabase
        .from("arcade_leaderboard")
        .upsert(
          {
            game_id: gameId,
            player: userId,
            score: score,
            session_id: sessionId, // Replace with actual session ID if available
            play_date: moment().toISOString(), // Set the current timestamp
          },
          { onConflict: "game_id,player" } // Specify the unique constraint columns
        );
    
      if (upsertError) {
        console.error("Error upserting leaderboard entry:", upsertError);
      } else {
        console.log("Leaderboard entry upserted successfully:", upsertData);
      }
    }
  
    // Update leaderboard and process payouts
    await updateLeaderboardAndPayouts(gameId, userId, score)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error ending game:", error)
    return NextResponse.json({ error: "Failed to end game" }, { status: 500 })
  }
}


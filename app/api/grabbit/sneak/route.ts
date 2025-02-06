import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server"

const fetchGameData = async (gameid:any) => {
  const { data, error: fetchError } = await supabase
  .from("grabbit")
  .select("*")
  .eq("game_id", gameid)
  .single();
  
  if (fetchError) {
    console.error(`Error fetching game data`);
    return null;
  }

  return data;
};

const fetchPlayerData = async (gameid:any, userId:any) => {
  console.log(gameid, userId)
  const { data, error: fetchError } = await supabase
  .from("grabbit_players")
  .select("*")
  .eq("game_id", gameid)
  .eq("player", userId)
  .eq("status", 1)
  .single()
  
  if (fetchError) {
    console.error(`Error fetching player data`);
    
    return null;
  }
  
  return data;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, userId } = body;
    const currentTime:any = new Date().toISOString();
    let startTime;
    let endTime;
      // Query Supabase for the game record
    let gameData:any = await fetchGameData(gameId)
    let playerData:any = await fetchPlayerData(gameId,userId)
    // console.log(playerData)
    //withdraw expired players from game
    if(gameData.status==3){
        
      //ensure player is in this game
      if(playerData){
      
          if(playerData.sneaks<1){
             return NextResponse.json({success:false, message:'you are out of sneaks, reload'})
          }else{

            if(playerData.sneak_open){
               return NextResponse.json({success:false, message:'sneak hole open'})

            }else{
                
                let sneaks = playerData.sneaks - 1
                let sneaksUsed = playerData.sneaks_used + 1
                const { data, error } = await supabase
                .from("grabbit_players")
                .update({
                  sneak_open: true,
                  sneaks: sneaks,
                  sneaks_used: sneaksUsed
                })
                .eq("game_id", gameId)
                .eq("player", userId)
                if(!error){
                   return NextResponse.json({success:false, message:'sneak hole open'})

                }else{
                   return NextResponse.json({success:false, message:'error opening sneak hole'})
                }
            }
          }

      }else{
         return NextResponse.json({success:false, message:'you are not in this game'})
      }

  }else{
     return NextResponse.json({success:false, message:'game over'})
  }

  }catch(error){
    return NextResponse.json({success:false})
  }
}

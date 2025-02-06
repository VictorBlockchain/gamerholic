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
    let gameData:any = await fetchGameData(gameId)
    let playerData:any = await fetchPlayerData(gameId,userId)

    if(gameData.status==3){
        
        //ensure player is in this game
        if(playerData){
        
            if(playerData.slaps<1){
               return NextResponse.json({success:false, message:'you are out of slaps, reload'})
            }else{
            
                if(gameData.slapper){
                    return NextResponse.json({success:false, message:'slap pending...'})
                }else{
                    
                    const { data, error } = await supabase
                    .from("grabbit")
                    .update({
                      slapper: userId,
                    })
                    .eq("game_id", gameId)
                    if(!error){

                        let slapsUsed = playerData.slaps_used + 1
                        let slaps = playerData.slaps - 1
                        const { data, error } = await supabase
                        .from("grabbit_players")
                        .update({
                          slaps: slaps,
                          slaps_used: slapsUsed
                        })
                        .eq("game_id", gameId)
                        .eq("player", userId)
                        if(!error){
                            return NextResponse.json({success:true, message:'slap pending...'})
                        }
                    
                    }
                }
            }
            
            
        }else{
           return NextResponse.json({success:false, message:'you are not in this game'})
        
        }

    }else{

       return  NextResponse.json({success:false, message:'game over'})
 
    }

  }catch(error){
    return NextResponse.json({success:false})
  }
}

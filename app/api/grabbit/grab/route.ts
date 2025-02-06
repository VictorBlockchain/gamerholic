import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server"
import moment from "moment";

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

const fetchPlayersData = async (gameid:any) => {
  const { data, error: fetchError } = await supabase
  .from("grabbit_players")
  .select("*")
  .eq("game_id", gameid)
  .eq("status", 1)
  
  if (fetchError) {
    console.error(`Error fetching players data`);
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

const fetchUserData = async (publicKey:any) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("publicKey", publicKey)
      .single();
  
  if (error) {
    console.error(`Error fetching players data`);
    return null;
  }
  
  return data;
};
const updateGameData = async (gameid:any, userId:any, userName:any, userAvatar:any, endTime:any) => {
  console.log(userId, userName, userAvatar)
    const { data, error } = await supabase
    .from("grabbit")
    .update({
      end_time: endTime,
      winner: userId,
      winner_name: userName,
      winner_avatar: userAvatar
    })
    .eq("game_id", gameid) 
    
    if (error) {
      console.error(`Error updating game data`);
      
      return {success:false};
    }
    
    return {success:true};
    ;
  };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, userId, name, avatar } = body;
    const currentTime:any = new Date().toISOString();
    
    let gameData:any = await fetchGameData(gameId)
    // let playersData:any = await fetchPlayersData(gameId)
    let playerData:any = await fetchPlayerData(gameId,userId)
    let userData:any = await fetchUserData(userId)
    const timeNow = moment();
    if(gameData.status==3){

        //ensure player is in this game
        if(playerData){
        
            if(playerData.grabs<1){
              const { data, error } = await supabase
              .from("grabbit_players")
              .update({
                  grabs: 50,
              })
              .eq("game_id", gameId)
              .eq("player", userId)
                return NextResponse.json({success:false, message:'you are out of grabs, reload'})
            }
            if(gameData.winner==userId && !playerData.sneak_open){

              return NextResponse.json({success:false, message:'double grab prevented'})

            }
            if(gameData.slapper && gameData.slapper!=userId){
                //you were slapped
                const { data, error } = await supabase
                .from("grabbit")
                .update({
                  slapper: null,
                })
                .eq("game_id", gameId)
                if(!error){
                    return NextResponse.json({success:true, message:'your were slapped'})
                }else{
                    return NextResponse.json({success:false, message:'error updating slap'})
                }
            }
            
            //confirm gameEndTime > now
            if(gameData.end_time){
                // Get the current time
                  const gameEndTime = moment(gameData.end_time);
                if(gameEndTime.isAfter(timeNow)){
                    //process grab
                    let holdTime:any;
                    if(playerData.sneak_open){
                        
                       holdTime = timeNow.add(3, "seconds");
                      ///update player sneak open to false
        
                    }else{
                    
                       holdTime = timeNow.add(10, "seconds");
          
                    }
                    
                    let resp:any = await updateGameData(gameId, userId, userData.username, userData.avatar_url,holdTime)
                    if(resp.success){
                        //subtract grab
                        let grabs = playerData.grabs - 1
                        let grabsUsed = playerData.grabs_used + 1
                        const { data, error } = await supabase
                        .from("grabbit_players")
                        .update({
                            grabs: grabs,
                            grabs_used: grabsUsed,
                            sneak_open: false
                        })
                        .eq("game_id", gameId)
                        .eq("player", userId)
            
                        if(!error){
                            return NextResponse.json({success:true, message:'you grabbed it'})
                        
                        }else{
                            return NextResponse.json({success:false, message:'error updating grabs'})
                        }
                    }else{
                        // console.log(resp)
                        return NextResponse.json({success:true, message:'error updating game data'})

                    }
                }else{
                    return NextResponse.json({success:true, message:'game over!'})
                }
            
            }else{
             //1st grab   

             let holdTime:any;
             if(playerData.sneak_open){
                 
                holdTime = timeNow.add(3, "seconds");
 
 
             }else{
             
                holdTime = timeNow.add(10, "seconds");
   
             }
             
             let resp:any = await updateGameData(gameId, userId, userData.username, avatar,holdTime)
             if(resp.success){
                //subtract grab
                let grabs = playerData.grabs - 1
                let grabsUsed = playerData.grabsUsed + 1

                 const { data, error } = await supabase
                 .from("grabbit_players")
                 .update({
                     grabs: grabs,
                     grabs_used: grabsUsed,
                     sneak_open: false
                 })
                 .eq("game_id", gameId)
                 .eq("player", userId)
     
                 if(!error){
                     return NextResponse.json({success:false, message:'error updating player grabs'})
                 
                 }else{
                     return NextResponse.json({success:true, message:'grabbed 2'})

                 }
             }else{
                return NextResponse.json({success:true, message:'error updating game data'})
 
             }
            }
        
        }else{
        
            return NextResponse.json({success:false, message:'you are not in this game'})

        }
    
    }else if (gameData.status==4){
        
        return NextResponse.json({success:false, message:'game over 2'})
    }


  }catch(error){
    return NextResponse.json({success:false})
  }
}

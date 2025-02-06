import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server"
import moment from "moment";
// import "moment-timezone";

const fetchGameData = async (gameid: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("grabbit")
      .select("*")
      .eq("game_id", gameid)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching game data for game_id=${gameid}:`, error.message);

      // If no data is found, create a practice game
      if (error.message === "No rows found") {
        console.log("No game found. Creating a practice game...");
      }
      
      throw error; // Rethrow other errors
    }
    return data; // Return the fetched game data
  } catch (err) {
    console.error("Failed to fetch game data:", err);
    return null; // Return null or handle the error as needed
  }
};

const fetchPlayersData = async (gameid:any) => {
  const { data, error: fetchError } = await supabase
  .from("grabbit_players")
  .select("*")
  .eq("game_id", gameid)
  .in("status", [1, 2]);
  
  if (fetchError) {
    console.error(`Error fetching players data`);
    return null;
  }
  
  return data;
};

const fetchPlayerData = async (gameid:any, userId:any) => {
  
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

const calculateTimeDifference = (time: any) => {
  try {
    // Parse the current time in UTC
    const timeNow = moment.utc();
    
    // Parse the start_time from the database with its timezone
    const startTime = moment.tz(time, "UTC"); // Adjust "UTC" to the actual timezone if needed
    
    // Calculate the difference in seconds
    const differenceInSeconds = timeNow.diff(startTime, "seconds");

    console.log("Time difference in seconds:", differenceInSeconds);

    return differenceInSeconds;
  } catch (error) {
    console.error("Error calculating time difference:", error);
    return null; // Return null or handle the error as needed
  }
};

export async function POST(req: Request) {
  try {
    
    const body = await req.json();
    const { gameId, userId } = body;
    
    let startTime;
    let endTime;
      // Query Supabase for the game record
    let gameData:any = await fetchGameData(gameId)
    // console.log(gameData)
    let playersData:any = await fetchPlayersData(gameId)
    const timeNow:any = moment();
    
    //withdraw expired players from game
    if(gameData.players_min > playersData.length){
      
      for (let index = 0; index < playersData.length; index++) {
        const element = playersData[index];
        const seat_expire = moment(element.seat_expire)
        if(seat_expire <= timeNow){
          const { error } = await supabase
          .from('grabbit_players')
          .update({ status: 0 })
          .eq('player', element.player);
        }
      }
      
    }else{
      
      if(gameData.status==1){
        
        if(!gameData.start_time){
          const start_time = moment().add(1, "minutes").toISOString(); // Convert to ISO string
          const { data, error } = await supabase
          .from("grabbit")
          .update({
            status: 2,
            start_time: start_time
          })
          .eq("game_id", gameId) 
        }
      }else{
        
        if(gameData.status == 2){
          let start_time = moment(gameData.start_time);
          console.log("there" + timeNow, start_time)

          if(start_time.isBefore(timeNow)){
            console.log("here here")

            //start the game
            const { data, error } = await supabase
            .from("grabbit")
            .update({
              status: 3,
            })
            .eq("game_id", gameId)  
          }
        }
        if(gameData.status==3){
                    // console.log("here")

          if(gameData.end_time){
            console.log("here also")
            // console.log(timeLeft)
            const gameEndTime = moment(gameData.end_time);
            if(timeNow.isAfter(gameEndTime)){
              console.log("here also now")

              if(gameEndTime.isBefore(timeNow)){
                const { data, error } = await supabase
                .from("grabbit")
                .update({
                  status: 4,
                })
                .eq("game_id", gameId)
              }
            }else{
              console.log(gameEndTime, timeNow)

            }
          }
        }
        if(gameData.status==4){
          //update player status
          for (let index = 0; index < playersData.length; index++) {
            const element = playersData[index];
            if(element.status == 1){
              const { error } = await supabase
              .from('grabbit_players')
              .update({ status: 2 })
              .eq('player', element.player);
            }
          }
        }
      }
    }
    
    playersData = await fetchPlayersData(gameId)
    if(playersData.length!=gameData.playersReady){
      const { data, error } = await supabase
      .from("grabbit")
      .update({
        players_ready: playersData.length,
      })
      .eq("game_id", gameId)
    }
    const { data, error } = await supabase
    .from("grabbit")
    .update({
      players: playersData,
    })
    .eq("game_id", gameId)
    // Return the formatted game data
    return NextResponse.json({success:true});

  }catch(error){
    return NextResponse.json({success:false})
  }
}

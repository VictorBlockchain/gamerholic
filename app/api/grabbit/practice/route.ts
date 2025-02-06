import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server"
import moment from "moment";
import "moment-timezone";
const setPracticeGame = async (): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("grabbit")
      .insert({
        created_by: 'FpkoJzLxj51YFcf1Uy2hEEXYGm4migKMrWKhRiAgHiF8',
        details: 'practice makes perfect, sneak before you grab, slap after you grab',
        end_time: null,
        free_grabs: 25,
        free_slaps: 25,
        free_sneaks: 25,
        grabs_to_join: 0,
        image: '/practice.jpg',
        last_grab: null,
        players: [],
        players_max: 25,
        players_min: 2,
        players_ready: 0,
        prize_amount: 0,
        prize_token: null,
        prize_token_name: null,
        slapper: null,
        start_time: null,
        status: 1,
        title: 'practice',
        entry_fee: 0,
        entry_fee_token: null,
        wallet: null,
        winner: null,
        winner_avatar: null,
        winner_name: null,
      })
      .select();
    
    if (error) {
      console.error("Error inserting practice game:", error.message);
      throw error; // Rethrow the error to propagate it
    }
    
    return data; // Return the inserted data
  } catch (err) {
    console.error("Failed to set practice game:", err);
    return null; // Return null or handle the error as needed
  }
};


export async function POST(req: Request) {
  try {
    
    const body = await req.json();
    const { userId } = body;
    
    const { data, error }: any = await supabase
      .from('grabbit')
      .select('*')
      .eq('title', 'practice')
      .eq('status', 1)
    
    if (error) {
      console.error('Error fetching practice games:', error);
      throw error;
    }

    // Check if there are fewer than 3 practice games
    if (data.length < 3) {
    //   console.log(`Only ${data.length} practice games found. Creating ${3 - data.length} more...`);

      // Create additional practice games
      for (let i = data.length; i < 3; i++) {
        await setPracticeGame();
      }

    //   console.log('Successfully created 3 practice games.');
    } else {
    //   console.log('There are already 3 or more practice games.');
    }

   return NextResponse.json({success:true});

  }catch(error){
    return NextResponse.json({success:false})
  }
}

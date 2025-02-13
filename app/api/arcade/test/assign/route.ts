import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  const { gameId, user } = await request.json()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Check if the user is the game creator
  const { data: game, error: gameError } = await supabase
    .from("arcade")
    .select("creator_wallet")
    .eq("id", gameId)
    .single()
  
  if (gameError) {
    console.log("game error")

    return NextResponse.json({ success: false, message: "Game not found" }, { status: 404 })
  }

  if (game.creator_wallet === user.id) {
    console.log("can't do it")

    return NextResponse.json({ success: false,  messaage: "Game creators cannot test their own games" }, { status: 403 })
  }
  
  // Assign the game to the tester
  const { data, error } = await supabase
    .from("arcade")
    .update({ tester: user, status: 2, test_date: new Date().toISOString() })
    .eq("id", gameId)
    .select()
  
  if (error) {
    console.log(error)
    return NextResponse.json({ success:false, message: "Failed to assign game for testing" }, { status: 500 })
  }else{
    console.log("done")
    return NextResponse.json({ success: true, game: data[0] })
  
  }

}


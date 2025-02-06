import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
// pages/api/grabbit/game.ts
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { gameId } = req.query;
  
  if (!gameId) {
    return res.status(400).json({ error: "gameId is required" });
  }

  try {
    const { data, error } = await supabase
      .from("grabbit")
      .select("*")
      .eq("game_id", gameId)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Game not found" });
    }

    return res.status(200).json({
      id: data.game_id,
      title: data.title,
      freeGrabs: data.freeGrabs,
      freeSlaps: data.freeSlaps,
      freeSneaks: data.freeSneaks,
      image: data.image,
      playersMin: data.playersMin,
      playersMax: data.playersMax,
      playersReady: data.playersReady,
      status: data.status,
      prizeToken: data.prize_token,
      prizeAmount: data.prize_amount,
      winner: data.winner,
      free_grabs: data.free_grabs,
      free_slaps: data.free_slaps,
      free_sneaks: data.free_sneaks,
      players: data.players
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}


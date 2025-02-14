import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Keypair } from "@solana/web3.js"
import { CryptoManager } from "@/lib/server/cryptoManager"
import * as z from "zod"
const moment = require("moment");
const cryptoManager = new CryptoManager()

const formSchema = z.object({
  title: z.string(),
  game: z.string(),
  console: z.string(),
  entryFee: z.string(),
  prizePercentage: z.string(),
  firstPlacePercentage: z.string(),
  secondPlacePercentage: z.string(),
  thirdPlacePercentage: z.string(),
  rules: z.string(),
  start_date: z.string(),
  prizeType: z.string(),
  playerCount: z.number(),
  tournamentImage: z.string(),
  host_id: z.number(),
})

type RequestBody = z.infer<typeof formSchema> & { startTime: string }

export async function POST(req: Request) {
  try {
    const { start_date, startTime, host_id, ...rest } = (await req.json()) as RequestBody
    const parsedStartDate = moment(start_date);

    // Replace the time component with startTime
    const startDateTime = parsedStartDate
    .clone() // Clone to avoid mutating the original object
    .hours(parseInt(startTime.split(":")[0], 10)) // Set hours
    .minutes(parseInt(startTime.split(":")[1], 10)) // Set minutes
    .seconds(0); // Reset seconds to 0
    
    // Log the input values for debugging
    console.log("Parsed Start Date:", parsedStartDate.format());
    console.log("Combined Start DateTime:", startDateTime.format());
    
    // console.log(startDate, startTime)
    // const startDateTime = moment(`${startDate}T${startTime}:00`);
    // console.log(startDate, startTime)
    
    const now = moment();
    if (startDateTime.isBefore(now)) {
      console.log("in the past")
    }else{
      console.log(rest)
    
    }
    // Generate a new Solana keypair for the tournament wallet
    const tournamentWallet = Keypair.generate()
    const publicKey = tournamentWallet.publicKey.toString()
    const privateKey = Buffer.from(tournamentWallet.secretKey).toString("hex")
    
    // Encrypt the private key
    const { iv, encrypted } = cryptoManager.encrypt(privateKey)
    
    // Insert the new tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .insert({
        title: rest.title,
        game: rest.game,
        console: rest.console,
        first_place_percentage: rest.firstPlacePercentage,
        second_place_percentage: rest.secondPlacePercentage,
        third_place_percentage: rest.thirdPlacePercentage,
        prize_type: rest.prizeType,
        max_players: rest.playerCount,
        image_url: rest.tournamentImage,
        start_date: startDateTime.toISOString(),
        entry_fee: Number(rest.entryFee),
        prize_percentage: Number(rest.prizePercentage),
        rules: rest.rules,
        status: "upcoming",
        host_id: host_id
      })
      .select()
      .single()
    
    if (tournamentError) throw tournamentError
    // Insert the wallet information
    const { error: walletError } = await supabase.from("wallets").insert({
      type: "tournament",
      public_key: publicKey,
      encrypted_key: encrypted,
      iv,
      tournament_id: tournament.game_id,
      esports_id: null,
      arcade_id: null,
      grabbit_id: null
    })

    if (walletError) throw walletError

    return NextResponse.json({ success: true, tournament })
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
}


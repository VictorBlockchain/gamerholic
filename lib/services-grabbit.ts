import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import moment from "moment"
import "moment-timezone"
import { balanceManager } from "@/lib/balance"

const Balance = new balanceManager()

export interface GameData {
  create_date: any
  created_by: string
  details: string
  end_time: any
  free_grabs: number
  free_slaps: number
  free_sneaks: number
  game_id: number
  grabs_to_join: number
  id: any
  image: string
  last_grab: any
  players: any
  players_max: number
  players_min: number
  players_ready: number
  prize_amount: number
  prize_token: string
  prize_token_name: string
  slapper: string
  start_time: any
  status: number
  title: string
  token_amount_to_join: number
  token_to_join: string
  wallet: string
  winner: string
  winner_avatar: string
  winner_name: string
  prize_claimed?: boolean
  prize_claim_tx?: string
}

export const grabbitService = {
  async fetchNSetGame(gameId: string) {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.from("grabbit").select("*").eq("game_id", gameId).maybeSingle()

    if (error) {
      console.error("Error fetching game:", error)
      return { gameData: null, gameWalletBalance: 0 }
    }

    const balance = await Balance.getBalance(data.wallet)
    const gameWalletBalance = balance.solana / 10 ** 9

    return { gameData: data, gameWalletBalance }
  },

  async fetchGameData(gameId: string, publicKey: string) {
    try {
      const response = await fetch("/api/grabbit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          gameId: gameId,
          userId: publicKey,
        }),
      })
      return await response.json()
    } catch (err) {
      console.error("Error fetching game data:", err)
      return { success: false, error: err }
    }
  },

  async tryBecomeLeader(publicKey: string, supabase: any) {
    const now = moment.utc()
    const threeSecondsAgo = moment.utc(now).subtract(3, "seconds")

    const { data, error } = await supabase.from("poll_leader").select("*").maybeSingle()

    if (error && error.message !== "No rows found") {
      console.error("Error fetching leader:", error.message)
      return false
    }

    if (data) {
      const lastActive = moment.utc(data.last_active)

      if (!data || lastActive.isBefore(threeSecondsAgo)) {
        const leaderId = data.id
        const { error: updateError } = await supabase
          .from("poll_leader")
          .update({
            public_key: publicKey,
            last_active: now.toISOString(),
          })
          .eq("id", leaderId)

        if (updateError) {
          console.error("Error updating leader:", updateError.message)
          return false
        } else {
          return true
        }
      }
    } else {
      const { error: insertError } = await supabase.from("poll_leader").insert({
        public_key: publicKey,
        last_active: now.toISOString(),
      })

      if (insertError) {
        console.error("Error inserting leader:", insertError.message)
        return false
      } else {
        return true
      }
    }

    return false
  },

  async sendHeartbeat(publicKey: string, supabase: any) {
    console.log("Sending heartbeat")
    const { error } = await supabase
      .from("poll_leader")
      .update({ last_active: moment.utc().toISOString() })
      .eq("public_key", publicKey)

    if (error) {
      console.error("Error sending heartbeat:", error.message)
      return false
    }
    return true
  },

  async fetchGames() {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.from("grabbit").select(`*`).eq("status", 1)

    if (error) {
      console.error("Error fetching games:", error)
      return { gamesData: [], showCreatePractice: false }
    }

    const { count } = await supabase
      .from("grabbit")
      .select("id", { count: "exact" })
      .eq("title", "practice")
      .eq("status", 1)

    const showCreatePractice = count < 2

    return { gamesData: data, showCreatePractice }
  },

  async handleSlap(gameId: string, publicKey: string) {
    const supabase = createClientComponentClient()
    const { data: gameData }:any = await supabase.from("grabbit").select("status").eq("game_id", gameId).single()

    if (gameData.status === 1 || gameData.status === 2) {
      return { success: false, message: "Game hasn't started yet" }
    } else if (gameData.status === 4) {
      return { success: false, message: "Game is over" }
    } else if (gameData.status === 3) {
      const response = await fetch("/api/grabbit/slap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: gameId,
          userId: publicKey,
        }),
      })

      return await response.json()
    }
    
    return { success: false, message: "Invalid game state" }
  },

  async handleGrab(gameId: string, publicKey: string, userName: string, userAvatar: string) {
    const supabase = createClientComponentClient()
    const { data: gameData }:any = await supabase.from("grabbit").select("status").eq("game_id", gameId).single()

    if (gameData.status === 1 || gameData.status === 2) {
      return { success: false, message: "Game hasn't started yet" }
    } else if (gameData.status === 4) {
      return { success: false, message: "Game is over" }
    } else if (gameData.status === 3) {
      const response = await fetch("/api/grabbit/grab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: gameId,
          userId: publicKey,
          username: userName,
          avatar: userAvatar,
        }),
      })

      return await response.json()
    }

    return { success: false, message: "Invalid game state" }
  },
  
  async handleSneak(gameId: string, publicKey: string) {
    const supabase = createClientComponentClient()
    const { data: gameData }:any = await supabase.from("grabbit").select("status").eq("game_id", gameId).single()

    if (gameData.status === 1 || gameData.status === 2) {
      return { success: false, message: "Game hasn't started yet" }
    } else if (gameData.status === 4) {
      return { success: false, message: "Game is over" }
    } else if (gameData.status === 3) {
      const response = await fetch("/api/grabbit/sneak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: gameId,
          userId: publicKey,
        }),
      })

      return await response.json()
    }

    return { success: false, message: "Invalid game state" }
  },

  async handleConfirmJoin(gameId: string, publicKey: string) {
    const supabase = createClientComponentClient()

    // Check game status and player count
    const { data: gameData, error: gameError } = await supabase
      .from("grabbit")
      .select("*")
      .eq("game_id", gameId)
      .single()

    if (gameError) {
      console.error("Error fetching game:", gameError)
      return { success: false, message: "Error fetching game data" }
    }

    if (gameData.players_ready + 1 >= gameData.players_max) {
      return { success: false, message: "Maximum players reached" }
    }

    if (gameData.status === 3) {
      return { success: false, message: "Game has already started" }
    }

    if (gameData.status === 4) {
      return { success: false, message: "Game is over" }
    }

    // Check if user has enough GAMER tokens
    if (gameData.gamer_to_join > 0) {
      const { data: userData, error: userError } = await supabase
        .from("players")
        .select("*")
        .eq("player", publicKey)
        .single()

      if (userError) {
        console.error("Error fetching user:", userError)
        return { success: false, message: "Error fetching user data" }
      }

      if (userData.gamer < gameData.gamer_to_join) {
        return { success: false, message: "You need more GAMER tokens to join" }
      }
    }

    // Check if user is already in the game
    const { data: playerData, error: playerError } = await supabase
      .from("grabbit_players")
      .select("*")
      .eq("game_id", gameId)
      .eq("player", publicKey)
      .eq("status", 1)
      .maybeSingle()

    if (playerData) {
      return { success: false, message: "You are already in this game" }
    }

    // Join the game
    const response = await fetch("/api/grabbit/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: gameId,
        publicKey: publicKey,
      }),
    })

    return await response.json()
  },
  
  async handleReload(gameId: string, publicKey: string) {
    try {
      const supabase = createClientComponentClient()

      const { data: playerData, error: playerError } = await supabase
      .from("grabbit_players")
      .select("*")
      .eq("game_id", gameId)
      .eq("player", publicKey)
      .eq("status", 1)
      .maybeSingle()

      const { data: gameData, error: gameError } = await supabase
      .from("grabbit")
      .select("*")
      .eq("game_id", gameId)
      .maybeSingle()
      
      const resp = await fetch("/api/grabbit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: gameId,
          publicKey: publicKey,
        }),
      })
      return {playerData, gameData}
    } catch (error) {
      console.error("Error claiming prize:", error)
      return { success: false, message: "An error occurred while claiming the prize" }
    }
  },

  async handleCreateGame(gameData: any) {
    if (!gameData) {
      return { success: false, message: "Invalid game data" }
    }

    const response = await fetch("/api/grabbit/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gData: gameData,
      }),
    })

    return await response.json()
  },

  async handleClaimPrize(gameId: string, publicKey: string) {
    try {
      const response = await fetch("/api/grabbit/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: gameId,
          user: publicKey,
        }),
      })
      
      return await response.json()
    } catch (error) {
      console.error("Error claiming prize:", error)
      return { success: false, message: "An error occurred while claiming the prize" }
    }
  },

  calculateTimeDifference(time: any) {
    try {
      const timeNow = moment.utc()
      const startTime = moment.tz(time, "UTC")
      const differenceInSeconds = startTime.diff(timeNow, "seconds")
      return differenceInSeconds
    } catch (error) {
      console.error("Error calculating time difference:", error)
      return null
    }
  },

  async handleCreatePractice(publicKey: string) {
    const response = await fetch("/api/grabbit/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: publicKey,
      }),
    })

    return await response.json()
  },
}


import { supabase } from "./supabase"
import { balanceManager } from "./balance"
const BALANCE = new balanceManager()

// Types based on the database schema
export interface Player {
  id: string
  name: string
  avatar: string
  player: string
  last_online: string
  email?: string
  x?: string
  tiktok?: string
  youtube?: string
  twitch?: string
  kick?: string
}

export interface EsportsRecord {
  id: string
  player: string
  wins: number
  losses: number
  created_at: string
  updated_at: string
}

export interface Tournament {
  id: string
  tournament_id: number
  title: string
  game: string
  console: string
  entry_fee: number
  prize_percentage: number
  first_place_percentage: number
  second_place_percentage: number
  third_place_percentage: number
  rules: string
  start_date: string
  money: number
  max_players: number
  image_url: string
  status: string
  host_id: string
  winner_take_all: boolean
  type: number
}

export interface TournamentPlayer {
  id: string
  tournament_id: number
  player_id: string
  joined_at: string
  txid: string
}

export interface TournamentMatch {
  id: string
  tournament_id: number
  round: number
  match_order: number
  player1_id: string
  player2_id: string
  winner_id: string
  player1_score: number
  player2_score: number
  match_date: string
}

export interface EsportsGame {
  id: string
  game: string
  console: string
  amount: number
  rules: string
  player1: string
  player2: string
  player1score: number
  player2score: number
  status: number
  game_id: number
  money: number
  player1_name?: string
  player2_name?: string
  player1_avatar?: string
  player2_avatar?: string
  scoredby?: string
  indisupte?: boolean
  referee?: string
}

export interface WalletBalance {
  solana: number
  gamer: number
}

// Player Services
export async function getPlayerProfile(playerAddress: string): Promise<(Player & Partial<WalletBalance>) | null> {
  const { data, error } = await supabase
    .from("players")
    .select(`
      *,
      wallet_players(
        wallet,
        solana,
        gamer
      )
    `)
    .eq("player", playerAddress)
    .maybeSingle()

  if (error) {
    console.error("Error fetching player profile:", error)
    return null
  }

  // Flatten the response structure
  return data ? {
    ...data,
    solana: data.wallet_players?.[0]?.solana || 0,
    gamer: data.wallet_players?.[0]?.gamer || 0
  } : null
}

export async function updatePlayerProfile(playerAddress: string, updates: Partial<Player>): Promise<boolean> {

    const { error } = await supabase
    .from("players")
    .upsert({ 
      player: playerAddress,
      ...updates 
    }, {
      onConflict: 'player' // Specify the column to match on for upsert
    })
  if (error) {
      console.error("Error updating player profile:", error)
      return false
    }else{
        //generate deposit wallet
        const { data:walletData, error:walletError } = await supabase.from("wallet_players").select("*").eq("player", playerAddress).maybeSingle()
        if(!walletData){
            const response = await fetch("/api/generate_address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user: playerAddress,
                  type: 1,
                }),
              })
              const resp = await response.json()
              if(!resp.success){
                  console.error("Error generating wallet:", resp.error)
                  return false
        }
    }
    }
  return true
}

export async function uploadPlayerAvatar(playerAddress: string, file: File): Promise<string | null> {
  const fileName = `${playerAddress}_${Date.now()}_${file.name}` // Unique filename
  const { data, error } = await supabase.storage
    .from("images") // Your bucket name
    .upload(fileName, file)
  
  if (error) {
    console.error("Upload Error:", error)
    return null
  }

  const url = `https://vnilbbgcecpshogcnxxu.supabase.co/storage/v1/object/public/images/${fileName}`

  // Update the player profile with the new avatar URL
  // const success = await updatePlayerProfile(playerAddress, { avatar: url })
  
  // if (!success) {
  //   console.error("Failed to update player profile with new avatar")
  //   return null
  // }

  return url
}

// Esports Records Services
export async function getEsportsRecords(playerAddress: string): Promise<EsportsRecord | null> {
  const { data, error } = await supabase.from("esports_records").select("*").eq("player", playerAddress).maybeSingle()

  if (error) {
    console.error("Error fetching esports records:", error)
    return null
  }

  return data
}

// Tournament Services
export async function getTournaments(status?: string, limit = 10): Promise<Tournament[]> {
  let query = supabase.from("tournaments").select("*").order("start_date", { ascending: true }).limit(limit)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching tournaments:", error)
    return []
  }

  return data || []
}

export async function getTournamentById(tournamentId: number): Promise<Tournament | null> {
  const { data, error } = await supabase.from("tournaments").select("*").eq("tournament_id", tournamentId).maybeSingle()

  if (error) {
    console.error("Error fetching tournament:", error)
    return null
  }

  return data
}

export async function getTournamentPlayers(tournamentId: number): Promise<TournamentPlayer[]> {
  const { data, error } = await supabase.from("tournament_players").select("*").eq("tournament_id", tournamentId)

  if (error) {
    console.error("Error fetching tournament players:", error)
    return []
  }

  return data || []
}

export async function getTournamentMatches(tournamentId: number): Promise<TournamentMatch[]> {
  const { data, error } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: true })
    .order("match_order", { ascending: true })

  if (error) {
    console.error("Error fetching tournament matches:", error)
    return []
  }

  return data || []
}

export async function joinTournament(tournamentId: number, playerAddress: string, txid?: string): Promise<boolean> {
  const { error } = await supabase
    .from("tournament_players")
    .insert([{ tournament_id: tournamentId, player_id: playerAddress, txid }])

  if (error) {
    console.error("Error joining tournament:", error)
    return false
  }

  return true
}

// Esports Game Services
export async function getEsportsGames(status?: number, limit = 10): Promise<EsportsGame[]> {
  let query = supabase.from("esports").select("*").order("created_at", { ascending: false }).limit(limit)

  if (status !== undefined) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching esports games:", error)
    return []
  }

  return data || []
}

export async function getEsportsGameById(gameId: number): Promise<EsportsGame | null> {
  const { data, error } = await supabase.from("esports").select("*").eq("game_id", gameId).maybeSingle()

  if (error) {
    console.error("Error fetching esports game:", error)
    return null
  }

  return data
}

export async function getPlayerEsportsGames(playerAddress: string, limit = 10): Promise<EsportsGame[]> {
  const { data, error } = await supabase
    .from("esports")
    .select("*")
    .or(`player1.eq.${playerAddress},player2.eq.${playerAddress}`)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching player esports games:", error)
    return []
  }

  return data || []
}

export async function createEsportsGame(gameData: Partial<EsportsGame>): Promise<number | null> {
  const { data, error } = await supabase.from("esports").insert([gameData]).select("game_id")

  if (error) {
    console.error("Error creating esports game:", error)
    return null
  }

  return data?.[0]?.game_id || null
}

// Wallet Services
export async function getWalletBalance(playerAddress: string): Promise<WalletBalance | null> {
  const { data, error }:any = await supabase
    .from("wallet_players")
    .select("solana, gamer")
    .eq("player", playerAddress)
    .maybeSingle()
  
  if (error) {
    console.error("Error fetching wallet balance:", error)
    return null
  }
  
  return {
    solana: data.solana || 0,
    gamer: data.gamer || 0,
  }
}

export async function updateWalletBalance(wallet: string, type:number): Promise<WalletBalance | null> {
  
  let result  = await BALANCE.getBalance(wallet, type)
  return result
}

// Chat Services
export interface ChatMessage {
  id: string
  chatroom_id: string
  content: string
  created_at: string
  sender_name: string
  sender: string
  sender_avatar: string
}

export async function getChatMessages(chatroomId: string, limit = 50): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chatroom_id", chatroomId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching chat messages:", error)
    return []
  }

  return data || []
}

export async function sendChatMessage(message: Partial<ChatMessage>): Promise<boolean> {
  const { error } = await supabase.from("chat_messages").insert([message])

  if (error) {
    console.error("Error sending chat message:", error)
    return false
  }

  return true
}

// Add these new interfaces and functions after the existing chat-related code

export interface ChatRoom {
  id: string
  name: string
  created_at: string
}

export async function fetchChatRooms(): Promise<ChatRoom[]> {
  const { data, error } = await supabase.from("chat_rooms").select("*")

  if (error) {
    console.error("Error fetching chat rooms:", error)
    return []
  }

  return data || []
}

export async function createChatRoom(name: string): Promise<ChatRoom | null> {
  const { data, error } = await supabase.from("chat_rooms").insert({ name }).select()

  if (error) {
    console.error("Error creating chat room:", error)
    return null
  }

  return data[0] || null
}

export async function fetchChatMessages(chatRoomId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
  .from("chat_messages")
  .select('*')
  .eq("chatroom_id", chatRoomId)
  .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat messages:", error)
    return []
  }

  return (
    data.map((message) => ({
      ...message,
      sender_avatar: message.players?.avatar,
    })) || []
  )
}

export async function isPlayerBannedFromChat(playerAddress: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("chatroom_ban")
    .select("*")
    .eq("player", playerAddress)
    .eq("status", 1)
    .maybeSingle()
  
  if (error) {
    console.error("Error checking chat ban status:", error)
    return false
  }

  return !!data
}

export async function sendChatMessageToRoom(message: {
  chatroom_id: string
  sender_id: string
  sender_name: string
  sender: string
  sender_avatar: string
  content: string
}): Promise<boolean> {
  // Check for links or malicious code
  const linkRegex = /(https?:\/\/[^\s]+)/g
  const codeRegex = /(<script>|<\/script>|javascript:|on\w+\s*=)/gi

  if (linkRegex.test(message.content) || codeRegex.test(message.content)) {
    return false
  }

  const { error } = await supabase.from("chat_messages").insert(message)

  if (error) {
    console.error("Error sending chat message:", error)
    return false
  }

  return true
}

// Arcade Services
export interface ArcadeGame {
  id: string
  game_id: number
  title: string
  description: string
  play_fee: number
  top_payout: number
  category: string
  rules: string
  game_code: string
  creator: string
  thumbnail_image: string
  full_size_image: string
  status: number
  top_scorer: string
  top_score: number
}

export async function getArcadeGames(limit = 10): Promise<ArcadeGame[]> {
  const { data, error } = await supabase
    .from("arcade")
    .select("*")
    .eq("status", 1) // Assuming 1 is active status
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching arcade games:", error)
    return []
  }

  return data || []
}

export async function getArcadeGameById(gameId: number): Promise<ArcadeGame | null> {
  const { data, error } = await supabase.from("arcade").select("*").eq("game_id", gameId).maybeSingle()

  if (error) {
    console.error("Error fetching arcade game:", error)
    return null
  }

  return data
}

// Leaderboard Services
export interface LeaderboardEntry {
  id: string
  game_id: number
  player: string
  score: number
  position: number
  created_at: string
}

export async function getLeaderboard(gameId: number): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("arcade_leaderboard")
    .select("*")
    .eq("game_id", gameId)
    .order("position", { ascending: true })

  if (error) {
    console.error("Error fetching leaderboard:", error)
    return []
  }

  return data || []
}

// Real-time subscriptions
export function subscribeToChat(chatroomId: string, callback: (message: ChatMessage) => void) {
  return supabase
    .channel(`chat:${chatroomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `chatroom_id=eq.${chatroomId}`,
      },
      (payload) => {
        callback(payload.new as ChatMessage)
      },
    )
    .subscribe()
}

export function subscribeToTournamentUpdates(tournamentId: number, callback: (data: any) => void) {
  return supabase
    .channel(`tournament:${tournamentId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tournament_matches",
        filter: `tournament_id=eq.${tournamentId}`,
      },
      (payload) => {
        callback(payload)
      },
    )
    .subscribe()
}

// Utility function to handle Supabase errors consistently
export function handleSupabaseError(error: any, context: string): void {
  console.error(`Supabase error in ${context}:`, error)

  // You could also implement more sophisticated error handling here,
  // such as sending errors to a monitoring service or displaying user-friendly messages
}

// New functions for shared functionality between desktop and mobile

export async function fetchPendingChallenges(playerAddress: string): Promise<EsportsGame[]> {
  if (!playerAddress) return []

  try {
    // Fetch esports challenges
    const { data: esportsData, error: esportsError } = await supabase
      .from("esports")
      .select("*")
      .or(`player1.eq.${playerAddress},player2.eq.${playerAddress}`)
      .in("status", [1, 2, 3, 4, 5, 6])

    if (esportsError) {
      console.error("Error fetching esports data:", esportsError)
      return []
    }

    // Fetch player names and avatars
    const playerIds = new Set<string>()
    esportsData.forEach((game) => {
      if (game.player1) playerIds.add(game.player1)
      if (game.player2) playerIds.add(game.player2)
    })

    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("player, name, avatar")
      .in("player", Array.from(playerIds))

    if (playersError) {
      console.error("Error fetching players data:", playersError)
    }

    // Create a map for quick lookup
    const playerMap = new Map()
    if (playersData) {
      playersData.forEach((player) => {
        playerMap.set(player.player, { name: player.name, avatar: player.avatar })
      })
    }

    // Enrich the esports data with player names and avatars
    const enrichedData = esportsData.map((game) => {
      const player1Data = playerMap.get(game.player1)
      const player2Data = playerMap.get(game.player2)

      return {
        ...game,
        player1_name: player1Data?.name || "Unknown",
        player1_avatar: player1Data?.avatar || "",
        player2_name: player2Data?.name || "Unknown",
        player2_avatar: player2Data?.avatar || "",
      }
    })

    return enrichedData || []
  } catch (error) {
    console.error("Error in fetchPendingChallenges:", error)
    return []
  }
}

export async function fetchGameHistory(playerAddress: string): Promise<EsportsGame[]> {
  if (!playerAddress) return []

  try {
    const { data, error } = await supabase
      .from("esports")
      .select("*")
      .or(`player1.eq.${playerAddress},player2.eq.${playerAddress}`)
      .eq("status", 9) // Status 9 represents completed games
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching game history:", error)
      return []
    }

    // Fetch player names and avatars
    const playerIds = new Set<string>()
    data.forEach((game) => {
      if (game.player1) playerIds.add(game.player1)
      if (game.player2) playerIds.add(game.player2)
    })

    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("player, name, avatar")
      .in("player", Array.from(playerIds))

    if (playersError) {
      console.error("Error fetching players data:", error)
    }

    // Create a map for quick lookup
    const playerMap = new Map()
    if (playersData) {
      playersData.forEach((player) => {
        playerMap.set(player.player, { name: player.name, avatar: player.avatar })
      })
    }

    // Enrich the esports data with player names and avatars
    const enrichedData = data.map((game) => {
      const player1Data = playerMap.get(game.player1)
      const player2Data = playerMap.get(game.player2)

      return {
        ...game,
        player1_name: player1Data?.name || "Unknown",
        player1_avatar: player1Data?.avatar || "",
        player2_name: player2Data?.name || "Unknown",
        player2_avatar: player2Data?.avatar || "",
      }
    })

    return enrichedData || []
  } catch (error) {
    console.error("Error in fetchGameHistory:", error)
    return []
  }
}

export async function handleSendChallenge(
  challengeData: Partial<EsportsGame>,
  playerAddress: string,
  playerName: string,
  playerAvatar: string,
  balance: WalletBalance | null,
): Promise<{ success: boolean; message: string }> {
  if (
    !challengeData.player2 ||
    !challengeData.game ||
    !challengeData.console ||
    (!challengeData.amount && challengeData.amount !== 0) ||
    !challengeData.rules ||
    !challengeData.money
  ) {
    let message = ""
    if (!challengeData.player2) {
      message = "select an opponent by click on the opponent name from the drop down list"
    } else if (!challengeData.game) {
      message = "select a game"
    } else if (!challengeData.console) {
      message = "select a console"
    } else if (!challengeData.money) {
      message = "select whether you're playing for Solana or Gamer tokens"
    } else if (!challengeData.amount && challengeData.amount !== 0) {
      message = "enter an amount"
    } else if (!challengeData.rules) {
      message = "enter the rules for this game"
    }

    return { success: false, message }
  }

  if (!playerAddress) return { success: false, message: "log in to send challenge" }

  try {
    // Get sum of all active games
    const { data, error } = await supabase
      .from("esports")
      .select("amount")
      .eq("player1", playerAddress)
      .in("status", [1, 2, 3, 4, 5, 6])

    if (error) {
      console.error("Error fetching active games:", error)
      return { success: false, message: "Error checking active games" }
    }

    const activeAmount = data.reduce((sum: number, row: any) => sum + (row.amount || 0), 0)

    // Check user balance
    let userBalance = 0
    if (challengeData.money === 1) {
      // Solana
      userBalance = balance?.solana || 0
    } else {
      // Gamer tokens
      userBalance = balance?.gamer || 0
    }

    const gameAmount = ((challengeData.amount as number) / 10 ** 9) * 1.03
    const feeAmount = ((challengeData.amount as number) / 10 ** 9) * 0.03
    const totalAmount = activeAmount + gameAmount

    if (userBalance / 10 ** 9 >= totalAmount) {
      const { error } = await supabase.from("esports").insert({
        ...challengeData,
        player1: playerAddress,
        player1_name: playerName,
        player1_avatar: playerAvatar,
        fee: feeAmount,
        status: 1, // Initial status for a new challenge
      })

      if (error) {
        console.error("Error sending challenge:", error)
        return { success: false, message: "An error occurred while sending the challenge." }
      } else {
        return { success: true, message: "Your challenge has been sent successfully." }
      }
    } else {
      return {
        success: false,
        message:
          "You need to deposit more funds to send this challenge. Your current balance is not enough to cover this and pending challenges.",
      }
    }
  } catch (error) {
    console.error("Error in handleSendChallenge:", error)
    return { success: false, message: "An unexpected error occurred." }
  }
}

export async function handleCancelChallenge(
game_id: any,

): Promise<{ success: boolean; message: string }> {
  
  let success = true;
  let message = "game canceled";
  
  const { data, error: fetchError }:any = await supabase
  .from("esports")
  .select("status")
  .eq("game_id", game_id)
  .single()
  
  if (data.status == 1) {
    const { error: updateError } = await supabase
      .from("esports")
      .update({ status: 0 })
      .eq("game_id", game_id)
      if (updateError) {
        success = false
        message = "Error canceling game"
      console.log(updateError)
      } 
  }else{
    success = false
    message = "Game already accepted"
  }
  return {
    success: success,
    message: message
  }
}

export async function handleAcceptChallenge(
  game_id: any,
  player: any,
  amount: any,
  money: any,
  
  ): Promise<{ success: boolean; message: string }> {
    
    let success = true;
    let message = "challenge accepted";
    
    const { data, error }:any = await supabase
    .from('esports') // Specify the table name
    .select('amount') // Select the `amount` column
    .or(`player1.eq.${player},player2.eq.${player}`) // Filter by `player1` OR `player2`
    .in("status", [1, 2, 3, 4, 5, 6]); // Filter by `status`
    
    let activeAmount = data.reduce((sum:any, row:any) => sum + (row.amount || 0), 0);
    let balance = 0
    let gameAmount = amount / 10 ** 9
    
    let playerData:any = await getPlayerProfile(player)
    console.log(playerData)
    if(money==1){
      balance = playerData.wallet_players[0].solana
      let fee = gameAmount * 0.03
      gameAmount = gameAmount + fee
      }else{
      balance = balance = playerData.wallet_players[0].gamer
      }
      balance = balance / 10 ** 9
      let totalAmount = activeAmount + gameAmount
      if (balance >= totalAmount) {
        const { error } = await supabase.from("esports").update({ status: 2 }).eq("game_id", game_id)
        if (error) {
          success = false
          message = "Error accepting game"
        }
      }

    return {
      success: success,
      message: message
    }
  }

  export async function handleRejectChallenge(
    game_id: any
        
    ): Promise<{ success: boolean; message: string }> {
      
      let success = true;
      let message = "challenge rejected";
      
      const { error } = await supabase.from("esports").update({ status: 0 }).eq("game_id", game_id)
      if (error) {
        success = false
        message = "Error rejecting game"
      }
  
      return {
        success: success,
        message: message
      }
    }

  export async function handleReportScore(
    game_id: any,
    player:any,
    player1score:any,
    player2score:any
    
    ): Promise<{ success: boolean; message: string }> {
      
      let success = true;
      let message = "score reported";
      
      const { error } = await supabase
        .from("esports")
        .update({
          status: 3,
          player1score: player1score,
          player2score: player2score,
          scoredby: player,
        })
        .eq("game_id", game_id)
      if (error) {
        success = false
        message = "Error reporting score"
      }
      return {
        success: success,
        message: message
      }
    }

    export async function handleConfirmScore(
      game_id: any,
      
      ): Promise<{ success: boolean; message: string }> {
        
        let success = true;
        let message = "score confirmed";
        
        const { data, error: fetchError } = await supabase
        .from("esports")
        .select("*")
        .eq("game_id", game_id)
        .single()
      
        const player1score = data.player1score
        const player2score = data.player2score
        const player1 = data.player1
        const player2 = data.player2
        const amount = data.amount
        const fee = data.fee

        if(amount>0){
          const response:any = await fetch("/api/esports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              player1: player1,
              player2: player2,
              player1score: player1score,
              player2score: player2score,
              amount: amount,
              fee: fee,
            }),
          })
          if(!response.success){  
            success = false
            message = "Error confirming score" 
          }
        }
        const { error } = await supabase
        .from("esports")
        .update({
          status: 9,
          score_confirmed_at: new Date().toISOString(),
        })
        .eq("game_id", game_id)
        if (error) {
          success = false
          message = "Error confirming score"
        }
        return {
          success: success,
          message: message
        }
      }
      export async function handleDisputeScore(
        game_id: any,
        
        ): Promise<{ success: boolean; message: string }> {
          
          let success = true;
          let message = "score disputed";
          
          const { error } = await supabase
          .from("esports")
          .update({
            status: 5,
            disputed_at: new Date().toISOString(),
          })
          .eq("game_id", game_id)
          
          if (error) {
            success = false
            message = "Error disputing score"
          }
          return {
            success: success,
            message: message
          }
        }
        export async function handleMutualCancel(
          game_id: any,
          player:any
          
          ): Promise<{ success: boolean; message: string }> {
            
            let success = true;
            let message = "game canceled";
            
            const { data, error: fetchError }:any = await supabase
            .from("esports")
            .select("status")
            .eq("game_id", game_id)
            .single()
            if(fetchError){
              success = false
              message = "Error fetching game status"
            }
            if (data.status == 6) {
              ///mutual cancel already requested
              const { error } = await supabase
                .from("esports")
                .update({
                  status: 7,
                })
                .eq("game_id", game_id)
                if (error) {
                  success = false
                  message = "Error canceling game"
                }
              } else if (data.status == 2 || data.status == 3 || data.status == 5) {
              
                const { error } = await supabase
                .from("esports")
                .update({
                  status: 6,
                  cancelled_at: new Date().toISOString(),
                  cancelled_by: player,
                })
                .eq("game_id", game_id)
                if (error) {
                  success = false
                  message = "Error canceling game"
                }
              }
            
            return {
              success: success,
              message: message
            }
          }

export async function handleSelect(
  username: string,
  playerAddress: string,
  playerName: string,
  playerAvatar: string,
): Promise<{
  success: boolean
  data?: {
    player2: string
    player2_name: string
    player2_avatar: string
  }
}> {
  try {
    const { data, error } = await supabase.from("players").select("player, avatar, name").eq("name", username).maybeSingle()

    if (error) {
      console.error("Error fetching opponent data:", error)
      return { success: false }
    }

    return {
      success: true,
      data: {
        player2: data.player,
        player2_name: data.name,
        player2_avatar: data.avatar || "",
      },
    }
  } catch (error) {
    console.error("Error in handleSelect:", error)
    return { success: false }
  }
}

// Utility function to handle Supabase errors consistently
// export function handleSupabaseError(error: any, context: string): void {
//   console.error(`Supabase error in ${context}:`, error)

// You could also implement more sophisticated error handling here,
// such as sending errors to a monitoring service or displaying user-friendly messages
// }


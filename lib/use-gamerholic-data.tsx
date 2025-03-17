"use client"

import { useState, useEffect, useCallback } from "react"
import * as services from "@/lib/services"

// Player profile hook
export function usePlayerProfile(playerAddress: string | null) {
  const [profile, setProfile] = useState<services.Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!playerAddress) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await services.getPlayerProfile(playerAddress)
      setProfile(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [playerAddress])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = useCallback(
    async (updates: Partial<services.Player>) => {
      if (!playerAddress) return false

      try {
        const success = await services.updatePlayerProfile(playerAddress, updates)
        if (success) {
          // Refresh the profile data
          fetchProfile()
        }
        return success
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
        return false
      }
    },
    [playerAddress, fetchProfile],
  )

  return { profile, loading, error, updateProfile, refetch: fetchProfile }
}

// Esports records hook
export function useEsportsRecords(playerAddress: string | null) {
  const [records, setRecords] = useState<services.EsportsRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchRecords = useCallback(async () => {
    if (!playerAddress) {
      setRecords(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await services.getEsportsRecords(playerAddress)
      setRecords(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [playerAddress])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return { records, loading, error, refetch: fetchRecords }
}

// Tournaments hook
export function useTournaments(status?: string, limit = 10) {
  const [tournaments, setTournaments] = useState<services.Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await services.getTournaments(status, limit)
      setTournaments(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [status, limit])

  useEffect(() => {
    fetchTournaments()
  }, [fetchTournaments])

  return { tournaments, loading, error, refetch: fetchTournaments }
}

// Tournament details hook
export function useTournamentDetails(tournamentId: number | null) {
  const [tournament, setTournament] = useState<services.Tournament | null>(null)
  const [players, setPlayers] = useState<services.TournamentPlayer[]>([])
  const [matches, setMatches] = useState<services.TournamentMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTournamentDetails = useCallback(async () => {
    if (!tournamentId) {
      setTournament(null)
      setPlayers([])
      setMatches([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [tournamentData, playersData, matchesData] = await Promise.all([
        services.getTournamentById(tournamentId),
        services.getTournamentPlayers(tournamentId),
        services.getTournamentMatches(tournamentId),
      ])

      setTournament(tournamentData)
      setPlayers(playersData || [])
      setMatches(matchesData || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    fetchTournamentDetails()
  }, [fetchTournamentDetails])

  const joinTournament = useCallback(
    async (playerAddress: string, txid?: string) => {
      if (!tournamentId) return false

      try {
        const success = await services.joinTournament(tournamentId, playerAddress, txid)
        if (success) {
          // Refresh the tournament data
          fetchTournamentDetails()
        }
        return success
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
        return false
      }
    },
    [tournamentId, fetchTournamentDetails],
  )

  return {
    tournament,
    players,
    matches,
    loading,
    error,
    joinTournament,
    refetch: fetchTournamentDetails,
  }
}

// Esports games hook
export function useEsportsGames(status?: number, limit = 10) {
  const [games, setGames] = useState<services.EsportsGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true)
      const data = await services.getEsportsGames(status, limit)
      setGames(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [status, limit])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  return { games, loading, error, refetch: fetchGames }
}

// Player esports games hook
export function usePlayerEsportsGames(playerAddress: string | null, limit = 10) {
  const [games, setGames] = useState<services.EsportsGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchGames = useCallback(async () => {
    if (!playerAddress) {
      setGames([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await services.getPlayerEsportsGames(playerAddress, limit)
      setGames(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [playerAddress, limit])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  return { games, loading, error, refetch: fetchGames }
}

// Wallet balance hook
export function useWalletBalance(playerAddress: string | null) {
  const [balance, setBalance] = useState<services.WalletBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!playerAddress) {
      setBalance(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await services.getWalletBalance(playerAddress)
      setBalance(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [playerAddress])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return { balance, loading, error, refetch: fetchBalance }
}

// Chat messages hook
export function useChatMessages(chatroomId: string | null, limit = 50) {
  const [messages, setMessages] = useState<services.ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!chatroomId) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await services.getChatMessages(chatroomId, limit)
      setMessages(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [chatroomId, limit])

  useEffect(() => {
    fetchMessages()

    // Set up real-time subscription if chatroomId exists
    if (chatroomId) {
      const subscription = services.subscribeToChat(chatroomId, (newMessage) => {
        setMessages((prev) => [newMessage, ...prev])
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [chatroomId, fetchMessages, limit])

  const sendMessage = useCallback(
    async (message: Partial<services.ChatMessage>) => {
      if (!chatroomId) return false

      try {
        return await services.sendChatMessage({
          ...message,
          chatroom_id: chatroomId,
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
        return false
      }
    },
    [chatroomId],
  )

  return { messages, loading, error, sendMessage, refetch: fetchMessages }
}

// Arcade games hook
export function useArcadeGames(limit = 10) {
  const [games, setGames] = useState<services.ArcadeGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true)
      const data = await services.getArcadeGames(limit)
      setGames(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  return { games, loading, error, refetch: fetchGames }
}

// Leaderboard hook
export function useLeaderboard(gameId: number | null) {
  const [leaderboard, setLeaderboard] = useState<services.LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    if (!gameId) {
      setLeaderboard([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await services.getLeaderboard(gameId)
      setLeaderboard(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return { leaderboard, loading, error, refetch: fetchLeaderboard }
}


'use client'

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { supabase } from '@/lib/supabase'

// Normalize hex-like addresses before storing/reading from DB
const toLower = (v?: string) => (typeof v === 'string' ? v.toLowerCase() : v)

// Minimal esports gamer profile type
export interface GamerProfile {
  wallet: string // 0x Sei address (primary identifier)
  username: string
  avatarUrl?: string
  coverUrl?: string
  xft?: number
  bio?: string
  team?: string
  teamId?: string
  role?: string // e.g., IGL, Support, Entry, Jungler, etc.
  region?: string // e.g., NA, EU, LATAM
  games: Array<{
    game_id?: string
    title: string // e.g., Valorant, League of Legends, CS2, Dota 2
    console?: string // e.g., PC, PS5, Xbox, Switch
    rank?: string // e.g., Radiant, Immortal, Challenger
    mmr?: number
    main?: string // e.g., agent/champion/role
    win_loss_record?: { wins: number; losses: number }
    win_streak?: number,
    loss_streak?: number
  }>
  tournaments?: any[]
  socials?: {
    twitter?: string
    discord?: string
    twitch?: string
    youtube?: string
  }
  streaming?: boolean
  achievements?: string[]
}

interface GamerProfileContextType {
  // Login/connection state via Dynamic
  isConnected: boolean
  address?: string
  seiAddress?: string

  // Profile data (local state only)
  profile: GamerProfile
  updateProfile: (updates: Partial<GamerProfile>) => void

  // Export utility
  exportProfile: (format?: 'json' | 'csv') => string
}

const GamerProfileContext = createContext<GamerProfileContextType | undefined>(undefined)

export const GamerProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { primaryWallet } = useDynamicContext()

  const address = toLower(primaryWallet?.address)
  const isConnected = !!primaryWallet

  // Optional Sei address from Dynamic (Cosmos)
  const seiAddress = primaryWallet?.additionalAddresses?.find((addr) => addr.type === 'cosmos')?.address

  // Default profile seeded from wallet info (no external persistence)
  const defaultUsername = useMemo(() => {
    if (!address) return 'gamer'
    return `gamer_${address.slice(2, 8)}`
  }, [address])

  const [profile, setProfile] = useState<GamerProfile>({
    wallet: address || '',
    username: defaultUsername,
    coverUrl: undefined,
    bio: '',
    team: '',
    teamId: undefined,
    role: '',
    region: '',
    games: [],
    tournaments: [],
    socials: {},
    streaming: false,
    achievements: [],
  })

  // Sync with Supabase gamers table on connect: fetch or insert default
  useEffect(() => {
    const syncGamer = async () => {
      if (!isConnected || !address) return
      try {
        const { data: existing, error } = await supabase
          .from('gamers')
          .select('*')
          .eq('wallet', address)
          .maybeSingle()

        if (error) {
          console.warn('Failed to query gamer profile:', error.message)
        }

        let row = existing
        if (!row) {
          const defaults = {
            wallet: address,
            username: defaultUsername,
          avatar_url: null,
          cover_url: null,
          xft: 0,
          bio: '',
          team: '',
          team_id: null,
          role: '',
          region: '',
          games: [] as any,
          tournaments: [] as any,
          socials: {} as any,
          streaming: false,
          achievements: [] as any,
          }
          const { data: inserted, error: insertError } = await supabase
            .from('gamers')
            .insert(defaults)
            .select()
            .single()

          if (insertError) {
            console.error('Failed to insert gamer profile:', insertError.message)
            return
          }
          row = inserted
        }

        const synced: GamerProfile = {
          wallet: toLower(row.wallet ?? address) || '',
          username: row.username ?? defaultUsername,
          avatarUrl: row.avatar_url ?? undefined,
          coverUrl: row.cover_url ?? undefined,
          xft: row.xft ?? undefined,
          bio: row.bio ?? '',
          team: row.team ?? '',
          teamId: row.team_id ?? undefined,
          role: row.role ?? '',
          region: row.region ?? '',
          games: Array.isArray(row.games) ? row.games : [],
          tournaments: Array.isArray(row.tournaments) ? row.tournaments : [],
          socials: row.socials ?? {},
          streaming: row.streaming ?? false,
          achievements: Array.isArray(row.achievements) ? row.achievements : [],
        }
        setProfile(synced)
      } catch (e: any) {
        console.error('Unexpected error syncing gamer profile:', e?.message || e)
      }
    }

    void syncGamer()
  }, [isConnected, address, defaultUsername])

  const updateProfile = (updates: Partial<GamerProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }

  const exportProfile = (format: 'json' | 'csv' = 'json'): string => {
    const payload = {
      isConnected,
      address,
      seiAddress,
      profile,
    }

    if (format === 'json') {
      return JSON.stringify(payload, null, 2)
    }

    // CSV export: core profile fields + game rows
    const header = 'isConnected,address,seiAddress,username,team,role,region,streaming\n'
    const meta = `${isConnected},${address || ''},${seiAddress || ''},${profile.username || ''},${profile.team || ''},${profile.role || ''},${profile.region || ''},${profile.streaming ? 'true' : 'false'}`
    const gameHeader = '\n\ngame_title,rank,mmr,main\n'
    const gameRows = (profile.games || [])
      .map((g) => [g.title, g.rank || '', g.mmr ?? '', g.main || ''].join(','))
      .join('\n')
    return header + meta + gameHeader + gameRows
  }

  const value: GamerProfileContextType = {
    isConnected,
    address,
    seiAddress,
    profile,
    updateProfile,
    exportProfile,
  }

  return <GamerProfileContext.Provider value={value}>{children}</GamerProfileContext.Provider>
}

export const useGamerProfile = () => {
  const ctx = useContext(GamerProfileContext)
  if (ctx === undefined) {
    throw new Error('useGamerProfile must be used within a GamerProfileProvider')
  }
  return ctx
}
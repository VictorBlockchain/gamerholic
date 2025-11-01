'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { readIsMod, readIsAdmin } from '@/lib/contracts/tournamentFactory'

type UserContextType = {
  address?: `0x${string}`
  isConnected: boolean
  isMod: boolean
  isAdmin: boolean
  loading: boolean
  refreshIsMod: () => Promise<void>
  refreshIsAdmin: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { primaryWallet } = useDynamicContext()
  const isConnected = !!primaryWallet
  const address = (primaryWallet?.address || '') as `0x${string}` | ''

  const [isMod, setIsMod] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

  const refreshIsMod = async () => {
    try {
      if (!address || address.length !== 42) {
        setIsMod(false)
        return
      }
      setLoading(true)
      const flag = await readIsMod(address as `0x${string}`)
      setIsMod(Boolean(flag))
    } catch (e) {
      console.warn('Failed to read isMod from TournamentFactory:', e)
      setIsMod(false)
    } finally {
      setLoading(false)
    }
  }

  const refreshIsAdmin = async () => {
    try {
      if (!address || address.length !== 42) {
        setIsAdmin(false)
        return
      }
      setLoading(true)
      const flag = await readIsAdmin(address as `0x${string}`)
      setIsAdmin(Boolean(flag))
    } catch (e) {
      console.warn('Failed to read isAdmin from TournamentFactory:', e)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch role flags whenever the connected wallet changes
    refreshIsMod()
    refreshIsAdmin()
  }, [address])

  const value = useMemo(
    () => ({ address: address || undefined, isConnected, isMod, isAdmin, loading, refreshIsMod, refreshIsAdmin }),
    [address, isConnected, isMod, isAdmin, loading],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
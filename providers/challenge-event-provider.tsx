'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useChallengeEvents } from '@/lib/hooks/use-challenge-events'
import { DatabaseService } from '@/lib/services/database-service'
import { toast } from 'sonner'

interface ChallengeEventContextType {
  isListening: boolean
  error: string | null
}

const ChallengeEventContext = createContext<ChallengeEventContextType>({
  isListening: false,
  error: null,
})

export function useChallengeEventContext() {
  const context = useContext(ChallengeEventContext)
  if (!context) {
    throw new Error('useChallengeEventContext must be used within a ChallengeEventProvider')
  }
  return context
}

interface ChallengeEventProviderProps {
  children: React.ReactNode
}

export function ChallengeEventProvider({ children }: ChallengeEventProviderProps) {
  const { challengeCreated, challengeJoined, challengeCompleted, isListening, error } =
    useChallengeEvents()
  const databaseService = new DatabaseService()

  // Handle challenge created events
  useEffect(() => {
    if (challengeCreated) {
      console.log('Challenge created event received:', challengeCreated)

      // Sync with database
      databaseService
        .syncChallengeCreated(challengeCreated)
        .then(() => {
          toast.success(`Challenge ${challengeCreated.challengeId} created and synced to database`)
        })
        .catch((error) => {
          console.error('Failed to sync challenge created event:', error)
          toast.error('Failed to sync challenge to database')
        })
    }
  }, [challengeCreated])

  // Handle challenge joined events
  useEffect(() => {
    if (challengeJoined) {
      console.log('Challenge joined event received:', challengeJoined)

      // Sync with database
      databaseService
        .syncChallengeJoined(challengeJoined)
        .then(() => {
          toast.success(`Player joined challenge ${challengeJoined.challengeId}`)
        })
        .catch((error) => {
          console.error('Failed to sync challenge joined event:', error)
          toast.error('Failed to sync challenge join to database')
        })
    }
  }, [challengeJoined])

  // Handle challenge completed events
  useEffect(() => {
    if (challengeCompleted) {
      console.log('Challenge completed event received:', challengeCompleted)

      // Sync with database
      databaseService
        .syncChallengeCompleted(challengeCompleted)
        .then(() => {
          toast.success(
            `Challenge ${challengeCompleted.challengeId} completed! Winner: ${challengeCompleted.winner}`
          )
        })
        .catch((error) => {
          console.error('Failed to sync challenge completed event:', error)
          toast.error('Failed to sync challenge completion to database')
        })
    }
  }, [challengeCompleted])

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Challenge event listener error:', error)
      toast.error(`Event listener error: ${error}`)
    }
  }, [error])

  const contextValue: ChallengeEventContextType = {
    isListening,
    error,
  }

  return (
    <ChallengeEventContext.Provider value={contextValue}>{children}</ChallengeEventContext.Provider>
  )
}
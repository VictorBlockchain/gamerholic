"use client"

import { createContext, useContext, type ReactNode, useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { usePlayerProfile, useWalletBalance, useEsportsRecords } from "@/hooks/use-gamerholic-data"
import { getPlayerProfile, getWalletBalance } from "@/lib/services"
import { supabase } from "@/lib/supabase"
import { Session } from '@supabase/supabase-js'

interface UserContextType {
  isAuthenticated: boolean
  player: string | null
  profile: any | null
  balance: any | null
  esportsRecords: any | null
  loading: boolean
  error: Error | null
  isLoading: boolean

}

const UserContext = createContext<UserContextType>({
  isAuthenticated: false,
  player: null,
  profile: null,
  balance: null,
  esportsRecords: null,
  loading: false,
  error: null,
  isLoading: true,

})

export function UserProvider({ children }: { children: ReactNode }) {
  const { connected, publicKey, signMessage }:any = useWallet();
  const player = publicKey ? publicKey.toString() : null

  const [profile, setProfile] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [esportsRecords, setEsportsRecords] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      if (player) {
        setLoading(true)
        try {
          
          // const { data: { session }, error } = await supabase.auth.getSession();
          // if(!session){
            
          //   const resp = await fetch("/api/nonce"); // Replace with your API endpoint
          //   let data = await resp.json();  
          //   let nonce = data.message       
          //   const message = new TextEncoder().encode(data.message);
          //   const signature = await signMessage(message);
          //   const response = await fetch("/api/players/auth", {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //     body: JSON.stringify({
          //       publicKey: player,
          //       signature: Array.from(signature), // Convert Uint8Array to array
          //       nonce,
          //     }),
          //   });
          //   data = await response.json();
            
          //   if (data.success) {
          //     console.log(data.token)
          //     // Set the Supabase session with the received token
          //     await supabase.auth.setSession({
          //       access_token: data.token,
          //       refresh_token: data.refresh_token // if you're providing a refresh token
          //     })
          //     // Get the updated session
          //     const { data: { session: newSession } } = await supabase.auth.getSession()
          //     setSession(newSession)
          //   } else {
          //     console.log(data.message)
          //   }
    
          // }else{
          //   const currentTime = Math.floor(Date.now() / 1000);
          //   const expiresAt:any = session.expires_at;
          //   if (expiresAt - currentTime < 300) {
          //     console.log("Session is about to expire. Refreshing...");
          //     const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          //     if (refreshError) {
          //       console.error('Error refreshing session:', refreshError);
          //     } else {
          //       setSession(refreshedSession);
          //     }
          //   }
          //   console.log(session)
          
          // }

          const profileData = await getPlayerProfile(player)
          const balanceData = await getWalletBalance(player)
          const recordsData = await useEsportsRecords(player)
          console.log(profileData)
          setProfile(profileData)
          setBalance(balanceData)
          setEsportsRecords(recordsData)
        } catch (err: any) {
          console.log(err)
          setError(err)
        } finally {
          setLoading(false)
        }
        setIsLoading(false);

      } else {
        setProfile(null)
        setBalance(null)
        setEsportsRecords(null)
      }
    }

    fetchData()
  }, [player])

  const value = {
    isAuthenticated: connected && !!player,
    player,
    profile,
    balance,
    esportsRecords,
    loading,
    error,
    isLoading,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext)
}

, createContext, useContext, useEffect, useState, type ReactNodeuseWallet, , useEsportsRecordsgetPlayerProfile, getWalletBalance, Session, 
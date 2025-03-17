"use client";

import { createContext, useContext, type ReactNode, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePlayerProfile, useWalletBalance, useEsportsRecords } from "@/hooks/use-gamerholic-data";
import { getPlayerProfile, getWalletBalance } from "@/lib/services";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

interface UserContextType {
  isAuthenticated: boolean;
  player: string | null;
  profile: any | null;
  balance: any | null;
  esportsRecords: any | null;
  loading: boolean;
  error: Error | null;
  isLoading: boolean;
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
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { connected, publicKey, signMessage }: any = useWallet();
  const player = publicKey ? publicKey.toString() : null;

  // Call hooks at the top level
  const { records: esportsRecords, loading: esportsLoading, error: esportsError } = useEsportsRecords(player);

  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // console.log("Fetching data for player:", player); // Debugging
      setIsLoading(true);

      if (player) {
        setLoading(true);
        try {
          const profileData = await getPlayerProfile(player);
          // console.log("Profile data:", profileData); // Debugging
          const balanceData = await getWalletBalance(player);
          // console.log("Balance data:", balanceData); // Debugging
          setProfile(profileData);
          setBalance(balanceData);
        } catch (err: any) {
          // console.error("Error fetching data:", err); // Debugging
          setError(err);
        } finally {
          setLoading(false);
        }
        setIsLoading(false);
      } else {
        // console.log("Player is null. Resetting profile and balance."); // Debugging
        setProfile(null);
        setBalance(null);
      }
    };

    fetchData();
  }, [player]);

  const value = {
    isAuthenticated: connected && !!player,
    player,
    profile,
    balance,
    esportsRecords,
    loading,
    error: error || esportsError,
    isLoading: isLoading || esportsLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
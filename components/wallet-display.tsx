"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { supabase } from "@/lib/supabase"
import { balanceManager } from "@/lib/balance";
const BALANCE = new balanceManager();
const GAMER = process.env.NEXT_PUBLIC_GAMER;

export function WalletDisplay() {
  const { publicKey } = useWallet();
  const [balanceSol, setSolBalance] = useState(0);
  const [balanceGamer, setGamerBalance] = useState(0);
  const [showSol, setShowSol] = useState(true); // Track whether to show SOL or GAMER balance

  useEffect(() => {
    if (publicKey) {
      fetchBalances();
    }
  }, [publicKey]);

  const fetchBalances = async () => {
    try {
      const { data:user, error:userError } = await supabase.from("users").select("*").eq("publicKey", publicKey).single()
      
      // Fetch SOL balance
      let solBalance = await BALANCE.getBalance(user.deposit_wallet);
      if (solBalance > 0) {
        setSolBalance(solBalance / 1_000_000_000);
      }

      // Fetch GAMER token balance
      let gamerBalance = await BALANCE.getTokenBalance(user.deposit_wallet, GAMER);
      if (gamerBalance > 0) {
        setGamerBalance(gamerBalance / 1_000_000_000);
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const toggleBalance = () => {
    fetchBalances()
    setShowSol((prev) => !prev); // Toggle between showing SOL and GAMER balance
  };

  return (
    <Button
      variant="outline"
      className="bg-background/50 backdrop-blur-sm"
      onClick={toggleBalance} // Toggle balance display on click
    >
      <Wallet className="mr-2 h-4 w-4" />
      {showSol ? `${balanceSol.toFixed(6)} SOL` : `${balanceGamer.toFixed(6)} GAMER`}
    </Button>
  );
}
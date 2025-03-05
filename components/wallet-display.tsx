"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { supabase } from "@/lib/supabase"
import { balanceManager } from "@/lib/balances";
import moment from 'moment';

const BALANCE = new balanceManager();
const GAMER = process.env.NEXT_PUBLIC_GAMERHOLIC;

export function WalletDisplay() {
  const { publicKey } = useWallet();
  const [balanceSol, setSolBalance]:any = useState(0);
  const [balanceGamer, setGamerBalance]:any = useState(0);
  const [showSol, setShowSol] = useState(true); // Track whether to show SOL or GAMER balance
  
  // console.log(GAMER)
  useEffect(() => {
    if (publicKey) {
      fetchBalances();
    }
  }, [publicKey]);

  const fetchBalances = async () => {
    try {
      const { data:user, error:userError } = await supabase.from("users").select("*").eq("publicKey", publicKey).single()
      let next_update = user.next_balance_update;
      let now = moment();
      let nextBalanceUpdate = now.add(1, 'minute').toISOString();
      
      if (!next_update || now.isAfter(next_update)) {

        let balances = await BALANCE.getBalance(user.deposit_wallet);
        // console.log(balances)
        const { data, error } = await supabase
        .from('users')
        .update({ next_balance_update: nextBalanceUpdate, solana: balances.solana, gamer: balances.gamer })
        .eq('publicKey', publicKey);
        
        setSolBalance(balances.solana / 1_000_000_000);
        setGamerBalance(balances.gamer / 10 ** 6 );
      
      }else{
        setSolBalance(user.solana / 1_000_000_000);
        setGamerBalance(user.gamer / 10 ** 6 );
      
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
      {
        showSol 
          ? `${parseFloat(balanceSol).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })} SOL` 
          : `${parseFloat(balanceGamer).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })} GAMER`
      }
    </Button>
  );
}
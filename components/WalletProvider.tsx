"use client"

import { useMemo } from "react"
import type React from "react"
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { clusterApiUrl } from "@solana/web3.js"
import dynamic from "next/dynamic"

// Import the styles here
import "@solana/wallet-adapter-react-ui/styles.css"

// Use dynamic import for WalletModalProvider
const WalletModalProvider = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletModalProvider),
  { ssr: false },
)

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  // Allow switching between devnet and mainnet
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork)
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
      ? "https://solana-mainnet.g.alchemy.com/v2/RYhH9z86g3X4KwWuCnYxBVbqxP1Jk6e0"
      : clusterApiUrl(process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork),
    [network]
  );
  
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })], [network])
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}


"use client"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

export function AuthButton() {
  const { connected } = useWallet()

  if (connected) {
    return (
      <WalletMultiButton className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" />
    )
  }

  return (
    <WalletMultiButton className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
      Connect Wallet
    </WalletMultiButton>
  )
}


"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ConnectWalletButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AuthButton({ className, variant = "default", size = "default" }: ConnectWalletButtonProps) {
  const { connected, publicKey, signMessage } = useWallet();
  const [nonce, setNonce] = useState<string | null>(null);
  console.log("in auth button")
  // Fetch a nonce from your backend when the wallet is connected
  useEffect(() => {
    const fetchNonce = async () => {
      try {
        const response = await fetch("/api/nonce"); // Replace with your API endpoint
        const data = await response.json();
        setNonce(data.nonce);
      } catch (error) {
        console.error("Failed to fetch nonce:", error);
      }
    };

    if (connected) {
      fetchNonce();
    }
  }, [connected]);

  // Automatically sign the message and authenticate when the wallet is connected
  useEffect(() => {
    const handleSignMessage = async () => {
      if (!publicKey || !signMessage || !nonce) {
        console.error("Wallet not connected or nonce not available");
        return;
      }

      try {
        // Sign the nonce
        const message = new TextEncoder().encode(nonce);
        const signature = await signMessage(message);

        // Send the publicKey, signature, and nonce to the backend for verification
        const response = await fetch("/api/player/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicKey: publicKey.toBase58(),
            signature: Array.from(signature), // Convert Uint8Array to array
            nonce,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Authentication successful:", data);
          // Optionally, you can redirect the user or update the UI
        } else {
          console.error("Authentication failed:", await response.json());
        }
      } catch (error) {
        console.error("Error signing message:", error);
      }
    };

    if (connected && nonce) {
      handleSignMessage();
    }
  }, [connected, nonce, publicKey, signMessage]);

  return (
    <WalletMultiButton
      className={cn(
        "rounded-full px-6",
        connected ? "bg-[#00FFA9] hover:bg-[#00D48F] text-black" : "bg-white hover:bg-gray-100 text-black",
        className
      )}
    >
      Connect Wallet
    </WalletMultiButton>
  );
}
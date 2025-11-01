'use client'

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config as wagmiConfig } from '@/lib/wagmi-config'
import { dynamicConfig } from '@/lib/dynamic-config'
import { GamerProfileProvider } from '@/context/GamerProfileContext'
import { UserProvider } from '@/context/UserContext'
import { getNetworkConfig } from '@/lib/config/deployment'

type SeiWalletState = {
  isConnected: boolean
  address?: string
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const SeiWalletContext = createContext<SeiWalletState | null>(null)

export function useSeiWallet() {
  const ctx = useContext(SeiWalletContext)
  if (!ctx) throw new Error('useSeiWallet must be used within Web3Providers')
  return ctx
}

function SeiWalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | undefined>(undefined)

  const connect = async () => {
    // Placeholder: integrate Sei Global Wallet here (Compass/Sei/Keplr/Leap)
    // We will wire to the holic implementation in a follow-up patch
    setIsConnected(true)
    setAddress('sei1placeholderaddress')
  }

  const disconnect = async () => {
    setIsConnected(false)
    setAddress(undefined)
  }

  const value = useMemo(
    () => ({ isConnected, address, connect, disconnect }),
    [isConnected, address],
  )

  return <SeiWalletContext.Provider value={value}>{children}</SeiWalletContext.Provider>
}

export default function Web3Providers({ children }: { children: React.ReactNode }) {
  const dynamicEnvId = dynamicConfig.environmentId
  const hasDynamicEnv = typeof dynamicEnvId === 'string' && dynamicEnvId.length > 0

  if (!dynamicEnvId && typeof window !== 'undefined') {
    console.error('Dynamic: Missing NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID. Set it in .env.local.')
  }

  // Client-only: register Sei Global Wallet (EIP-6963) without impacting SSR
  useEffect(() => {
    // Dynamic import ensures this runs only in the browser
    import('@sei-js/sei-global-wallet/eip6963').catch((err) => {
      console.error('Failed to load Sei Global Wallet (EIP-6963):', err)
    })
  }, [])

  // Build Dynamic overrides for current env and known networks
  const net = getNetworkConfig()

  const evmNetworks = [
    {
      blockExplorerUrls: ['https://seitrace.com'],
      chainId: 1329,
      chainName: 'Sei Network',
      iconUrls: ['https://app.dynamic.xyz/assets/networks/sei.svg'],
      name: 'Sei',
      nativeCurrency: { decimals: 18, name: 'Sei', symbol: 'SEI' },
      networkId: 1329,
      rpcUrls: ['https://evm-rpc.sei-apis.com'],
      vanityName: 'Sei Mainnet',
    },
    {
      blockExplorerUrls: ['https://seitrace.com/?chain=atlantic-2'],
      chainId: 713715,
      chainName: 'Sei Testnet',
      iconUrls: ['https://app.dynamic.xyz/assets/networks/sei.svg'],
      name: 'Sei Testnet',
      nativeCurrency: { decimals: 18, name: 'Sei', symbol: 'SEI' },
      networkId: 713715,
      rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
      vanityName: 'Sei Testnet',
    },
    {
      blockExplorerUrls: ['http://localhost:8545'],
      chainId: 31337,
      chainName: 'Hardhat Local',
      iconUrls: ['https://app.dynamic.xyz/assets/networks/ethereum.svg'],
      name: 'Localhost',
      nativeCurrency: { decimals: 18, name: 'GO', symbol: 'GO' },
      networkId: 31337,
      rpcUrls: ['http://127.0.0.1:8545'],
      vanityName: 'Hardhat Local',
    },
  ]

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={useMemo(() => new QueryClient(), [])}>
        {hasDynamicEnv ? (
          <DynamicContextProvider
            settings={{
              environmentId: dynamicEnvId,
              walletConnectors: [EthereumWalletConnectors],
              overrides: {
                evmNetworks: () => evmNetworks,
              },
            }}
          >
            <SeiWalletProvider>
              <UserProvider>
                <GamerProfileProvider>{children}</GamerProfileProvider>
              </UserProvider>
            </SeiWalletProvider>
          </DynamicContextProvider>
        ) : (
          // Graceful SSR fallback when Dynamic env ID is not set.
          // This avoids build-time crashes on Vercel prerender for routes like /_not-found.
          <>{children}</>
        )}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

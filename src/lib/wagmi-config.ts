import { createConfig } from '@wagmi/core'
import { http } from 'viem'
import { getNetworkConfig } from '@/lib/config/deployment'

// Build a lightweight chain object dynamically from current environment
const net = getNetworkConfig()

// Minimal chain shape for Wagmi/Viem configuration
const chain = {
  id: net.chainId,
  name: net.name,
  nativeCurrency: net.nativeCurrency,
  rpcUrls: {
    default: { http: [net.rpcUrl] },
    public: { http: [net.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: net.blockExplorer },
  },
} as const

export const config = createConfig({
  chains: [chain] as any,
  transports: {
    [net.chainId]: http(net.rpcUrl),
  },
})

export type WagmiConfig = typeof config
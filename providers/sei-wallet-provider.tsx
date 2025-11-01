'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// EIP-6963 types
interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: any
}

interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider'
  detail: EIP6963ProviderDetail
}

// Sei Global Wallet types
interface SeiWallet {
  address: string
  isConnected: boolean
  chainId?: number
}

interface SeiWalletContextType {
  wallet: SeiWallet | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  connectWithProvider: (provider: any) => Promise<void>
  disconnect: () => void
  error: string | null
  providers: Map<string, EIP6963ProviderDetail>
}

const SeiWalletContext = createContext<SeiWalletContextType | undefined>(undefined)

export function SeiWalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<SeiWallet | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providers, setProviders] = useState<Map<string, EIP6963ProviderDetail>>(new Map())

  const isConnected = wallet?.isConnected || false

  // Initialize EIP-6963 provider discovery
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadSeiWallet = async () => {
      try {
        // Import sei-global-wallet to register it
        await import('@sei-js/sei-global-wallet/eip6963')

        // Set up EIP-6963 provider discovery
        const handleAnnounceProvider = (event: EIP6963AnnounceProviderEvent) => {
          setProviders((prev) => new Map(prev.set(event.detail.info.uuid, event.detail)))
        }

        // Listen for provider announcements
        window.addEventListener('eip6963:announceProvider', handleAnnounceProvider as EventListener)

        // Request providers to announce themselves
        window.dispatchEvent(new Event('eip6963:requestProvider'))

        // Check for existing connection after a short delay
        setTimeout(() => {
          checkConnection()
        }, 100)

        return () => {
          window.removeEventListener(
            'eip6963:announceProvider',
            handleAnnounceProvider as EventListener
          )
        }
      } catch (err) {
        console.error('Error loading Sei Global Wallet:', err)
      }
    }

    loadSeiWallet()
  }, [])

  const checkConnection = async () => {
    try {
      // First try to find Sei Global Wallet provider
      const seiProvider = Array.from(providers.values()).find(
        (provider) =>
          provider.info.name.toLowerCase().includes('sei') || provider.info.rdns.includes('sei')
      )

      const provider = seiProvider?.provider || window.ethereum

      if (provider) {
        const accounts = await provider.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          const chainId = await provider.request({ method: 'eth_chainId' })
          setWallet({
            address: accounts[0],
            isConnected: true,
            chainId: parseInt(chainId, 16),
          })
        }
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err)
    }
  }

  const connect = async () => {
    if (isConnecting) return

    setIsConnecting(true)
    setError(null)

    try {
      // First try to find Sei Global Wallet provider
      const seiProvider = Array.from(providers.values()).find(
        (provider) =>
          provider.info.name.toLowerCase().includes('sei') || provider.info.rdns.includes('sei')
      )

      let provider = seiProvider?.provider

      // If no Sei Global Wallet found, check if it's available but not announced yet
      if (!provider && typeof window !== 'undefined') {
        // Try to trigger the global wallet modal by dispatching the request again
        window.dispatchEvent(new Event('eip6963:requestProvider'))

        // Wait a bit for providers to announce
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Check again for Sei provider
        const updatedSeiProvider = Array.from(providers.values()).find(
          (p) => p.info.name.toLowerCase().includes('sei') || p.info.rdns.includes('sei')
        )

        provider = updatedSeiProvider?.provider || window.ethereum
      }

      if (!provider) {
        throw new Error('Sei wallet not found. Please install a Sei-compatible wallet.')
      }

      // Request account access - this should open the wallet modal
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Get chain ID
      const chainId = await provider.request({ method: 'eth_chainId' })

      // Check if we're on Sei network (mainnet: 1329, testnet: 1328)
      const seiChainId = parseInt(chainId, 16)
      if (seiChainId !== 1329 && seiChainId !== 1328) {
        // Try to switch to Sei testnet
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x530' }], // 1328 in hex (Sei testnet)
          })
        } catch (switchError: any) {
          // If the chain hasn't been added to the wallet, add it
          if (switchError.code === 4902) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x530',
                  chainName: 'Sei Testnet',
                  nativeCurrency: {
                    name: 'Sei',
                    symbol: 'SEI',
                    decimals: 18,
                  },
                  rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
                  blockExplorerUrls: ['https://seitrace.com/?chain=testnet'],
                },
              ],
            })
          } else {
            throw switchError
          }
        }
      }

      setWallet({
        address: accounts[0],
        isConnected: true,
        chainId: seiChainId,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
      console.error('Wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const connectWithProvider = async (provider: any) => {
    if (isConnecting) return

    setIsConnecting(true)
    setError(null)

    try {
      if (!provider) {
        throw new Error('No provider specified')
      }

      // Request account access - this should open the wallet modal
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Get chain ID
      const chainId = await provider.request({ method: 'eth_chainId' })

      // Check if we're on Sei network (mainnet: 1329, testnet: 1328)
      const seiChainId = parseInt(chainId, 16)
      if (seiChainId !== 1329 && seiChainId !== 1328) {
        // Try to switch to Sei testnet
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x530' }], // 1328 in hex (Sei testnet)
          })
        } catch (switchError: any) {
          // If the chain hasn't been added to the wallet, add it
          if (switchError.code === 4902) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x530',
                  chainName: 'Sei Testnet',
                  nativeCurrency: {
                    name: 'Sei',
                    symbol: 'SEI',
                    decimals: 18,
                  },
                  rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
                  blockExplorerUrls: ['https://seitrace.com/?chain=testnet'],
                },
              ],
            })
          } else {
            throw switchError
          }
        }
      }

      setWallet({
        address: accounts[0],
        isConnected: true,
        chainId: seiChainId,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
      console.error('Wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setWallet(null)
    setError(null)
  }

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          setWallet((prev) => (prev ? { ...prev, address: accounts[0] } : null))
        }
      }

      const handleChainChanged = (chainId: string) => {
        setWallet((prev) => (prev ? { ...prev, chainId: parseInt(chainId, 16) } : null))
      }

      // Listen to all available providers
      providers.forEach((providerDetail) => {
        const provider = providerDetail.provider
        if (provider && provider.on) {
          provider.on('accountsChanged', handleAccountsChanged)
          provider.on('chainChanged', handleChainChanged)
        }
      })

      // Also listen to window.ethereum as fallback
      if (window.ethereum && window.ethereum.on) {
        window.ethereum.on('accountsChanged', handleAccountsChanged)
        window.ethereum.on('chainChanged', handleChainChanged)
      }

      return () => {
        // Clean up listeners
        providers.forEach((providerDetail) => {
          const provider = providerDetail.provider
          if (provider && provider.removeListener) {
            provider.removeListener('accountsChanged', handleAccountsChanged)
            provider.removeListener('chainChanged', handleChainChanged)
          }
        })

        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
          window.ethereum.removeListener('chainChanged', handleChainChanged)
        }
      }
    }
  }, [providers])

  const value: SeiWalletContextType = {
    wallet,
    isConnected,
    isConnecting,
    connect,
    connectWithProvider,
    disconnect,
    error,
    providers,
  }

  return <SeiWalletContext.Provider value={value}>{children}</SeiWalletContext.Provider>
}

export function useSeiWallet() {
  const context = useContext(SeiWalletContext)
  if (context === undefined) {
    throw new Error('useSeiWallet must be used within a SeiWalletProvider')
  }
  return context
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}

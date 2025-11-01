'use client'

// Simple token address resolution utility
export const getGamerTokenAddress = (): `0x${string}` | null => {
  const addr = process.env.NEXT_PUBLIC_GAMER_TOKEN_ADDRESS
  if (!addr) return null
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return null
  return addr as `0x${string}`
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
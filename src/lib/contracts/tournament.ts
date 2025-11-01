"use client"

import { getPublicClient, getInjectedWalletClient } from '@/lib/contracts/tournamentFactory'
import type { WalletClient } from 'viem'
import { getNetworkConfig } from '@/lib/config/deployment'
import TournamentArtifact from '@/../contracts/artifacts/contracts/Tournament.sol/Tournament.json'
import { ZERO_ADDRESS } from '@/lib/tokens'

const TournamentAbi = TournamentArtifact.abi

export type TournamentInfo = {
  creator: `0x${string}`
  entryFee: bigint
  maxParticipants: bigint
  xftToJoin: bigint
  createdAt: bigint
  gameType: string
  metadata: string
  payToken: `0x${string}`
  isFFA: boolean
  status: number
  totalPrizePool: bigint
}

export const readTournamentInfo = async (address: `0x${string}`): Promise<TournamentInfo> => {
  const client = getPublicClient()
  const result = await client.readContract({ address, abi: TournamentAbi, functionName: 'getTournamentInfo' })
  // viem returns tuple as object keyed by names
  const info = result as unknown as TournamentInfo
  return info
}

export const readParticipants = async (address: `0x${string}`): Promise<`0x${string}`[]> => {
  const client = getPublicClient()
  const result = await client.readContract({ address, abi: TournamentAbi, functionName: 'getParticipants' })
  return (result as `0x${string}`[])
}

export const readActiveParticipants = async (address: `0x${string}`): Promise<`0x${string}`[]> => {
  const client = getPublicClient()
  const result = await client.readContract({ address, abi: TournamentAbi, functionName: 'getActiveParticipants' })
  return (result as `0x${string}`[])
}

export const readHost = async (address: `0x${string}`): Promise<`0x${string}`> => {
  const client = getPublicClient()
  const result = await client.readContract({ address, abi: TournamentAbi, functionName: 'getHost' })
  return result as `0x${string}`
}

export const readChallenge = async (tournament: `0x${string}`, player1: `0x${string}`, player2: `0x${string}`): Promise<`0x${string}`> => {
  const client = getPublicClient()
  const result = await client.readContract({ address: tournament, abi: TournamentAbi, functionName: 'getChallenge', args: [player1, player2] })
  return result as `0x${string}`
}

// Build a minimal viem Chain object from current environment
const net = getNetworkConfig()
const viemChain = {
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

export const joinTournament = async (
  account: `0x${string}`,
  tournament: `0x${string}`,
  walletClient?: WalletClient,
) => {
  const client = getPublicClient()
  // Read entry fee and pay token to determine value
  const info = await client.readContract({ address: tournament, abi: TournamentAbi, functionName: 'getTournamentInfo' }) as TournamentInfo
  const isNative = String(info.payToken).toLowerCase() === String(ZERO_ADDRESS).toLowerCase()
  const value = isNative ? (info.entryFee as bigint) : BigInt(0)
  const wallet = walletClient ?? getInjectedWalletClient()
  const hash = await wallet.writeContract({ address: tournament, abi: TournamentAbi, functionName: 'joinTournament', args: [], account, value, chain: viemChain })
  const receipt = await client.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

export const cancelTournament = async (
  account: `0x${string}`,
  tournament: `0x${string}`,
  reason: string,
  walletClient?: WalletClient,
) => {
  const client = getPublicClient()
  const wallet = walletClient ?? getInjectedWalletClient()
  const hash = await wallet.writeContract({ 
    address: tournament, 
    abi: TournamentAbi, 
    functionName: 'cancelTournament', 
    args: [reason], 
    account, 
    chain: viemChain 
  })
  const receipt = await client.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}
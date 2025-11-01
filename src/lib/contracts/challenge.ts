'use client'

import { createPublicClient, http, type WalletClient } from 'viem'
import { getRpcUrl } from '@/lib/contract-addresses'
import { getNetworkConfig } from '@/lib/config/deployment'
import ChallengeArtifact from '@/lib/contracts/abi/Challenge.json'

const ChallengeAbi = ChallengeArtifact.abi

export const getPublicClient = () =>
  createPublicClient({ transport: http(getRpcUrl()) })

// Module-level wallet client (injected via setter) to avoid window.ethereum in module code
let _walletClient: WalletClient | null = null

export const setWalletClient = (client: WalletClient) => {
  _walletClient = client
}

export const getInjectedWalletClient = (): WalletClient => {
  if (!_walletClient) throw new Error('No wallet client set. Call setWalletClient or pass a wallet client parameter.')
  return _walletClient
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

export type ChallengeInfoStruct = {
  challengeType: number
  status: number
  creator: `0x${string}`
  opponent: `0x${string}`
  entryFee: bigint
  totalPrizePool: bigint
  createdAt: bigint
  currentParticipants: bigint
  player1score: bigint
  player2score: bigint
  scoreReporter: `0x${string}`
  timeScored: bigint
  timeScoreConfirmed: bigint
  gameType: string
  metadata: string
  tournament: `0x${string}`
  payToken: `0x${string}`
  contractBalance: bigint
}

export const readChallengeInfo = async (address: `0x${string}`): Promise<ChallengeInfoStruct> => {
  const client = getPublicClient()
  const result = await client.readContract({ address, abi: ChallengeAbi, functionName: 'getChallengeInfo' })
  return result as ChallengeInfoStruct
}

export const readParticipant = async (challenge: `0x${string}`, player: `0x${string}`): Promise<{ player: `0x${string}`; joinedAt: bigint; hasPaid: boolean; score: bigint; scoreConfirmed: boolean }> => {
  const client = getPublicClient()
  const result = await client.readContract({ address: challenge, abi: ChallengeAbi, functionName: 'getParticipant', args: [player] })
  return result as any
}

export const joinChallenge = async (
  account: `0x${string}`,
  challenge: `0x${string}`,
  opts: { valueWei?: bigint },
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const hash = await wallet.writeContract({ address: challenge, abi: ChallengeAbi, functionName: 'joinChallenge', args: [], account, value: opts.valueWei ?? BigInt(0), chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

export const submitScore = async (
  account: `0x${string}`,
  challenge: `0x${string}`,
  player1score: bigint,
  player2score: bigint,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const hash = await wallet.writeContract({ address: challenge, abi: ChallengeAbi, functionName: 'submitScore', args: [player1score, player2score], account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

export const confirmScore = async (
  account: `0x${string}`,
  challenge: `0x${string}`,
  confirmer: `0x${string}`,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const hash = await wallet.writeContract({ address: challenge, abi: ChallengeAbi, functionName: 'confirmScore', args: [confirmer], account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

export const disputeChallenge = async (
  account: `0x${string}`,
  challenge: `0x${string}`,
  reason: string,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const hash = await wallet.writeContract({ address: challenge, abi: ChallengeAbi, functionName: 'disputeChallenge', args: [reason], account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

export const cancelChallenge = async (
  account: `0x${string}`,
  challenge: `0x${string}`,
  reason: string,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const hash = await wallet.writeContract({ address: challenge, abi: ChallengeAbi, functionName: 'cancelChallenge', args: [reason], account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}
'use client'

import { createPublicClient, http, parseEventLogs, type WalletClient } from 'viem'
import { getRpcUrl, getChallengeFactoryAddress } from '@/lib/contract-addresses'
import { getNetworkConfig } from '@/lib/config/deployment'
import ChallengeFactoryArtifact from '@/lib/contracts/abi/ChallengeFactory.json'
import { ZERO_ADDRESS } from '@/lib/tokens'

const ChallengeFactoryAbi = ChallengeFactoryArtifact.abi

// Minimal ERC20 ABI (balanceOf, allowance, approve, decimals)
export const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const

export const getPublicClient = () =>
  createPublicClient({ transport: http(getRpcUrl()) })

// Module-level wallet client (injected via setter) to avoid window.ethereum
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

export const readPlatformFeeRate = async (): Promise<bigint> => {
  const client = getPublicClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const result = await client.readContract({ address, abi: ChallengeFactoryAbi, functionName: 'platformFeeRate' })
  return result as bigint
}

export const readMinimumEntryFee = async (): Promise<bigint> => {
  const client = getPublicClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const result = await client.readContract({ address, abi: ChallengeFactoryAbi, functionName: 'minimumEntryFee' })
  return result as bigint
}

export const readFeeRecipient = async (): Promise<`0x${string}`> => {
  const client = getPublicClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const result = (await client.readContract({ address, abi: ChallengeFactoryAbi, functionName: 'feeRecipient' })) as `0x${string}`
  return result
}

export const readIsMod = async (addr: `0x${string}`): Promise<boolean> => {
  const client = getPublicClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const result = await client.readContract({ address, abi: ChallengeFactoryAbi, functionName: 'getMod', args: [addr] })
  return Boolean(result)
}

export const readIsAdmin = async (addr: `0x${string}`): Promise<boolean> => {
  const client = getPublicClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const result = await client.readContract({ address, abi: ChallengeFactoryAbi, functionName: 'getAdmin', args: [addr] })
  return Boolean(result)
}

// Using single module-level wallet client and chain definitions declared above.

export const setAdmin = async (
  account: `0x${string}`,
  target: `0x${string}`,
  isAdminFlag: boolean,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const args: readonly [`0x${string}`, boolean] = [target, isAdminFlag]
  const hash = await wallet.writeContract({ address, abi: ChallengeFactoryAbi, functionName: 'setAdmin', args, account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

export const setMod = async (
  account: `0x${string}`,
  target: `0x${string}`,
  isModFlag: boolean,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const args: readonly [`0x${string}`, boolean] = [target, isModFlag]
  const hash = await wallet.writeContract({ address, abi: ChallengeFactoryAbi, functionName: 'setMod', args, account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

export const updateFeeRecipient = async (
  account: `0x${string}`,
  newRecipient: `0x${string}`,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const args: readonly [`0x${string}`] = [newRecipient]
  const hash = await wallet.writeContract({ address, abi: ChallengeFactoryAbi, functionName: 'updateFeeRecipient', args, account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

export const updateMinimumEntryFee = async (
  account: `0x${string}`,
  newMinimumFeeWei: bigint,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const args: readonly [bigint] = [newMinimumFeeWei]
  const hash = await wallet.writeContract({ address, abi: ChallengeFactoryAbi, functionName: 'updateMinimumEntryFee', args, account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

export const updatePlatformFeeRate = async (
  account: `0x${string}`,
  newFeeRateBps: bigint,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const args: readonly [bigint] = [newFeeRateBps]
  const hash = await wallet.writeContract({ address, abi: ChallengeFactoryAbi, functionName: 'updatePlatformFeeRate', args, account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

export const getNativeBalance = async (address: `0x${string}`): Promise<bigint> => {
  const client = getPublicClient()
  return client.getBalance({ address })
}

export const getTokenBalance = async (token: `0x${string}`, owner: `0x${string}`): Promise<bigint> => {
  const client = getPublicClient()
  return client.readContract({ address: token, abi: ERC20_ABI, functionName: 'balanceOf', args: [owner] })
}

export const getTokenAllowance = async (
  token: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`,
): Promise<bigint> => {
  const client = getPublicClient()
  return client.readContract({ address: token, abi: ERC20_ABI, functionName: 'allowance', args: [owner, spender] })
}

export const approveTokenIfNeeded = async (
  token: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint,
  walletClient?: WalletClient,
): Promise<void> => {
  const allowance = await getTokenAllowance(token, owner, spender)
  if (allowance >= amount) return
  const wallet = walletClient ?? getInjectedWalletClient()
  await wallet.writeContract({ address: token, abi: ERC20_ABI, functionName: 'approve', args: [spender, amount], account: owner, chain: viemChain })
}

export type CreateHeadsUpParams = {
  entryFeeWei: bigint
  opponent: `0x${string}`
  payToken?: `0x${string}` | null
  gameType: string
  metadata: string
}

export const createHeadsUpChallenge = async (
  account: `0x${string}`,
  params: CreateHeadsUpParams,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const address = getChallengeFactoryAddress() as `0x${string}`
  const args: readonly [bigint, `0x${string}`, `0x${string}`, `0x${string}`, string, string] = [
    params.entryFeeWei,
    params.opponent,
    params.payToken ?? (ZERO_ADDRESS as `0x${string}`),
    ZERO_ADDRESS as `0x${string}`,
    params.gameType,
    params.metadata,
  ]
  const value = params.payToken && params.payToken !== ZERO_ADDRESS ? BigInt(0) : params.entryFeeWei
  const hash = await wallet.writeContract({ address, abi: ChallengeFactoryAbi, functionName: 'createHeadsUpChallenge', args, account, value, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  // Find ChallengeCreated event to extract the new challenge address
  let challengeAddress: `0x${string}` | null = null
  const events = parseEventLogs({ abi: ChallengeFactoryAbi as any, eventName: 'ChallengeCreated', logs: receipt.logs }) as Array<{ args?: { challengeContract?: `0x${string}` } }>
  if (events.length > 0) {
    const cc = events[0]?.args?.challengeContract as `0x${string}` | undefined
    if (cc) challengeAddress = cc
  }
  return { hash, receipt, challengeAddress }
}
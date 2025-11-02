"use client"

import { createPublicClient, http, parseEventLogs, type WalletClient } from 'viem'
import { getRpcUrl, getTournamentFactoryAddress } from '@/lib/contract-addresses'
import { getNetworkConfig } from '@/lib/config/deployment'
import TournamentFactoryArtifact from '@/lib/contracts/abi/TournamentFactory.json'
import { ZERO_ADDRESS } from '@/lib/tokens'

const TournamentFactoryAbi = TournamentFactoryArtifact.abi

// Reuse minimal ERC20 ABI (balanceOf, allowance, approve, decimals)
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

export const readIsAdmin = async (addr: `0x${string}`): Promise<boolean> => {
  const client = getPublicClient()
  const address = getTournamentFactoryAddress() as `0x${string}`
  const result = await client.readContract({ address, abi: TournamentFactoryAbi, functionName: 'isAdmin', args: [addr] })
  return Boolean(result)
}

export const readIsMod = async (addr: `0x${string}`): Promise<boolean> => {
  const client = getPublicClient()
  const address = getTournamentFactoryAddress() as `0x${string}`
  const result = await client.readContract({ address, abi: TournamentFactoryAbi, functionName: 'getMod', args: [addr] })
  return Boolean(result)
}

export const readPlatformFeeRate = async (): Promise<bigint> => {
  const client = getPublicClient()
  const address = getTournamentFactoryAddress() as `0x${string}`
  const result = await client.readContract({ address, abi: TournamentFactoryAbi, functionName: 'platformFeeRate' })
  return result as bigint
}

export const readMinimumEntryFee = async (): Promise<bigint> => {
  const client = getPublicClient()
  const address = getTournamentFactoryAddress() as `0x${string}`
  const result = await client.readContract({ address, abi: TournamentFactoryAbi, functionName: 'minimumEntryFee' })
  return result as bigint
}

export const readFeeRecipient = async (): Promise<`0x${string}`> => {
  const client = getPublicClient()
  const address = getTournamentFactoryAddress() as `0x${string}`
  const result = (await client.readContract({ address, abi: TournamentFactoryAbi, functionName: 'feeRecipient' })) as `0x${string}`
  return result
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

export type CreateTournamentParams = {
  entryFeeWei: bigint
  payToken?: `0x${string}` | null
  maxParticipants: number
  xftToJoin?: number | bigint
  isFFA: boolean
  gameType: string
  metadata: string
}

export const createTournament = async (
  account: `0x${string}`,
  params: CreateTournamentParams,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const address = getTournamentFactoryAddress() as `0x${string}`
  const args: readonly [bigint, `0x${string}`, bigint, bigint, boolean, string, string] = [
    params.entryFeeWei,
    params.payToken ?? (ZERO_ADDRESS as `0x${string}`),
    BigInt(params.maxParticipants),
    BigInt(params.xftToJoin ?? 0),
    params.isFFA,
    params.gameType,
    params.metadata,
  ]
  // Factory.createTournament is nonpayable; never send value
  const value = BigInt(0)
  const hash = await wallet.writeContract({ address, abi: TournamentFactoryAbi, functionName: 'createTournament', args, account, value, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  let tournamentAddress: `0x${string}` | null = null
  const events = parseEventLogs({ abi: TournamentFactoryAbi as any, eventName: 'TournamentCreated', logs: receipt.logs }) as Array<{ args?: { tournamentContract?: `0x${string}` } }>
  if (events.length > 0) {
    const tc = events[0]?.args?.tournamentContract as `0x${string}` | undefined
    if (tc) tournamentAddress = tc
  }
  return { hash, receipt, tournamentAddress }
}

// Read configured external deployer; must be non-zero to create tournaments
export const readTournamentDeployer = async (): Promise<`0x${string}`> => {
  const client = getPublicClient()
  const address = getTournamentFactoryAddress() as `0x${string}`
  const result = (await client.readContract({ address, abi: TournamentFactoryAbi, functionName: 'tournamentDeployer' })) as `0x${string}`
  return result
}

// Admin actions
export const setAdmin = async (
  account: `0x${string}`,
  target: `0x${string}`,
  isAdminFlag: boolean,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const address = getTournamentFactoryAddress() as `0x${string}`
  const args: readonly [`0x${string}`, boolean] = [target, isAdminFlag]
  const hash = await wallet.writeContract({ address, abi: TournamentFactoryAbi, functionName: 'setAdmin', args, account, chain: viemChain })
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
  const address = getTournamentFactoryAddress() as `0x${string}`
  const args: readonly [`0x${string}`, boolean] = [target, isModFlag]
  const hash = await wallet.writeContract({ address, abi: TournamentFactoryAbi, functionName: 'setMod', args, account, chain: viemChain })
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
  const address = getTournamentFactoryAddress() as `0x${string}`
  const args: readonly [`0x${string}`] = [newRecipient]
  const hash = await wallet.writeContract({ address, abi: TournamentFactoryAbi, functionName: 'updateFeeRecipient', args, account, chain: viemChain })
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
  const address = getTournamentFactoryAddress() as `0x${string}`
  const args: readonly [bigint] = [newMinimumFeeWei]
  const hash = await wallet.writeContract({ address, abi: TournamentFactoryAbi, functionName: 'updateMinimumEntryFee', args, account, chain: viemChain })
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
  const address = getTournamentFactoryAddress() as `0x${string}`
  const args: readonly [bigint] = [newFeeRateBps]
  const hash = await wallet.writeContract({ address, abi: TournamentFactoryAbi, functionName: 'updatePlatformFeeRate', args, account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

// Configure external tournament deployer (admin only)
export const setTournamentDeployer = async (
  account: `0x${string}`,
  deployer: `0x${string}`,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const address = getTournamentFactoryAddress() as `0x${string}`
  const args: readonly [`0x${string}`] = [deployer]
  const hash = await wallet.writeContract({ address, abi: TournamentFactoryAbi, functionName: 'setTournamentDeployer', args, account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}

// Set required XFT entry count and token contract (mod/admin)
export const setXFTToJoinEntryCount = async (
  account: `0x${string}`,
  xftToJoin: bigint,
  xftContract: `0x${string}`,
  entryCount: bigint,
  walletClient?: WalletClient,
) => {
  const wallet = walletClient ?? getInjectedWalletClient()
  const address = getTournamentFactoryAddress() as `0x${string}`
  const args: readonly [bigint, `0x${string}`, bigint] = [xftToJoin, xftContract, entryCount]
  const hash = await wallet.writeContract({ address, abi: TournamentFactoryAbi, functionName: 'setXFTToJoinEntryCount', args, account, chain: viemChain })
  const publicClient = getPublicClient()
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { hash, receipt }
}
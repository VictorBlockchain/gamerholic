/**
 * Contract Addresses Configuration
 * Centralized management of all smart contract addresses across different networks
 */

import localhostDeployment from '../../contracts/deployments/localhost.json'
import mainnetDeployment from '../../contracts/deployments/mainnet.json'
// Environment types
export type NetworkEnvironment = 'testnet' | 'local' | 'mainnet'

// Contract address structure
export interface ContractAddresses {
  // Holic Gaming Platform Contracts
  challengeFactory: string
  tournamentFactory: string

  // Network metadata
  network: string
  deployer: string
}

// Get current environment from environment variable
export const getCurrentEnvironment = (): NetworkEnvironment => {
  const env = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV
  if (env) return env as NetworkEnvironment
  return process.env.NODE_ENV === 'development' ? 'local' : 'testnet'
}

// Mainnet contract addresses (Sei mainnet)
export const mainnetAddresses: ContractAddresses = {
  // Holic Gaming Platform Contracts - TODO: Deploy to mainnet
  challengeFactory: '0x0000000000000000000000000000000000000000',
  tournamentFactory: '0x0000000000000000000000000000000000000000',

  network: 'seiMainnet',
  deployer: '0x5C7F6a34c81a9cD0a00EAaFB4DEf71AbE281B767',
}

// Override from latest mainnet deployment JSON if present
if (mainnetDeployment?.contracts?.ChallengeFactory?.address) {
  mainnetAddresses.challengeFactory = mainnetDeployment.contracts.ChallengeFactory.address
}
if (mainnetDeployment?.contracts?.TournamentFactory?.address) {
  mainnetAddresses.tournamentFactory = mainnetDeployment.contracts.TournamentFactory.address
}
if (mainnetDeployment?.deployer) {
  mainnetAddresses.deployer = mainnetDeployment.deployer
}

// Testnet contract addresses (Sei testnet)
export const testnetAddresses: ContractAddresses = {
  // Holic Gaming Platform Contracts - TODO: Deploy to testnet
  challengeFactory: '0x0000000000000000000000000000000000000000',
  tournamentFactory: '0x0000000000000000000000000000000000000000',

  network: 'seiTestnet',
  deployer: '0xF99b6c37c5D488CD64682d9A331616e500BE431c',
}

// Local development contract addresses (Hardhat localhost)
export const localAddresses: ContractAddresses = {
  // Holic Gaming Platform Contracts - DEPLOYED
  challengeFactory: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  tournamentFactory: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',

  network: 'localhost',
  deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
}
// Override from latest localhost deployment JSON if present
if (localhostDeployment?.contracts?.ChallengeFactory?.address) {
  localAddresses.challengeFactory = localhostDeployment.contracts.ChallengeFactory.address
}
if (localhostDeployment?.contracts?.TournamentFactory?.address) {
  localAddresses.tournamentFactory = localhostDeployment.contracts.TournamentFactory.address
}
if (localhostDeployment?.deployer) {
  localAddresses.deployer = localhostDeployment.deployer
}

// Contract addresses mapping
export const contractAddresses = {
  mainnet: mainnetAddresses,
  testnet: testnetAddresses,
  local: localAddresses,
} as const

// Get contract addresses for current environment
export const getContractAddresses = (): ContractAddresses => {
  const env = getCurrentEnvironment()
  return contractAddresses[env]
}

// Get specific contract address
export const getContractAddress = (contractName: keyof ContractAddresses): string => {
  const addresses = getContractAddresses()
  return addresses[contractName]
}

// Utility functions for specific contracts
export const getChallengeFactoryAddress = (): string => {
  return getContractAddress('challengeFactory')
}

export const getTournamentFactoryAddress = (): string => {
  return getContractAddress('tournamentFactory')
}

// Validation functions
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export const isContractDeployed = (contractName: keyof ContractAddresses): boolean => {
  const address = getContractAddress(contractName)
  return isValidAddress(address) && address !== '0x0000000000000000000000000000000000000000'
}

// Environment checks
export const isMainnet = (): boolean => getCurrentEnvironment() === 'mainnet'
export const isTestnet = (): boolean => getCurrentEnvironment() === 'testnet'
export const isLocal = (): boolean => getCurrentEnvironment() === 'local'

// Network configuration
export interface NetworkConfig {
  chainId: number
  name: string
  rpcUrl: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

export const networkConfigs: Record<NetworkEnvironment, NetworkConfig> = {
  testnet: {
    chainId: 713715,
    name: 'Sei Testnet',
    rpcUrl: 'https://evm-rpc-testnet.sei-apis.com',
    blockExplorer: 'https://seitrace.com/?chain=atlantic-2',
    nativeCurrency: {
      name: 'Sei',
      symbol: 'SEI',
      decimals: 18,
    },
  },
  mainnet: {
    chainId: 1329,
    name: 'Sei Network',
    rpcUrl: 'https://evm-rpc.sei-apis.com',
    blockExplorer: 'https://seitrace.com',
    nativeCurrency: {
      name: 'Sei',
      symbol: 'SEI',
      decimals: 18,
    },
  },
  local: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
}

export const getNetworkConfig = (): NetworkConfig => {
  const env = getCurrentEnvironment()
  return networkConfigs[env]
}

export const getRpcUrl = (): string => getNetworkConfig().rpcUrl
export const getChainId = (): number => getNetworkConfig().chainId
export const getBlockExplorer = (): string => getNetworkConfig().blockExplorer

// Export current environment addresses as default
export const addresses = getContractAddresses()

// Export for backward compatibility
export default addresses

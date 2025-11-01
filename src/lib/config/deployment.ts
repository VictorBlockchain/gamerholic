/**
 * Centralized deployment configuration
 * Easy switching between testnet and local environments
 * Now uses the new contract-addresses.ts structure
 */

import {
  contractAddresses,
  getCurrentEnvironment,
  networkConfigs,
  type NetworkEnvironment,
  type ContractAddresses,
  type NetworkConfig,
} from '../../lib/contract-addresses'

// Environment types (re-export for backward compatibility)
export type Environment = NetworkEnvironment

// Mainnet deployment configuration
export const mainnetDeployment = {
  network: networkConfigs.mainnet.name,
  chainId: networkConfigs.mainnet.chainId,
  rpcUrl: networkConfigs.mainnet.rpcUrl,
  blockExplorer: networkConfigs.mainnet.blockExplorer,
  deployer: contractAddresses.mainnet.deployer,
  contracts: contractAddresses.mainnet,
  nativeCurrency: networkConfigs.mainnet.nativeCurrency,
}

// Testnet deployment configuration
export const testnetDeployment = {
  network: networkConfigs.testnet.name,
  chainId: networkConfigs.testnet.chainId,
  rpcUrl: networkConfigs.testnet.rpcUrl,
  blockExplorer: networkConfigs.testnet.blockExplorer,
  deployer: contractAddresses.testnet.deployer,
  contracts: contractAddresses.testnet,
  nativeCurrency: networkConfigs.testnet.nativeCurrency,
}

// Local deployment configuration
export const localDeployment = {
  network: networkConfigs.local.name,
  chainId: networkConfigs.local.chainId,
  rpcUrl: networkConfigs.local.rpcUrl,
  blockExplorer: networkConfigs.local.blockExplorer,
  deployer: contractAddresses.local.deployer,
  contracts: contractAddresses.local,
  nativeCurrency: networkConfigs.local.nativeCurrency,
}

// Get deployment addresses based on current environment
export const getDeployment = () => {
  const env = getCurrentEnvironment()
  if (env === 'testnet') return testnetDeployment
  if (env === 'mainnet') return mainnetDeployment
  return localDeployment
}

// Get network configuration based on current environment
export const getNetworkConfig = () => {
  const env = getCurrentEnvironment()
  return networkConfigs[env]
}

// Re-export for backward compatibility
export { getCurrentEnvironment }

// Current deployment (dynamic based on environment)
export const deployment = getDeployment()

// Environment checks
export const isMainnet = () => getCurrentEnvironment() === 'mainnet'
export const isTestnet = () => getCurrentEnvironment() === 'testnet'
export const isLocal = () => getCurrentEnvironment() === 'local'

// Network utilities
export const getRpcUrl = () => getNetworkConfig().rpcUrl
export const getChainId = () => getNetworkConfig().chainId

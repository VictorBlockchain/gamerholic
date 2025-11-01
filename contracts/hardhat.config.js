require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config({ path: '../.env.local' })

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
      hardfork: 'berlin',
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
      allowUnlimitedContractSize: true,
      hardfork: 'berlin',
    },
    testnet: {
      url: process.env.NEXT_PUBLIC_SEI_RPC_URL || 'https://evm-rpc-testnet.sei-apis.com',
      chainId: parseInt(process.env.NEXT_PUBLIC_SEI_CHAIN_ID) || 1328,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || 'https://evm-rpc.sei-apis.com',
      chainId: 1329,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
}
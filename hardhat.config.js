require('@nomicfoundation/hardhat-toolbox')

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    hardhat: {
      chainId: 31337,
    },
    seiTestnet: {
      url: 'https://evm-rpc-testnet.sei-apis.com',
      accounts: ['aa0be0346a4e690e1de7434858baae05e4a95507db6d871c4420a49f597cb9cd'],
      chainId: 1328,
    },
    seiMainnet: {
      url: 'https://evm-rpc.sei-apis.com',
      accounts: ['0x70425a8bd0359bd7fbeba57ea75c52faa72b02c8f47ee3f08879061a27661894'],
      chainId: 1329,
    },
  },
}

const { ethers } = require('hardhat')
const hre = require('hardhat')
const fs = require('fs')
const path = require('path')

// Function to update centralized deployment config
function updateCentralizedConfig(deploymentInfo) {
  const configPath = path.join(__dirname, '..', 'lib', 'config', 'deployment.ts')

  try {
    // Read current config file
    let configContent = fs.readFileSync(configPath, 'utf8')

    // Determine if this is local, testnet, or mainnet deployment
    const isLocal = deploymentInfo.network === 'hardhat' || deploymentInfo.network === 'localhost'
    const isMainnet = deploymentInfo.network === 'seiMainnet'
    const configKey = isLocal
      ? 'localDeployment'
      : isMainnet
        ? 'mainnetDeployment'
        : 'testnetDeployment'

    // Create the new deployment object string
    const newDeployment = `{
  bank: '${deploymentInfo.bank}',
  bridge: '${deploymentInfo.bridge}',
  operatorStorage: '${deploymentInfo.operatorStorage}',
  operatorLogic: '${deploymentInfo.operatorLogic}',
  bankStorage: '${deploymentInfo.bankStorage}',
  bankLogic: '${deploymentInfo.bankLogic}',
  gxftFactory: '${deploymentInfo.gxftFactory}',
  gxftMinter: '${deploymentInfo.gxftMinter}',
  bagFactory: '${deploymentInfo.bagFactory}',
  bag: '${deploymentInfo.bag}',
  bagStorage: '${deploymentInfo.bagStorage}',
  xft: '${deploymentInfo.xft}',
  xftLogic: '${deploymentInfo.xftLogic}',
  xftStorage: '${deploymentInfo.xftStorage}',
  ammFactory: '${deploymentInfo.ammFactory}',
  amm: '${deploymentInfo.amm}',
  ammLogic: '${deploymentInfo.ammLogic}',
  dexstaFactory: '${deploymentInfo.dexstaFactory}',
  ammStorage: '${deploymentInfo.ammStorage}',
  marketLogic: '${deploymentInfo.marketLogic}',
  marketStorage: '${deploymentInfo.marketStorage}',
  tokenMetadata: '${deploymentInfo.tokenMetadata}',
  network: '${deploymentInfo.network}',
  deployer: '${deploymentInfo.deployer}',
}`

    // Replace the deployment object in the config file
    const regex = new RegExp(`const ${configKey} = \\{[\\s\\S]*?\\}`, 'g')
    configContent = configContent.replace(regex, `const ${configKey} = ${newDeployment}`)

    // Write updated config back to file
    fs.writeFileSync(configPath, configContent)
    console.log(`✅ Updated centralized config: ${configKey}`)
  } catch (error) {
    console.error('❌ Error updating centralized config:', error.message)
  }
}

async function main() {
  // Hardcode the private key for deployment
  const privateKey = '0x70425a8bd0359bd7fbeba57ea75c52faa72b02c8f47ee3f08879061a27661894'
  const deployer = new ethers.Wallet(privateKey, ethers.provider)

  console.log('🚀 Starting deployment of all contracts...')
  console.log('Deploying contracts with account:', deployer.address)
  console.log('Account balance:', (await deployer.provider.getBalance(deployer.address)).toString())

  // Deploy Bridge FIRST - this will be the central registry
  console.log('\n🌉 Deploying bridge contract FIRST...')
  const allAdmin = '0xbeb78971a34ec2cfe8002b009e381c1d44f816ff'
  const Bridge = await ethers.getContractFactory('Bridge')
  const bridge = await Bridge.deploy(allAdmin)
  await bridge.waitForDeployment()
  console.log('Bridge deployed to:', await bridge.getAddress())

  const Bank = await ethers.getContractFactory('Bank')
  const bank = await Bank.deploy(await bridge.getAddress())
  await bank.waitForDeployment()
  console.log('Bank deployed to:', await bank.getAddress())

  // Deploy storage contracts with bridge address
  console.log('\n💾 Deploying storage contracts...')

  const BankStorage = await ethers.getContractFactory('BankStorage')
  const bankStorage = await BankStorage.deploy(await bridge.getAddress())
  await bankStorage.waitForDeployment()
  console.log('BankStorage deployed to:', await bankStorage.getAddress())

  // Deploy BankLogic implementation contracts
  console.log('\n💾 Deploying BankLogic implementation contracts...')
  const BankLogic = await ethers.getContractFactory('BankLogic')
  const bankLogic = await BankLogic.deploy(await bridge.getAddress())
  await bankLogic.waitForDeployment()
  console.log('BankLogic implementation deployed to:', await bankLogic.getAddress())

  console.log('\n👜 Deploying Generative contracts...')
  const GxftFactory = await ethers.getContractFactory('GXFTFactory')
  const gxftFactory = await GxftFactory.deploy(await bridge.getAddress())
  await gxftFactory.waitForDeployment()
  console.log('GxftFactory deployed to:', await gxftFactory.getAddress())

  const GxftMinter = await ethers.getContractFactory('GXFTMinter')
  const gxftMinter = await GxftMinter.deploy(await bridge.getAddress())
  await gxftMinter.waitForDeployment()
  console.log('GxftMinter deployed to:', await gxftMinter.getAddress())

  // Deploy bag contracts with bridge address (before logic contracts)
  console.log('\n👜 Deploying bag contracts...')

  const Bag = await ethers.getContractFactory('Bag')
  const bag = await Bag.deploy(await bridge.getAddress(), 0, await bridge.getAddress(), 0)
  await bag.waitForDeployment()
  console.log('bag deployed to:', await bag.getAddress())

  const BagStorage = await ethers.getContractFactory('BagStorage')
  const bagStorage = await BagStorage.deploy(await bridge.getAddress())
  await bagStorage.waitForDeployment()
  console.log('bagStorage deployed to:', await bagStorage.getAddress())

  const BagFactory = await ethers.getContractFactory('BagFactory')
  const bagFactory = await BagFactory.deploy(await bridge.getAddress())
  await bagFactory.waitForDeployment()
  console.log('bagFactory deployed to:', await bagFactory.getAddress())

  // Deploy logic contracts with bridge address
  console.log('\n🧠 Deploying logic contracts...')

  const OperatorLogic = await ethers.getContractFactory('OperatorLogic')
  const operatorLogic = await OperatorLogic.deploy(await bridge.getAddress())
  await operatorLogic.waitForDeployment()
  console.log('OperatorLogic deployed to:', await operatorLogic.getAddress())

  const OperatorStorage = await ethers.getContractFactory('OperatorStorage')
  const operatorStorage = await OperatorStorage.deploy(await bridge.getAddress())
  await operatorStorage.waitForDeployment()
  console.log('OperatorStorage deployed to:', await operatorStorage.getAddress())

  // Deploy MinterStorage (for XFTs) contract
  const XFT = await ethers.getContractFactory('XFT')
  const xft = await XFT.deploy(
    'dexsta',
    'DEXSTA',
    'https://api.dexsta.com/metadata/',
    await bridge.getAddress()
  )
  await xft.waitForDeployment()
  console.log('xftStorage deployed to:', await xft.getAddress())

  const XFTLogic = await ethers.getContractFactory('xftLogic')
  const xftLogic = await XFTLogic.deploy(await bridge.getAddress())
  await xftLogic.waitForDeployment()
  console.log('xftLogic deployed to:', await xftLogic.getAddress())

  // Deploy xfttorage (for XFTs) contract
  const XFTStorage = await ethers.getContractFactory('XFTStorage')
  const xftStorage = await XFTStorage.deploy(await bridge.getAddress())
  await xftStorage.waitForDeployment()
  console.log('xftStorage deployed to:', await xftStorage.getAddress())

  // Deploy AMM contracts with bridge address
  console.log('\n🔄 Deploying AMM contracts...')

  const AMMFactory = await ethers.getContractFactory('AMMFactory')
  const ammFactory = await AMMFactory.deploy(await bridge.getAddress())
  await ammFactory.waitForDeployment()
  console.log('ammFactory deployed to:', await ammFactory.getAddress())

  const AMM = await ethers.getContractFactory('AMM')
  const amm = await AMM.deploy(await bridge.getAddress())
  await amm.waitForDeployment()
  console.log('amm deployed to:', await amm.getAddress())

  const AMMLogic = await ethers.getContractFactory('AMMLogic')
  const ammLogic = await AMMLogic.deploy(await bridge.getAddress())
  await ammLogic.waitForDeployment()
  console.log('ammLogic deployed to:', await ammLogic.getAddress())

  const AMMStorage = await ethers.getContractFactory('AMMStorage')
  const ammStorage = await AMMStorage.deploy(await bridge.getAddress())
  await ammStorage.waitForDeployment()
  console.log('ammStorage deployed to:', await ammStorage.getAddress())

  // Deploy DexstaFactory for simplified token launch
  const DexstaFactory = await ethers.getContractFactory(
    'contracts/amm/dexstaFactory.sol:DexstaFactory'
  )
  const dexstaFactory = await DexstaFactory.deploy(await bridge.getAddress())
  await dexstaFactory.waitForDeployment()
  console.log('DexstaFactory deployed to:', await dexstaFactory.getAddress())

  const TokenMetadata = await ethers.getContractFactory('TokenMetadata')
  const tokenMetadata = await TokenMetadata.deploy(await bridge.getAddress())
  await tokenMetadata.waitForDeployment()
  console.log('TokenMetadata deployed to:', await tokenMetadata.getAddress())

  /// Restore MarketStorage deployment
  const MarketStorage = await ethers.getContractFactory('MarketStorage')
  const marketStorage = await MarketStorage.deploy(await bridge.getAddress())
  await marketStorage.waitForDeployment()
  console.log('MarketStorage deployed to:', await marketStorage.getAddress())

  // Restore MarketLogic deployment
  const MarketLogic = await ethers.getContractFactory('MarketLogic')
  const marketLogic = await MarketLogic.deploy(await bridge.getAddress())
  await marketLogic.waitForDeployment()
  console.log('MarketLogic deployed to:', await marketLogic.getAddress())

  // NOW add all contract addresses to the bridge
  console.log('\n🔗 Adding all contract addresses to bridge...')

  // Initialize Bridge settings and pricing arrays first
  console.log('Initializing Bridge settings and pricing...')

  // Initialize settings array with default values (14 elements as per comments)
  //BigInt('3000000000000000000'), // settings[0] = mintFeelabel (3 SEI)
  const defaultSettings = [
    0, // settings[0] = mintFeelabel (3 SEI)
    0, // settings[1] = mintFeeToken
    250, // settings[2] = buyFeeSEIMarket
    250, // settings[3] = buyFeeDexstaMarket
    5000, // settings[4] = minimum trade amount for trade to count
    300, // settings[5] = max trade count
    3, // settings[6] = power level increase
    1, // settings[7] = power level decrease
    500, // settings[8] = loan service fee
    0, // settings[9] = dexstaLabel
    15, // settings[10] = defaulted loan power decrease
    0, // settings[11] = power boost xft id
    BigInt('600000000000000000000'), // settings[12] = maxLeaseAmount
    0, // settings[13] = open
    0, // settings[14] = pause status
    90, // settings[15] = tradeGameGoal
    0, // settings[16] = boost fee bps
    0, // settings[17] = mintGenerative
  ]

  await bridge.initializeBridge(defaultSettings)

  // Now add contract addresses with rate limiting protection
  console.log('Setting bridge contract addresses...')

  await bridge.setContract('appraiser', '0x0000000000000000000000000000000000000000')
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('operatorStorage', await operatorStorage.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('operatorLogic', await operatorLogic.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('xftStorage', await xftStorage.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('xftLogic', await xftLogic.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('xft', await xft.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('bank', await bank.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('bankStorage', await bankStorage.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('bankLogic', await bankLogic.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('gxftFactory', await gxftFactory.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('gxftMinter', await gxftMinter.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // await bridge.setContract("bagRegistry", await bagRegistry.getAddress());
  await bridge.setContract('bagFactory', await bagFactory.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('bagStorage', await bagStorage.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('bag', await bag.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('ammFactory', await ammFactory.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('amm', await amm.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('dexstaFactory', await dexstaFactory.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('ammLogic', await ammLogic.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('ammStorage', await ammStorage.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // await bridge.setContract('tokenLogic', await tokenLogic.getAddress())
  // await bridge.setContract('tokenStorage', await tokenStorage.getAddress())
  await bridge.setContract('marketStorage', await marketStorage.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('marketLogic', await marketLogic.getAddress())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await bridge.setContract('tokenMetadata', await tokenMetadata.getAddress())

  console.log('Bridge configuration completed successfully!')
  // await bridge.setContract('tokenVLPStorage', await tokenVLPStorage.getAddress())

  console.log('\n✅ All contracts deployed successfully!')
  console.log('\n📋 Deployment Summary:')
  console.log('bank:', await bank.getAddress())
  console.log('bridge:', await bridge.getAddress())
  console.log('amm:', await amm.getAddress())
  console.log('ammFactory:', await ammFactory.getAddress())
  console.log('ammLogic:', await ammLogic.getAddress())
  console.log('ammStorage:', await ammStorage.getAddress())
  console.log('bag:', await bag.getAddress())
  console.log('bagStorage:', await bagStorage.getAddress())
  console.log('bagFactory:', await bagFactory.getAddress())
  console.log('bankLogic:', await bankLogic.getAddress())
  console.log('bankStorage:', await bankStorage.getAddress())
  console.log('dexstaFactory:', await dexstaFactory.getAddress())
  console.log('gxftFactory:', await gxftFactory.getAddress())
  console.log('gxftMinter:', await gxftMinter.getAddress())
  console.log('marketLogic:', await marketLogic.getAddress())
  console.log('marketStorage:', await marketStorage.getAddress())
  console.log('xft:', await xft.getAddress())
  console.log('xftLogic:', await xftLogic.getAddress())
  console.log('xftStorage:', await xftStorage.getAddress())
  console.log('operatorLogic:', await operatorLogic.getAddress())
  console.log('operatorStorage:', await operatorStorage.getAddress())
  console.log('tokenMetadata:', await tokenMetadata.getAddress())

  // Save deployment addresses to a file for easy access
  const deploymentInfo = {
    bank: await bank.getAddress(),
    bridge: await bridge.getAddress(),
    operatorStorage: await operatorStorage.getAddress(),
    operatorLogic: await operatorLogic.getAddress(),
    bankStorage: await bankStorage.getAddress(),
    bankLogic: await bankLogic.getAddress(),
    gxftFactory: await gxftFactory.getAddress(),
    gxftMinter: await gxftMinter.getAddress(),
    bagFactory: await bagFactory.getAddress(),
    bag: await bag.getAddress(),
    bagStorage: await bagStorage.getAddress(),
    xft: await xft.getAddress(),
    xftLogic: await xftLogic.getAddress(),
    xftStorage: await xftStorage.getAddress(),
    ammFactory: await ammFactory.getAddress(),
    amm: await amm.getAddress(),
    ammLogic: await ammLogic.getAddress(),
    dexstaFactory: await dexstaFactory.getAddress(),
    ammStorage: await ammStorage.getAddress(),
    marketLogic: await marketLogic.getAddress(),
    marketStorage: await marketStorage.getAddress(),
    tokenMetadata: await tokenMetadata.getAddress(),
    network: hre.network.name,
    deployer: deployer.address,
  }

  fs.writeFileSync('./scripts/deployment.json', JSON.stringify(deploymentInfo, null, 2))
  console.log('\n💾 Deployment addresses saved to scripts/deployment.json')

  // Also update the centralized deployment config
  updateCentralizedConfig(deploymentInfo)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

const { ethers } = require('hardhat')

async function main() {
  console.log('🚀 Deploying ChallengeFactory only...')
  const [deployer] = await ethers.getSigners()
  console.log('📝 Deployer:', deployer.address)

  const balance = await deployer.getBalance()
  console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH')

  const ChallengeFactory = await ethers.getContractFactory('ChallengeFactory')
  const challengeFactory = await ChallengeFactory.deploy(deployer.address)
  await challengeFactory.deployed()
  console.log('✅ ChallengeFactory deployed at:', challengeFactory.address)

  // Verify config
  const platformFeeRate = await challengeFactory.platformFeeRate()
  const minimumEntryFee = await challengeFactory.minimumEntryFee()
  const feeRecipient = await challengeFactory.feeRecipient()
  console.log('Config:', {
    feeRecipient,
    platformFeeRate: platformFeeRate.toString(),
    minimumEntryFee: ethers.utils.formatEther(minimumEntryFee),
  })

  // Write deployment info
  const fs = require('fs')
  const path = require('path')
  const deploymentsDir = path.join(__dirname, '..', 'deployments')
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true })
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`)

  let existing = {}
  if (fs.existsSync(deploymentFile)) {
    try { existing = JSON.parse(fs.readFileSync(deploymentFile, 'utf8')) } catch {}
  }

  const info = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      ...(existing.contracts || {}),
      ChallengeFactory: {
        address: challengeFactory.address,
        deploymentTx: challengeFactory.deployTransaction.hash,
      },
    },
    deployedAt: new Date().toISOString(),
  }
  fs.writeFileSync(deploymentFile, JSON.stringify(info, null, 2))
  console.log('📄 Deployment saved to:', deploymentFile)
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Deploy failed:', err)
  process.exit(1)
})
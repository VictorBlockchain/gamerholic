const { ethers } = require('hardhat')

async function main() {
  console.log('🚀 Deploying TournamentDeployer and wiring TournamentFactory...')

  const [deployer] = await ethers.getSigners()
  console.log('📝 Deployer:', deployer.address)

  const bal = await deployer.getBalance()
  console.log('💰 Balance:', ethers.utils.formatEther(bal), 'ETH')

  // Prepare fee data and overrides to avoid estimateGas rate limits
  const feeData = await ethers.provider.getFeeData()
  const fallbackMaxFeeGwei = '50'
  const fallbackTipGwei = '1'
  const overrides = {
    maxFeePerGas: feeData.maxFeePerGas || ethers.utils.parseUnits(fallbackMaxFeeGwei, 'gwei'),
    maxPriorityFeePerGas:
      feeData.maxPriorityFeePerGas || ethers.utils.parseUnits(fallbackTipGwei, 'gwei'),
    gasLimit: 6_000_000,
  }

  console.log('⛽ Using overrides:', {
    maxFeePerGas: overrides.maxFeePerGas.toString(),
    maxPriorityFeePerGas: overrides.maxPriorityFeePerGas.toString(),
    gasLimit: overrides.gasLimit,
  })

  // Deploy TournamentDeployer with overrides
  console.log('\n📦 Deploying TournamentDeployer...')
  const TournamentDeployer = await ethers.getContractFactory('TournamentDeployer')
  const tournamentDeployer = await TournamentDeployer.deploy(overrides)
  await tournamentDeployer.deployed()
  console.log('✅ TournamentDeployer deployed at:', tournamentDeployer.address)

  // Persist deployment info
  const fs = require('fs')
  const path = require('path')
  const deploymentsDir = path.join(__dirname, '..', 'deployments')
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true })
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`)

  let existing = {}
  if (fs.existsSync(deploymentFile)) {
    try {
      existing = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
    } catch (e) {}
  }

  const info = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      ...(existing.contracts || {}),
      TournamentDeployer: {
        address: tournamentDeployer.address,
        deploymentTx: tournamentDeployer.deployTransaction.hash,
      },
    },
    deployedAt: new Date().toISOString(),
  }
  fs.writeFileSync(deploymentFile, JSON.stringify(info, null, 2))
  console.log('📄 Deployment saved to:', deploymentFile)

  // Wire the deployer into TournamentFactory if available
  const tfAddress = existing.contracts?.TournamentFactory?.address
  if (!tfAddress) {
    console.log('\n⚠️ TournamentFactory address not found in deployments file; skipping wiring step.')
    console.log('   Add TF address to the deployments JSON and rerun to wire it, or call setTournamentDeployer manually.')
    return
  }

  console.log('\n🔧 Setting TournamentDeployer on TournamentFactory:', tfAddress)
  const tournamentFactory = await ethers.getContractAt('TournamentFactory', tfAddress)
  const tx = await tournamentFactory.setTournamentDeployer(tournamentDeployer.address, overrides)
  await tx.wait()
  console.log('✅ TournamentDeployer configured on TournamentFactory')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Deploy failed:', err)
    process.exit(1)
  })
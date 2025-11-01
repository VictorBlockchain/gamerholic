const { ethers } = require('hardhat')

async function main() {
  console.log('🚀 Starting deployment...')

  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log('📝 Deploying contracts with account:', deployer.address)

  // Get account balance
  const balance = await deployer.getBalance()
  console.log('💰 Account balance:', ethers.utils.formatEther(balance), 'ETH')

  // Deploy ChallengeFactory
  console.log('\n📦 Deploying ChallengeFactory...')
  const ChallengeFactory = await ethers.getContractFactory('ChallengeFactory')

  // Use deployer as initial fee recipient
  const challengeFactory = await ChallengeFactory.deploy(deployer.address)
  await challengeFactory.deployed()

  console.log('✅ ChallengeFactory deployed to:', challengeFactory.address)
  console.log('🎯 Fee recipient set to:', deployer.address)

  // Deploy TournamentFactory
  console.log('\n📦 Deploying TournamentFactory...')
  const TournamentFactory = await ethers.getContractFactory('TournamentFactory')
  // TournamentFactory expects (feeRecipient, challengeFactory)
  const tournamentFactory = await TournamentFactory.deploy(deployer.address, challengeFactory.address)
  await tournamentFactory.deployed()
  console.log('✅ TournamentFactory deployed to:', tournamentFactory.address)

  // Deploy TournamentDeployer and configure on factory
  console.log('\n📦 Deploying TournamentDeployer...')
  const TournamentDeployer = await ethers.getContractFactory('TournamentDeployer')
  const tournamentDeployer = await TournamentDeployer.deploy()
  await tournamentDeployer.deployed()
  console.log('✅ TournamentDeployer deployed to:', tournamentDeployer.address)

  console.log('\n🔧 Setting TournamentDeployer on TournamentFactory...')
  const txSetDeployer = await tournamentFactory.setTournamentDeployer(tournamentDeployer.address)
  await txSetDeployer.wait()
  console.log('✅ TournamentDeployer configured on TournamentFactory')

  // Verify deployment
  console.log('\n🔍 Verifying deployment...')
  const feeRecipientCF = await challengeFactory.feeRecipient()
  const platformFeeRateCF = await challengeFactory.platformFeeRate()
  const minimumEntryFeeCF = await challengeFactory.minimumEntryFee()

  const feeRecipientTF = await tournamentFactory.feeRecipient()
  const platformFeeRateTF = await tournamentFactory.platformFeeRate()
  const minimumEntryFeeTF = await tournamentFactory.minimumEntryFee()

  console.log('ChallengeFactory:')
  console.log('  Fee recipient:', feeRecipientCF)
  console.log('  Platform fee rate:', platformFeeRateCF.toString(), 'basis points')
  console.log('  Minimum entry fee:', ethers.utils.formatEther(minimumEntryFeeCF), 'ETH')

  console.log('TournamentFactory:')
  console.log('  Fee recipient:', feeRecipientTF)
  console.log('  Platform fee rate:', platformFeeRateTF.toString(), 'basis points')
  console.log('  Minimum entry fee:', ethers.utils.formatEther(minimumEntryFeeTF), 'ETH')

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      ChallengeFactory: {
        address: challengeFactory.address,
        deploymentTx: challengeFactory.deployTransaction.hash,
      },
      TournamentFactory: {
        address: tournamentFactory.address,
        deploymentTx: tournamentFactory.deployTransaction.hash,
      },
      TournamentDeployer: {
        address: tournamentDeployer.address,
        deploymentTx: tournamentDeployer.deployTransaction.hash,
      },
    },
    deployedAt: new Date().toISOString(),
    config: {
      challengeFactory: {
        feeRecipient: feeRecipientCF,
        platformFeeRate: platformFeeRateCF.toString(),
        minimumEntryFee: minimumEntryFeeCF.toString(),
      },
      tournamentFactory: {
        feeRecipient: feeRecipientTF,
        platformFeeRate: platformFeeRateTF.toString(),
        minimumEntryFee: minimumEntryFeeTF.toString(),
      },
    },
  }

  // Write deployment info to file
  const fs = require('fs')
  const path = require('path')

  const deploymentsDir = path.join(__dirname, '..', 'deployments')
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true })
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`)
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2))

  console.log('\n📄 Deployment info saved to:', deploymentFile)

  // Create a test heads-up challenge to verify CF works
  console.log('\n🧪 Creating test heads-up challenge (CF)...')
  try {
    const entryFee = ethers.utils.parseEther('0.01')
    const fee = entryFee.mul(platformFeeRateCF).div(10000)
    const totalValue = entryFee.add(fee)

    const opponent = ethers.constants.AddressZero
    const payToken = ethers.constants.AddressZero

    const tx = await challengeFactory.createHeadsUpChallenge(
      entryFee,
      opponent,
      payToken,
      'Test Game',
      JSON.stringify({
        description: 'Test heads-up challenge',
        rules: 'First to 10 points wins',
      }),
      { value: totalValue }
    )

    const receipt = await tx.wait()
    const event = receipt.events && receipt.events.find((e) => e.event === 'ChallengeCreated')

    if (event) {
      console.log('✅ Test heads-up challenge created!')
      console.log('Challenge ID:', event.args.challengeId.toString())
      console.log('Challenge Contract:', event.args.challengeContract)
    } else {
      console.log('⚠️  ChallengeCreated event not found; check receipt:')
      console.log(receipt)
    }
  } catch (error) {
    console.log('⚠️  Test heads-up challenge creation failed:', error.message)
  }

  // Create a test tournament via TournamentFactory
  console.log('\n🧪 Creating test tournament (TF)...')
  try {
    const tEntryFee = ethers.utils.parseEther('0.005')
    const maxParticipants = 4
    const xftToJoin = 0
    const isFFA = false
    const payToken = ethers.constants.AddressZero

    const txT = await tournamentFactory.createTournament(
      tEntryFee,
      payToken,
      maxParticipants,
      xftToJoin,
      isFFA,
      'Valorant',
      JSON.stringify({ format: 'Single Elimination' })
    )
    const rcT = await txT.wait()
    const evT = rcT.events && rcT.events.find((e) => e.event === 'TournamentCreated')
    if (evT) {
      console.log('✅ Test tournament created!')
      // Event args: (creator, tournamentContract, entryFee, maxParticipants, isFFA, gameType)
      console.log('Tournament Contract:', evT.args.tournamentContract)
      console.log('Creator:', evT.args.creator)
      console.log('Game Type:', evT.args.gameType)
      console.log('Max Participants:', evT.args.maxParticipants.toString())
      console.log('Entry Fee:', ethers.utils.formatEther(evT.args.entryFee), 'ETH')
    } else {
      console.log('⚠️  TournamentCreated event not found; check receipt:')
      console.log(rcT)
    }
  } catch (error) {
    console.log('⚠️  Test tournament creation failed:', error.message)
  }

  console.log('\n🎉 Deployment completed successfully!')
  console.log('\n📋 Summary:')
  console.log('- Network:', hre.network.name)
  console.log('- ChallengeFactory:', challengeFactory.address)
  console.log('- TournamentFactory:', tournamentFactory.address)
  console.log('- Deployer:', deployer.address)
  console.log('- Gas used: Check transaction receipts')

  return {
    challengeFactory: challengeFactory.address,
    tournamentFactory: tournamentFactory.address,
    deployer: deployer.address,
    network: hre.network.name,
  }
}

// Handle errors
main()
  .then((result) => {
    console.log('\n✅ Deployment script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:')
    console.error(error)
    process.exit(1)
  })
const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

async function main() {
  console.log('🧪 Local validation on:', hre.network.name)
  const [deployer, alice] = await ethers.getSigners()

  // Load deployments
  const deploymentsDir = path.join(__dirname, '..', 'deployments')
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`)
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))

  const cfAddr = deployment.contracts?.ChallengeFactory?.address
  const tfAddr = deployment.contracts?.TournamentFactory?.address
  console.log('🏭 ChallengeFactory:', cfAddr)
  console.log('🏛️ TournamentFactory:', tfAddr)

  const factory = await ethers.getContractAt('ChallengeFactory', cfAddr)

  // Read config
  const feeRecipient = await factory.feeRecipient()
  const platformFeeRate = await factory.platformFeeRate()
  const minimumEntryFee = await factory.minimumEntryFee()
  console.log('Config:', {
    feeRecipient,
    platformFeeRate: platformFeeRate.toString(),
    minimumEntryFee: ethers.utils.formatEther(minimumEntryFee),
  })

  // Create heads-up challenge using current signature
  const entryFee = ethers.utils.parseEther('0.01')
  const fee = entryFee.mul(platformFeeRate).div(10000)
  const totalValue = entryFee.add(fee)
  const opponent = alice.address // specific opponent
  const payToken = ethers.constants.AddressZero // native

  console.log('\n➡️ createHeadsUpChallenge', {
    entryFee: ethers.utils.formatEther(entryFee),
    fee: ethers.utils.formatEther(fee),
  })

  const tx = await factory.createHeadsUpChallenge(
    entryFee,
    opponent,
    payToken,
    'Test Game',
    JSON.stringify({ rules: 'Best of 3' }),
    { value: entryFee }
  )
  const rc = await tx.wait()
  const ev = rc.events && rc.events.find((e) => e.event === 'ChallengeCreated')
  if (!ev) throw new Error('ChallengeCreated event not found')

  const challengeAddr = ev.args?.challengeContract || 'unknown'
  console.log('✅ Heads-up created:', { challengeAddr })

  // Join challenge as Alice
  console.log('\n➡️ joinChallenge by Alice', { value: ethers.utils.formatEther(entryFee) })
  const challenge = await ethers.getContractAt('Challenge', challengeAddr)
  await (await challenge.connect(alice).joinChallenge({ value: entryFee })).wait()
  const info = await challenge.getChallengeInfo()
  console.log('currentParticipants:', info.currentParticipants.toString())

  console.log('\n✅ Local validation completed')
}

main().catch((err) => {
  console.error('\n❌ Validation failed:', err)
  process.exit(1)
})
const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

async function loadDeployments() {
  const deploymentsDir = path.join(__dirname, '..', 'deployments')
  const file = path.join(deploymentsDir, `${hre.network.name}.json`)
  if (!fs.existsSync(file)) throw new Error(`Deployment file not found: ${file}`)
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const cf = data.contracts?.ChallengeFactory?.address
  if (!cf) throw new Error('ChallengeFactory address missing in deployment json')
  return { cfAddr: cf }
}

function formatEth(bn) {
  return ethers.utils.formatEther(bn)
}

async function main() {
  console.log('🧪 Challenge flows test on network:', hre.network.name)
  const { cfAddr } = await loadDeployments()
  const [creator, opponent, mod, bob] = await ethers.getSigners()
  console.log('Accounts:')
  console.log(' - creator:', creator.address)
  console.log(' - opponent:', opponent.address)
  console.log(' - mod:', mod.address)
  console.log(' - bob:', bob.address)

  const factory = await ethers.getContractAt('ChallengeFactory', cfAddr)
  console.log('🏭 ChallengeFactory:', factory.address)

  // Grant mod role to `mod` account so we can use resolveDispute
  try {
    console.log('\n➡️ Granting mod role to', mod.address)
    await (await factory.connect(creator).setMod(mod.address, true)).wait()
    console.log('✅ Mod granted')
  } catch (e) {
    console.log('⚠️ setMod failed or not permitted:', e.message)
  }

  // Read initial config
  const platformFeeRate = await factory.platformFeeRate()
  const minimumEntryFee = await factory.minimumEntryFee()
  console.log('Config:', {
    platformFeeRate: platformFeeRate.toString(),
    minimumEntryFee: formatEth(minimumEntryFee),
  })

  // 1) Create Heads-Up challenge (native token), opponent=Account #1
  const entryFee = ethers.utils.parseEther('0.01')
  const tournament = ethers.constants.AddressZero
  const payToken = ethers.constants.AddressZero
  const gameType = 'Rocket League'
  const metadata = JSON.stringify({ rules: 'Best of 3' })

  console.log('\n➡️ createHeadsUpChallenge (creator -> opponent)')
  const txCreate = await factory.connect(creator).createHeadsUpChallenge(
    entryFee,
    opponent.address,
    payToken,
    tournament,
    gameType,
    metadata,
    { value: entryFee }
  )
  const rcCreate = await txCreate.wait()
  const evCreate = rcCreate.events && rcCreate.events.find((e) => e.event === 'ChallengeCreated')
  if (!evCreate) throw new Error('ChallengeCreated event not found')
  const challengeAddr = evCreate.args.challengeContract
  console.log('✅ Challenge created at:', challengeAddr)

  const challenge = await ethers.getContractAt('Challenge', challengeAddr)
  const challengeFactoryAddr = await challenge.factory()
  console.log('Challenge.factory stored address:', challengeFactoryAddr)
  console.log('Matches deployed ChallengeFactory:', challengeFactoryAddr.toLowerCase() === factory.address.toLowerCase())
  const infoAfterCreate = await challenge.getChallengeInfo()
  console.log('Info after create:', {
    status: infoAfterCreate.status.toString(),
    entryFee: formatEth(infoAfterCreate.entryFee),
    currentParticipants: infoAfterCreate.currentParticipants.toString(),
    totalPrizePool: formatEth(infoAfterCreate.totalPrizePool),
  })

  // 2) Opponent joins
  console.log('\n➡️ joinChallenge (opponent) with entry fee')
  const txJoin = await challenge.connect(opponent).joinChallenge({ value: entryFee })
  await txJoin.wait()
  const infoAfterJoin = await challenge.getChallengeInfo()
  console.log('Info after join:', {
    status: infoAfterJoin.status.toString(),
    currentParticipants: infoAfterJoin.currentParticipants.toString(),
    totalPrizePool: formatEth(infoAfterJoin.totalPrizePool),
  })

  // 3) Creator submits score
  console.log('\n➡️ submitScore (creator reports 10-7)')
  const txScore = await challenge.connect(creator).submitScore(10, 7)
  await txScore.wait()
  const infoAfterScore = await challenge.getChallengeInfo()
  console.log('Info after submitScore:', {
    status: infoAfterScore.status.toString(),
    player1score: infoAfterScore.player1score.toString(),
    player2score: infoAfterScore.player2score.toString(),
    scoreReporter: infoAfterScore.scoreReporter,
  })
  const isCh1PreConfirm = await factory.getIsChallengeContract(challengeAddr)
  console.log('Factory recognizes challenge #1 before confirm:', isCh1PreConfirm)

  // 4) Opponent confirms score
  console.log('\n➡️ confirmScore (opponent)')
  const balBeforeWinner = await ethers.provider.getBalance(creator.address)
  const txConfirm = await challenge.connect(opponent).confirmScore(opponent.address)
  await txConfirm.wait()
  const infoAfterConfirm = await challenge.getChallengeInfo()
  const winnerAddr = await challenge.winner()
  const balAfterWinner = await ethers.provider.getBalance(winnerAddr)
  console.log('Info after confirm:', {
    status: infoAfterConfirm.status.toString(),
    winner: winnerAddr,
    fundsDistributed: await challenge.fundsDistributed(),
  })
  console.log('Winner balance delta (approx):', formatEth(balAfterWinner.sub(balBeforeWinner)))

  // Sanity: factory should still recognize this challenge
  const isCh1 = await factory.getIsChallengeContract(challengeAddr)
  console.log('Factory recognizes challenge #1:', isCh1)

  // 5) Create a second challenge and cancel before opponent joins
  const entryFee2 = ethers.utils.parseEther('0.005')
  console.log('\n➡️ createHeadsUpChallenge #2 then cancel (creator cancels)')
  const txCreate2 = await factory.connect(creator).createHeadsUpChallenge(
    entryFee2,
    bob.address,
    payToken,
    tournament,
    'Valorant',
    JSON.stringify({ note: 'cancel path' }),
    { value: entryFee2 }
  )
  const rcCreate2 = await txCreate2.wait()
  const evCreate2 = rcCreate2.events && rcCreate2.events.find((e) => e.event === 'ChallengeCreated')
  if (!evCreate2) throw new Error('ChallengeCreated event not found (second)')
  const challenge2Addr = evCreate2.args.challengeContract
  console.log('✅ Challenge #2 created at:', challenge2Addr)
  const challenge2 = await ethers.getContractAt('Challenge', challenge2Addr)
  const isCh2Before = await factory.getIsChallengeContract(challenge2Addr)
  console.log('Factory recognizes challenge #2 before cancel:', isCh2Before)
  const txCancel = await challenge2.connect(creator).cancelChallenge('No show')
  await txCancel.wait()
  const infoAfterCancel = await challenge2.getChallengeInfo()
  console.log('Info after cancel:', { status: infoAfterCancel.status.toString() })
  const isCh2After = await factory.getIsChallengeContract(challenge2Addr)
  console.log('Factory recognizes challenge #2 after cancel:', isCh2After)

  console.log('\n✅ Challenge flows test completed')
}

main().catch((err) => {
  console.error('\n❌ Challenge flows test failed:', err)
  process.exit(1)
})

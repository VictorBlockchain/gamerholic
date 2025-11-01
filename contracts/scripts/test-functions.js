const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

async function loadFactory() {
  const deploymentsDir = path.join(__dirname, '..', 'deployments')
  const file = path.join(deploymentsDir, `${hre.network.name}.json`)
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  return data.contracts.ChallengeFactory.address
}

async function logInfo(info, label = 'ChallengeInfo') {
  console.log(`\n=== ${label} ===`)
  console.log('id:', info.id.toString())
  console.log('type:', info.challengeType.toString())
  console.log('status:', info.status.toString())
  console.log('creator:', info.creator)
  console.log('entryFee:', ethers.utils.formatEther(info.entryFee))
  console.log('totalPrizePool:', ethers.utils.formatEther(info.totalPrizePool))
  console.log('createdAt:', info.createdAt.toString())
  console.log('maxParticipants:', info.maxParticipants.toString())
  console.log('currentParticipants:', info.currentParticipants.toString())
  console.log('xftToJoin:', info.xftToJoin.toString())
  console.log('gameType:', info.gameType)
  console.log('metadata:', info.metadata)
}

async function main() {
  console.log('🧪 Starting terminal tests on:', hre.network.name)
  const [owner, alice, bob, carol] = await ethers.getSigners()
  const factoryAddr = await loadFactory()
  const factory = await ethers.getContractAt('ChallengeFactory', factoryAddr)
  console.log('🏭 Factory:', factory.address)

  // Read config
  const feeRecipient = await factory.feeRecipient()
  const platformFeeRate = await factory.platformFeeRate()
  const minimumEntryFee = await factory.minimumEntryFee()
  console.log('Config:', {
    feeRecipient,
    platformFeeRate: platformFeeRate.toString(),
    minimumEntryFee: ethers.utils.formatEther(minimumEntryFee),
  })

  // Create heads-up challenge
  const entryFee = ethers.utils.parseEther('0.01')
  const fee = entryFee.mul(platformFeeRate).div(10000)
  const totalValue = entryFee.add(fee)
  console.log('\n➡️ createHeadsUpChallenge', {
    entryFee: ethers.utils.formatEther(entryFee),
    fee: ethers.utils.formatEther(fee),
  })
  const txHU = await factory.createHeadsUpChallenge(
    entryFee,
    'Rocket League',
    JSON.stringify({ rules: 'Best of 3' }),
    { value: totalValue }
  )
  const rcHU = await txHU.wait()
  const evHU = rcHU.events && rcHU.events.find((e) => e.event === 'ChallengeCreated')
  if (!evHU) throw new Error('ChallengeCreated event not found for heads-up')
  const headUpId = evHU.args.challengeId.toString()
  const headUpAddr = evHU.args.challengeContract
  console.log('✅ Heads-up created:', { headUpId, headUpAddr })
  const headUp = await ethers.getContractAt('Challenge', headUpAddr)

  // Read info
  const infoHU = await headUp.getChallengeInfo()
  await logInfo(infoHU, 'Heads-up Info')

  // Join heads-up as second player
  console.log('\n➡️ joinChallenge (heads-up) by Alice', {
    value: ethers.utils.formatEther(entryFee),
  })
  await (await factory.connect(alice).joinChallenge(headUpId, { value: entryFee })).wait()
  const infoHU2 = await headUp.getChallengeInfo()
  console.log('currentParticipants after join:', infoHU2.currentParticipants.toString())

  // Create tournament
  const tEntry = ethers.utils.parseEther('0.005')
  console.log('\n➡️ createTournamentChallenge', {
    tEntry: ethers.utils.formatEther(tEntry),
    maxParticipants: 4,
  })
  const txT = await factory.createTournamentChallenge(
    tEntry,
    4,
    0,
    'Valorant',
    JSON.stringify({ format: 'Single Elimination' })
  )
  const rcT = await txT.wait()
  const evT = rcT.events && rcT.events.find((e) => e.event === 'ChallengeCreated')
  if (!evT) throw new Error('ChallengeCreated event not found for tournament')
  const tournamentId = evT.args.challengeId.toString()
  const tournamentAddr = evT.args.challengeContract
  console.log('✅ Tournament created:', { tournamentId, tournamentAddr })
  const tournament = await ethers.getContractAt('Challenge', tournamentAddr)
  const infoT = await tournament.getChallengeInfo()
  await logInfo(infoT, 'Tournament Info')

  // Join tournament players (no fee to factory creator)
  console.log('\n➡️ joinChallenge (tournament) by Alice & Bob')
  await (await factory.connect(alice).joinChallenge(tournamentId, { value: tEntry })).wait()
  await (await factory.connect(bob).joinChallenge(tournamentId, { value: tEntry })).wait()
  const infoT2 = await tournament.getChallengeInfo()
  console.log('currentParticipants after joins:', infoT2.currentParticipants.toString())

  // Factory getters
  console.log('\n➡️ Factory getters')
  console.log('getChallengeContract(headUpId):', await factory.getChallengeContract(headUpId))
  const fromFactoryHU = await factory.getChallenge(headUpId)
  await logInfo(fromFactoryHU, 'Factory.getChallenge (HU)')
  console.log(
    'creatorChallenges(owner):',
    (await factory.getCreatorChallenges(owner.address)).map((x) => x.toString())
  )
  console.log(
    'participantChallenges(alice):',
    (await factory.getParticipantChallenges(alice.address)).map((x) => x.toString())
  )
  console.log(
    'allChallenges:',
    (await factory.getAllChallenges()).map((x) => x.toString())
  )
  console.log('challengeMetadata(headUpId):', await factory.getChallengeMetadata(headUpId))
  console.log(
    'multipleMetadata:',
    await factory.getMultipleChallengeMetadata([headUpId, tournamentId])
  )
  const [active, totalActive] = await factory.getActiveChallenges(0, 10)
  console.log('activeChallenges count:', active.length, 'totalActive:', totalActive.toString())

  // Admin updates (owner)
  console.log('\n➡️ Admin updates')
  await (await factory.updatePlatformFeeRate(300)).wait()
  await (await factory.updateFeeRecipient(alice.address)).wait()
  await (await factory.updateMinimumEntryFee(ethers.utils.parseEther('0.002'))).wait()
  console.log('updated feeRecipient:', await factory.feeRecipient())
  console.log('updated platformFeeRate:', (await factory.platformFeeRate()).toString())
  console.log('updated minimumEntryFee:', ethers.utils.formatEther(await factory.minimumEntryFee()))

  // XFT entries (no ERC1155 configured; test factory storage)
  console.log('\n➡️ XFT entry limits (factory storage)')
  await (await factory.setXFTToJoinEntryCount(1234, 2)).wait()
  console.log('xftToJoinEntryCount[1234]:', (await factory.xftToJoinEntryCount(1234)).toString())

  console.log('\n✅ Terminal tests completed')
}

main().catch((err) => {
  console.error('\n❌ Terminal tests failed:', err)
  process.exit(1)
})

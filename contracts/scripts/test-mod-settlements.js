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

async function assertEq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg} | expected=${expected} actual=${actual}`)
  }
}

function assertBnEq(actualBn, expectedBn, msg) {
  if (!actualBn.eq(expectedBn)) {
    throw new Error(
      `${msg} | expected=${expectedBn.toString()} actual=${actualBn.toString()}`
    )
  }
}

async function getInfo(challenge) {
  const info = await challenge.getChallengeInfo()
  return {
    status: info.status.toString(),
    entryFee: formatEth(info.entryFee),
    currentParticipants: info.currentParticipants.toString(),
    totalPrizePool: formatEth(info.totalPrizePool),
    player1score: info.player1score?.toString?.() ?? '0',
    player2score: info.player2score?.toString?.() ?? '0',
    scoreReporter: info.scoreReporter,
    contractBalance: formatEth(info.contractBalance || 0),
  }
}

async function main() {
  console.log('🧪 Mod settlements test on network:', hre.network.name)
  const { cfAddr } = await loadDeployments()
  const [deployer, player1, player2, mod] = await ethers.getSigners()
  console.log('Accounts:')
  console.log(' - deployer:', deployer.address)
  console.log(' - player1 (creator):', player1.address)
  console.log(' - player2 (opponent):', player2.address)
  console.log(' - mod:', mod.address)

  const factory = await ethers.getContractAt('ChallengeFactory', cfAddr)
  console.log('🏭 ChallengeFactory:', factory.address)

  // Grant mod role to `mod` account
  console.log('\n➡️ Granting mod role to', mod.address)
  await (await factory.connect(deployer).setMod(mod.address, true)).wait()
  const isMod = await factory.getMod(mod.address)
  console.log('isMod(mod):', isMod)

  // Read config
  const platformFeeRate = await factory.platformFeeRate()
  const minimumEntryFee = await factory.minimumEntryFee()
  const feeRecipient = await factory.feeRecipient()
  console.log('Config:', {
    platformFeeRate: platformFeeRate.toString(),
    minimumEntryFee: formatEth(minimumEntryFee),
    feeRecipient,
  })

  // ---------- Case A: Mod confirms score ----------
  console.log('\n🧩 Case A: Mod confirms score')
  const entryFeeA = ethers.utils.parseEther('0.02')
  const tournament = ethers.constants.AddressZero
  const payToken = ethers.constants.AddressZero
  const txCreateA = await factory.connect(player1).createHeadsUpChallenge(
    entryFeeA,
    player2.address,
    payToken,
    tournament,
    'Rocket League',
    JSON.stringify({ rules: 'Bo3' }),
    { value: entryFeeA }
  )
  const rcCreateA = await txCreateA.wait()
  const evCreateA = rcCreateA.events && rcCreateA.events.find((e) => e.event === 'ChallengeCreated')
  if (!evCreateA) throw new Error('ChallengeCreated event not found (Case A)')
  const chAAddr = evCreateA.args.challengeContract
  const chA = await ethers.getContractAt('Challenge', chAAddr)
  console.log('Challenge A:', chAAddr)

  console.log('➡️ joinChallenge (player2)')
  await (await chA.connect(player2).joinChallenge({ value: entryFeeA })).wait()
  const infoAJoin = await getInfo(chA)
  console.log('Info after join:', infoAJoin)
  await assertEq(infoAJoin.status, '2', 'Status should be ACCEPTED after join')

  console.log('➡️ submitScore (player1 reports 5-3)')
  await (await chA.connect(player1).submitScore(5, 3)).wait()
  const infoAScore = await getInfo(chA)
  console.log('Info after score:', infoAScore)
  await assertEq(infoAScore.status, '3', 'Status should be SCORE_REPORTED after submit')

  console.log('➡️ confirmScore by mod')
  const balBeforeWinnerA = await ethers.provider.getBalance(player1.address)
  const balBeforeFeeRecA = await ethers.provider.getBalance(feeRecipient)
  // expected amounts
  const perPlayerFee = entryFeeA.mul(platformFeeRate).div(10000)
  const expectedPlatformFeeAmount = perPlayerFee.mul(2)
  const expectedPrize = entryFeeA.mul(2).sub(expectedPlatformFeeAmount)
  await (await chA.connect(mod).confirmScore(mod.address)).wait()
  const infoAConfirm = await getInfo(chA)
  const winnerA = await chA.winner()
  const fundsDistributedA = await chA.fundsDistributed()
  const balAfterWinnerA = await ethers.provider.getBalance(winnerA)
  const balAfterFeeRecA = await ethers.provider.getBalance(feeRecipient)
  console.log('Info after mod confirm:', infoAConfirm)
  console.log('winner:', winnerA)
  console.log('fundsDistributed:', fundsDistributedA)
  console.log('Winner balance delta (approx):', formatEth(balAfterWinnerA.sub(balBeforeWinnerA)))
  await assertEq(infoAConfirm.status, '4', 'Status should be SCORE_CONFIRMED after mod confirm')
  if (!fundsDistributedA) throw new Error('Funds should be distributed after mod confirms')
  // exact payout checks (recipient does not pay gas in this tx; winner is not sender)
  assertBnEq(balAfterFeeRecA.sub(balBeforeFeeRecA), expectedPlatformFeeAmount, 'Platform fee recipient payout mismatch')
  assertBnEq(balAfterWinnerA.sub(balBeforeWinnerA), expectedPrize, 'Winner prize payout mismatch')

  // ---------- Case B: Dispute while ACTIVE then refund ----------
  console.log('\n🧩 Case B: Dispute while ACTIVE then refund')
  const entryFeeB = ethers.utils.parseEther('0.015')
  const txCreateB = await factory.connect(player1).createHeadsUpChallenge(
    entryFeeB,
    player2.address,
    payToken,
    tournament,
    'Valorant',
    JSON.stringify({ note: 'no show case' }),
    { value: entryFeeB }
  )
  const rcCreateB = await txCreateB.wait()
  const evCreateB = rcCreateB.events && rcCreateB.events.find((e) => e.event === 'ChallengeCreated')
  if (!evCreateB) throw new Error('ChallengeCreated event not found (Case B)')
  const chBAddr = evCreateB.args.challengeContract
  const chB = await ethers.getContractAt('Challenge', chBAddr)
  console.log('Challenge B:', chBAddr)

  const infoBCreate = await getInfo(chB)
  console.log('Info after create:', infoBCreate)
  await assertEq(infoBCreate.status, '1', 'Status should be ACTIVE after create')

  console.log('➡️ disputeChallenge by player1 (ACTIVE state)')
  await (await chB.connect(player1).disputeChallenge('Opponent no-show')).wait()
  const infoBAfterDispute = await getInfo(chB)
  console.log('Info after dispute:', infoBAfterDispute)
  await assertEq(infoBAfterDispute.status, '5', 'Status should be DISPUTED after dispute')

  console.log('➡️ resolveDispute(true) by mod (refund participants)')
  await (await chB.connect(mod).resolveDispute(true)).wait()
  const infoBAfterResolve = await getInfo(chB)
  console.log('Info after resolve (refund):', infoBAfterResolve)
  await assertEq(infoBAfterResolve.status, '0', 'Status should be CANCELLED after refund resolve')
  if (infoBAfterResolve.contractBalance !== '0.0') {
    console.log('⚠️ Contract balance after refund is not zero:', infoBAfterResolve.contractBalance)
  }

  // ---------- Case C: Dispute after SCORE_CONFIRMED then resolve(false) ----------
  console.log('\n🧩 Case C: Dispute after SCORE_CONFIRMED then resolve(false)')
  const entryFeeC = ethers.utils.parseEther('0.01')
  const txCreateC = await factory.connect(player1).createHeadsUpChallenge(
    entryFeeC,
    player2.address,
    payToken,
    tournament,
    'CS2',
    JSON.stringify({ note: 'post-settlement dispute' }),
    { value: entryFeeC }
  )
  const rcCreateC = await txCreateC.wait()
  const evCreateC = rcCreateC.events && rcCreateC.events.find((e) => e.event === 'ChallengeCreated')
  if (!evCreateC) throw new Error('ChallengeCreated event not found (Case C)')
  const chCAddr = evCreateC.args.challengeContract
  const chC = await ethers.getContractAt('Challenge', chCAddr)
  console.log('Challenge C:', chCAddr)

  console.log('➡️ joinChallenge (player2)')
  await (await chC.connect(player2).joinChallenge({ value: entryFeeC })).wait()
  console.log('➡️ submitScore (player1 reports 8-4)')
  await (await chC.connect(player1).submitScore(8, 4)).wait()
  console.log('➡️ confirmScore (player2) to settle and distribute')
  await (await chC.connect(player2).confirmScore(player2.address)).wait()
  const infoCAfterConfirm = await getInfo(chC)
  const winnerC = await chC.winner()
  const fundsDistributedC = await chC.fundsDistributed()
  console.log('Info after confirmed settlement:', infoCAfterConfirm)
  console.log('winnerC:', winnerC, 'fundsDistributedC:', fundsDistributedC)
  await assertEq(infoCAfterConfirm.status, '4', 'Status should be SCORE_CONFIRMED after settle')
  if (!fundsDistributedC) throw new Error('Funds should be distributed after settlement')

  console.log('➡️ disputeChallenge (player2) after settlement')
  await (await chC.connect(player2).disputeChallenge('Dispute after settlement')).wait()
  const infoCAfterDispute = await getInfo(chC)
  console.log('Info after dispute:', infoCAfterDispute)
  await assertEq(infoCAfterDispute.status, '5', 'Status should be DISPUTED after post-settlement dispute')

  console.log('➡️ resolveDispute(false) by mod (no refund, keep outcome)')
  await (await chC.connect(mod).resolveDispute(false)).wait()
  const infoCAfterResolve = await getInfo(chC)
  const fundsDistributedC2 = await chC.fundsDistributed()
  console.log('Info after resolve(false):', infoCAfterResolve)
  await assertEq(infoCAfterResolve.status, '4', 'Status should be SCORE_CONFIRMED after resolve(false)')
  if (!fundsDistributedC2) throw new Error('Funds should remain distributed after resolve(false)')

  console.log('\n✅ Mod settlements test completed successfully')
}

main().catch((err) => {
  console.error('\n❌ Mod settlements test failed:', err)
  process.exit(1)
})
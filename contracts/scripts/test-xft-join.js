const { ethers } = require('hardhat')

async function main() {
  console.log('🧪 Testing XFT-required tournament join flow...')

  const [deployer, creator, player] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)
  console.log('Creator:', creator.address)
  console.log('Player:', player.address)

  // Deploy ChallengeFactory
  const ChallengeFactory = await ethers.getContractFactory('ChallengeFactory')
  const cf = await ChallengeFactory.deploy(deployer.address)
  await cf.deployed()
  console.log('ChallengeFactory:', cf.address)

  // Deploy TournamentFactory
  const TournamentFactory = await ethers.getContractFactory('TournamentFactory')
  const tf = await TournamentFactory.deploy(deployer.address, cf.address)
  await tf.deployed()
  console.log('TournamentFactory:', tf.address)

  // Deploy TournamentDeployer and wire it
  const TournamentDeployer = await ethers.getContractFactory('TournamentDeployer')
  const td = await TournamentDeployer.deploy()
  await td.deployed()
  await (await tf.setTournamentDeployer(td.address)).wait()
  console.log('TournamentDeployer:', td.address)

  // Deploy ERC1155 XFT and mint player token
  const TestXFT1155 = await ethers.getContractFactory('TestXFT1155')
  const xft = await TestXFT1155.deploy()
  await xft.deployed()
  const xftId = 1234
  await (await xft.connect(deployer).mint(player.address, xftId, 1, '0x')).wait()
  console.log('TestXFT1155:', xft.address, 'minted id', xftId, 'to player')

  // Configure XFT entry count = 3 and set contract
  await (await tf.setXFTToJoinEntryCount(xftId, xft.address, 3)).wait()
  const setCount = await tf.getXFTToJoinEntryCount(xftId)
  console.log('Configured entry count for', xftId, '=>', setCount.toString())

  const [initialCount, initialBalance, initialExpired] = await tf.getPlayerXFTToJoinEntryCount(player.address, xftId)
  console.log('Initial player state:', {
    count: initialCount.toString(), balance: initialBalance.toString(), expired: initialExpired,
  })

  // Helper to create a tournament requiring this XFT
  const entryFee = ethers.utils.parseEther('0.01')
  const maxParticipants = 2
  async function createTournament() {
    const tx = await tf
      .connect(creator)
      .createTournament(entryFee, ethers.constants.AddressZero, maxParticipants, xftId, false, 'Game', 'meta')
    const rc = await tx.wait()
    const evt = rc.events.find((e) => e.event === 'TournamentCreated')
    const taddr = evt.args.tournamentContract
    return await (await ethers.getContractFactory('Tournament')).attach(taddr)
  }

  // Join 3 tournaments; fourth should revert Expired
  const t1 = await createTournament()
  await (await t1.connect(player).joinTournament({ value: entryFee })).wait()
  console.log('Joined t1')

  const t2 = await createTournament()
  await (await t2.connect(player).joinTournament({ value: entryFee })).wait()
  console.log('Joined t2')

  const t3 = await createTournament()
  await (await t3.connect(player).joinTournament({ value: entryFee })).wait()
  console.log('Joined t3')

  const [count3, balance3, expired3] = await tf.getPlayerXFTToJoinEntryCount(player.address, xftId)
  console.log('After 3 joins: count', count3.toString(), 'balance', balance3.toString(), 'expired', expired3)

  const t4 = await createTournament()
  try {
    await t4.connect(player).joinTournament({ value: entryFee })
    console.error('Expected revert, but join succeeded')
  } catch (err) {
    console.log('Fourth join reverted as expected:', err.message)
  }

  console.log('✅ XFT join test completed')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
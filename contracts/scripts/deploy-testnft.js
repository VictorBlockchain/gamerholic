const { ethers } = require('hardhat')

async function main() {
  console.log('🚀 Deploying TestNFT (ERC721)...')

  const [deployer] = await ethers.getSigners()
  console.log('🧑‍💻 Deployer:', deployer.address)

  const TestNFT = await ethers.getContractFactory('TestNFT')
  const nft = await TestNFT.deploy()
  await nft.deployed()

  console.log('✅ TestNFT deployed at:', nft.address)

  // Optionally mint a sample token to the deployer
  const sampleTokenId = 1234
  const mintTx = await nft.mint(deployer.address, sampleTokenId)
  await mintTx.wait()
  console.log(`🎟️  Minted tokenId ${sampleTokenId} to ${deployer.address}`)

  // Persist deployment info alongside existing deployments file
  const fs = require('fs')
  const path = require('path')
  const deploymentsDir = path.join(__dirname, '..', 'deployments')
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true })
  }

  const networkName = hre.network.name
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`)
  let data = {}
  if (fs.existsSync(deploymentFile)) {
    try {
      data = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
    } catch (e) {
      console.warn('⚠️  Could not parse existing deployments file, will overwrite')
    }
  }

  data.contracts = data.contracts || {}
  data.contracts.TestNFT = {
    address: nft.address,
    deploymentTx: nft.deployTransaction.hash,
  }
  data.deployedAt = new Date().toISOString()

  fs.writeFileSync(deploymentFile, JSON.stringify(data, null, 2))
  console.log('📄 Deployment info saved to:', deploymentFile)
}

main()
  .then(() => {
    console.log('\n✅ TestNFT deployment completed')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ TestNFT deployment failed')
    console.error(err)
    process.exit(1)
  })
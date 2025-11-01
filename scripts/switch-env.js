#!/usr/bin/env node

/**
 * Enhanced script to switch between testnet, local, and mainnet environments
 * Integrates with the existing deployment configuration system
 * Usage: node scripts/switch-env.js [testnet|local|mainnet|status]
 */

const fs = require('fs')
const path = require('path')

const envFile = path.join(__dirname, '..', '.env.local')
const deploymentConfigPath = path.join(__dirname, '..', 'lib', 'config', 'deployment.ts')

// Environment configurations based on deployment.ts
const ENVIRONMENT_CONFIGS = {
  testnet: {
    name: 'Sei Testnet',
    chainId: 713715,
    rpcUrl: 'https://evm-rpc-testnet.sei-apis.com',
    blockExplorer: 'https://seitrace.com',
    description: '🌐 Using Sei testnet deployment',
  },
  mainnet: {
    name: 'Sei Mainnet',
    chainId: 1329,
    rpcUrl: 'https://evm-rpc.sei-apis.com',
    blockExplorer: 'https://seitrace.com',
    description: '🚀 Using Sei mainnet deployment',
  },
  local: {
    name: 'Hardhat Local',
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
    description: '🏠 Using Hardhat local deployment',
  },
}

function getCurrentEnvironment() {
  try {
    if (!fs.existsSync(envFile)) {
      return null
    }

    const envContent = fs.readFileSync(envFile, 'utf8')
    const match = envContent.match(/NEXT_PUBLIC_DEPLOYMENT_ENV=(.+)/)
    return match ? match[1].trim() : null
  } catch (error) {
    console.error('❌ Error reading current environment:', error.message)
    return null
  }
}

function showStatus() {
  const currentEnv = getCurrentEnvironment()

  console.log('🔍 Environment Status')
  console.log('='.repeat(50))

  if (!currentEnv) {
    console.log('❌ No environment set (defaulting to testnet)')
    console.log('💡 Run: node scripts/switch-env.js testnet')
    return
  }

  const config = ENVIRONMENT_CONFIGS[currentEnv]
  if (!config) {
    console.log(`❌ Unknown environment: ${currentEnv}`)
    return
  }

  console.log(`📍 Current Environment: ${currentEnv}`)
  console.log(`📛 Network Name: ${config.name}`)
  console.log(`🔗 Chain ID: ${config.chainId}`)
  console.log(`🌐 RPC URL: ${config.rpcUrl}`)
  console.log(`🔍 Block Explorer: ${config.blockExplorer}`)
  console.log('')
  console.log('Available environments:')
  Object.keys(ENVIRONMENT_CONFIGS).forEach((env) => {
    const indicator = env === currentEnv ? '👉' : '  '
    console.log(`${indicator} ${env} - ${ENVIRONMENT_CONFIGS[env].name}`)
  })
}

function validateEnvironment(targetEnv) {
  const validEnvs = Object.keys(ENVIRONMENT_CONFIGS)
  if (!validEnvs.includes(targetEnv)) {
    console.error(`❌ Invalid environment: ${targetEnv}`)
    console.error(`Valid options: ${validEnvs.join(', ')}`)
    return false
  }
  return true
}

function backupEnvFile() {
  if (fs.existsSync(envFile)) {
    const backupFile = `${envFile}.backup.${Date.now()}`
    try {
      fs.copyFileSync(envFile, backupFile)
      console.log(`💾 Backup created: ${path.basename(backupFile)}`)
      return backupFile
    } catch (error) {
      console.warn('⚠️  Could not create backup:', error.message)
    }
  }
  return null
}

function switchEnvironment(targetEnv) {
  if (!validateEnvironment(targetEnv)) {
    process.exit(1)
  }

  const currentEnv = getCurrentEnvironment()
  if (currentEnv === targetEnv) {
    console.log(`✅ Already using ${targetEnv} environment`)
    showStatus()
    return
  }

  try {
    // Create backup
    backupEnvFile()

    // Read current .env.local
    let envContent = ''
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, 'utf8')
    }

    // Remove existing NEXT_PUBLIC_DEPLOYMENT_ENV line
    envContent = envContent.replace(/NEXT_PUBLIC_DEPLOYMENT_ENV=.*\n?/g, '')

    // Ensure content ends with newline if it has content
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n'
    }

    // Add new environment setting
    envContent += `NEXT_PUBLIC_DEPLOYMENT_ENV=${targetEnv}\n`

    // Write back to file
    fs.writeFileSync(envFile, envContent)

    const config = ENVIRONMENT_CONFIGS[targetEnv]
    console.log(`✅ Switched to ${targetEnv} environment`)
    console.log(`📝 Updated ${envFile}`)
    console.log(config.description)
    console.log(`🔗 Chain ID: ${config.chainId}`)
    console.log(`🌐 RPC URL: ${config.rpcUrl}`)
    console.log('')
    console.log('🔄 Restart your development server to apply changes')

    if (targetEnv === 'local') {
      console.log('💡 Make sure your Hardhat node is running: npx hardhat node')
    }
  } catch (error) {
    console.error('❌ Error switching environment:', error.message)
    process.exit(1)
  }
}

// Get target environment from command line arguments
const targetEnv = process.argv[2]

if (!targetEnv) {
  console.log('🔧 Environment Switcher')
  console.log('='.repeat(50))
  console.log('Usage: node scripts/switch-env.js [testnet|local|mainnet|status]')
  console.log('')
  console.log('Commands:')
  console.log('  testnet  # Switch to Sei testnet')
  console.log('  local    # Switch to Hardhat local')
  console.log('  mainnet  # Switch to Sei mainnet')
  console.log('  status   # Show current environment status')
  console.log('')
  showStatus()
  process.exit(1)
}

if (targetEnv === 'status') {
  showStatus()
} else {
  switchEnvironment(targetEnv)
}

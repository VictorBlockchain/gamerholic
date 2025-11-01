# Holic Smart Contracts

This directory contains the smart contracts for the Holic gaming platform, enabling decentralized challenge and tournament management with secure fund escrow and automated payouts.

## 📋 Overview

The smart contract system consists of two main contracts:

- **ChallengeFactory**: Factory contract that creates and manages Challenge instances
- **Challenge**: Individual contract instances that handle fund escrow, score confirmation, and payouts for specific challenges or tournaments

## 🏗️ Architecture

### ChallengeFactory Contract
- Creates new Challenge contract instances
- Manages platform-wide settings (fees, minimums)
- Tracks all challenges and provides discovery
- Handles platform fee collection

### Challenge Contract
- Manages individual challenge/tournament lifecycle
- Handles participant registration and fund escrow
- Implements score submission and confirmation system
- Automates winner determination and fund distribution
- Provides dispute resolution mechanisms

## 🎮 Challenge Types

### Heads-Up Challenges
- 1v1 competitive matches
- Winner determined by score confirmation between players
- Immediate payout upon score agreement

### Tournament Challenges
- Multi-player tournaments (2-64 participants)
- Host-managed winner confirmation
- Prize pool distribution to tournament winner

## 💰 Fund Management

### Entry Fees
- Configurable minimum entry fee (default: 0.001 ETH)
- All entry fees held in escrow until challenge completion
- Platform fee deducted from prize pool (default: 2.5%)

### Payout System
- **Heads-Up**: Automatic payout upon mutual score confirmation
- **Tournament**: Payout triggered by host winner confirmation
- **Cancellation**: Full refunds to all participants
- **Dispute**: Manual resolution by contract owner

## 🔧 Setup and Deployment

### Prerequisites
```bash
cd contracts
npm install
```

### Compilation
```bash
npm run compile
```

### Testing
```bash
npm run test
```

### Deployment

#### Local Development
```bash
# Start local Hardhat node (in separate terminal)
npx hardhat node

# Deploy to local network
npm run deploy:local
```

#### Testnet Deployment
```bash
# Ensure PRIVATE_KEY is set in ../.env.local
npm run deploy:testnet
```

#### Mainnet Deployment
```bash
# Ensure PRIVATE_KEY and mainnet RPC are configured
npm run deploy:mainnet
```

## 📝 Contract Interfaces

### ChallengeFactory Functions

#### Creating Challenges
```solidity
function createHeadsUpChallenge(
    uint256 entryFee,
    string memory gameName,
    string memory metadata
) external returns (uint256 challengeId)

function createTournamentChallenge(
    uint256 entryFee,
    uint256 maxParticipants,
    string memory gameName,
    string memory metadata
) external returns (uint256 challengeId)
```

#### Joining Challenges
```solidity
function joinChallenge(uint256 challengeId) external payable
```

#### Management Functions
```solidity
function updatePlatformFee(uint256 newFeeRate) external onlyOwner
function updateFeeRecipient(address newRecipient) external onlyOwner
function updateMinimumEntryFee(uint256 newMinFee) external onlyOwner
```

### Challenge Functions

#### Score Management
```solidity
function submitScore(uint256 score) external
function confirmScore(address player, uint256 theirScore, uint256 myScore) external
```

#### Tournament Management
```solidity
function confirmWinner(address winner) external // Host only
```

#### Dispute System
```solidity
function disputeChallenge(string memory reason) external
function resolveDispute(address winner) external onlyOwner
```

#### Emergency Functions
```solidity
function cancelChallenge() external // Creator only
function emergencyWithdraw() external onlyOwner
```

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks on fund transfers
- **Ownable**: Access control for administrative functions
- **Input Validation**: Comprehensive parameter validation
- **Fund Safety**: Secure escrow with multiple withdrawal safeguards
- **Dispute Resolution**: Manual override capabilities for edge cases

## 📊 Events

### ChallengeFactory Events
```solidity
event ChallengeCreated(uint256 indexed challengeId, address indexed creator, address challengeContract, ChallengeType challengeType)
event ChallengeJoined(uint256 indexed challengeId, address indexed participant)
```

### Challenge Events
```solidity
event ParticipantJoined(address indexed participant, uint256 entryFee)
event ScoreSubmitted(address indexed participant, uint256 score)
event ChallengeCompleted(address indexed winner, uint256 prize)
event ChallengeDisputed(address indexed disputer, string reason)
event ChallengeCancelled(string reason)
```

## 🧪 Testing

The test suite covers:
- Contract deployment and initialization
- Challenge creation (heads-up and tournament)
- Participant joining and validation
- Score submission and confirmation flows
- Fund distribution and fee calculation
- Dispute and cancellation scenarios
- Administrative function access control
- Emergency withdrawal mechanisms

Run tests with:
```bash
npm run test
```

## 📁 File Structure

```
contracts/
├── contracts/
│   ├── Challenge.sol          # Individual challenge contract
│   ├── ChallengeFactory.sol   # Factory contract
│   └── interfaces/            # Contract interfaces
├── scripts/
│   └── deploy.js             # Deployment script
├── test/
│   └── ChallengeFactory.test.js  # Comprehensive tests
├── deployments/              # Deployment artifacts (generated)
├── hardhat.config.js         # Hardhat configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🔗 Integration

The contracts are designed to integrate with the Holic frontend through:
- Web3 provider connection (MetaMask, WalletConnect, etc.)
- Contract ABI imports for frontend interaction
- Event listening for real-time updates
- Transaction signing for challenge participation

## ⚠️ Important Notes

1. **Private Keys**: Never commit private keys to version control
2. **Gas Optimization**: Contracts are optimized for gas efficiency
3. **Upgradability**: Contracts are not upgradeable by design for security
4. **Testing**: Always test on testnet before mainnet deployment
5. **Auditing**: Consider professional audit before mainnet launch

## 🤝 Contributing

When contributing to the smart contracts:
1. Follow Solidity best practices
2. Add comprehensive tests for new features
3. Update documentation for interface changes
4. Test on local network before submitting PRs
5. Consider gas optimization in implementations

## 📞 Support

For questions about the smart contracts:
- Review the test files for usage examples
- Check deployment logs for troubleshooting
- Ensure proper network configuration in hardhat.config.js
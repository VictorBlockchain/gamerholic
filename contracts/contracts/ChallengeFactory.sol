// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './Challenge.sol';

interface IChallenge {
  function getChallengeInfo() external view returns (Challenge.ChallengeInfo memory);
  function isActiveParticipant(address player1, address player2) external view returns (bool);
}

// Minimal interface to interact with Tournament without importing full contract
interface ITournament {
  function isActiveParticipant(address player1, address player2) external view returns (bool);
}

/**
 * @title ChallengeFactory
 * @dev Factory contract for creating and managing Challenge contracts
 */
contract ChallengeFactory is Ownable, ReentrancyGuard {
  // Using challenge contract address as the primary identifier

  // Mapping from participant address to challenge addresses they've joined
  mapping(address => address[]) public participantChallenges;

  // Array of all challenge contract addresses for enumeration
  address[] public allChallenges;
  mapping(address => uint256) public allChallengesIndex;

  // Platform fee (in basis points, e.g., 250 = 2.5%)
  uint256 public platformFeeRate = 250; // 2.5%
  address public feeRecipient;

  // Minimum entry fee to prevent spam
  uint256 public minimumEntryFee = 0.001 ether;
  address public xftContract = address(0);

  mapping(address => address[]) public playerChallenges;
  mapping(address => mapping(address => uint256)) public playerChallengeIndex;
  mapping(address=>address[]) public playerCompletedChallenges;

  mapping(address => bool) public isChallengeContract;

  mapping(address => address[]) public creatorChallenges;
  mapping(address => bool) public isAdmin;
  mapping(address => bool) public isMod;

  struct ChallengeMetadata {
    uint256 id;
    address contractAddress;
    address creator;
    Challenge.ChallengeType challengeType;
    uint256 entryFee;
    uint256 maxParticipants;
    uint256 createdAt;
    string gameType;
    bool isActive;
  }

  // Events
  event ChallengeCreated(
    address indexed creator,
    address challengeContract,
    Challenge.ChallengeType challengeType,
    uint256 entryFee,
    uint256 maxParticipants,
    string gameType
  );

  event ChallengeJoined(address indexed challengeContract, address indexed participant);
  event ChallengeCompleted(address indexed challengeContract, address indexed winner);
  event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
  event FeeRecipientUpdated(address oldRecipient, address newRecipient);
  event MinimumEntryFeeUpdated(uint256 oldFee, uint256 newFee);

  constructor(address _feeRecipient) {
    feeRecipient = _feeRecipient;
    isAdmin[msg.sender] = true;
    isMod[msg.sender] = true;
  }

  modifier onlyChallengeContract() {
    require(isChallengeContract[msg.sender], 'Not a challenge contract');
    _;
  }
  modifier onlyAdmin() {
    require(isAdmin[msg.sender], 'Not admin');
    _;
  }
  modifier onlyMod() {
    require(isMod[msg.sender], 'Not mod');
    _;
  }

  /**
   * @dev Create a new heads-up challenge
   */
  function createHeadsUpChallenge(
    uint256 entryFee,
    address opponent,
    address payToken,
    address tournament,
    string memory gameType,
    string memory metadata
  ) external payable nonReentrant returns (address challengeContract) {
    uint256 fee = (entryFee * platformFeeRate) / 10000;
    // Allow zero entry fee when challenge is bound to a tournament; otherwise enforce minimum
    if (tournament == address(0)) {
      require(entryFee >= minimumEntryFee, 'Entry fee too low');
    }
    // Collect only the entry fee from creator; platform fee will be deducted from prize pool at distribution
    if (payToken != address(0)) {
      // For ERC20, skip allowance and transfer when entryFee is zero to save gas and avoid non-standard token issues
      if (entryFee > 0) {
        require(IERC20(payToken).allowance(msg.sender, address(this)) >= entryFee, 'Not enough tokens');
        IERC20(payToken).transferFrom(msg.sender, address(this), entryFee);
      }
    } else {
      // Enforce exact native amount; when entryFee == 0, require no value sent
      require(msg.value == entryFee, 'Incorrect entry fee sent');
    }
    // Check opponent balance if specified
    require(opponent != address(0), 'Opponent address cannot be zero');
    if (payToken != address(0)) {
      require(IERC20(payToken).balanceOf(opponent) > 0, 'Opponent must have non-zero token balance');
    } else {
      require(opponent.balance > 0, 'Opponent must have non-zero SEI balance');
    }
    if (tournament != address(0)) {
      require(
        ITournament(tournament).isActiveParticipant(msg.sender, opponent),
        'Players must be active participant in tournament'
      );
    }
    // Calculate platform fee amount based on total expected prize pool (2 * entryFee for heads-up)
    uint256 platformFeeAmount = 2 * fee;

    Challenge challenge = new Challenge(
      tournament,
      Challenge.ChallengeType.HEADS_UP,
      entryFee,
      2, // Max 2 participants for heads-up
      0, // No XFT required for heads-up
      gameType,
      metadata,
      address(this),
      platformFeeAmount,
      feeRecipient,
      msg.sender,
      opponent,
      payToken
    );

    challengeContract = address(challenge);
    allChallenges.push(challengeContract);
    allChallengesIndex[challengeContract] = allChallenges.length - 1;
    isChallengeContract[challengeContract] = true;

    playerChallenges[msg.sender].push(challengeContract);
    playerChallengeIndex[msg.sender][challengeContract] = playerChallenges[msg.sender].length - 1;
    if (opponent != address(0)) {
      playerChallenges[opponent].push(challengeContract);
      playerChallengeIndex[opponent][challengeContract] = playerChallenges[opponent].length - 1;
    }

    emit ChallengeCreated(
      msg.sender,
      challengeContract,
      Challenge.ChallengeType.HEADS_UP,
      entryFee,
      2,
      gameType
    );

    // Forward creator's entry fee into the challenge and mark creator as participant
    if (payToken == address(0)) {
      // Native SEI: send entry fee to challenge via addCreatorAsParticipant
      Challenge(challengeContract).addCreatorAsParticipant{value: entryFee}(msg.sender);
    } else {
      // ERC20: transfer entry fee tokens to challenge only if non-zero, then register creator
      if (entryFee > 0) {
        require(IERC20(payToken).transfer(challengeContract, entryFee), 'Token transfer to challenge failed');
      }
      Challenge(challengeContract).addCreatorAsParticipant(msg.sender);
    }

    emit ChallengeJoined(challengeContract, msg.sender);

    return challengeContract;
  }

  function setRemoveChallenge(
    address player,
    address challengeContract,
    uint256 status
  ) external onlyChallengeContract returns (bool) {
    uint256 index = playerChallengeIndex[player][challengeContract];
    require(index < playerChallenges[player].length, 'Challenge not found');

    // Swap with last element and pop
    address lastContract = playerChallenges[player][playerChallenges[player].length - 1];
    playerChallenges[player][index] = lastContract;
    playerChallengeIndex[player][lastContract] = index;
    playerChallenges[player].pop();
    playerChallengeIndex[player][challengeContract] = 0;

    // Remove from allChallenges array only once (guard second call)
    uint256 challengeIndex = allChallengesIndex[challengeContract];
    if (challengeIndex < allChallenges.length) {
      address lastGlobalAddr = allChallenges[allChallenges.length - 1];
      allChallenges[challengeIndex] = lastGlobalAddr;
      allChallengesIndex[lastGlobalAddr] = challengeIndex;
      allChallenges.pop();
      delete allChallengesIndex[challengeContract];
    }

    return true;
  }

  function setCompletedChallenge(address player1, address player2) external onlyChallengeContract {
    playerCompletedChallenges[player1].push(msg.sender);
    playerCompletedChallenges[player2].push(msg.sender);
    address w = Challenge(msg.sender).winner();
    emit ChallengeCompleted(msg.sender, w);
  }

  function setAdmin(address admin, bool isAdminFlag) external onlyAdmin {
    isAdmin[admin] = isAdminFlag;
  }

  function setMod(address mod, bool isModFlag) external onlyAdmin {
    isMod[mod] = isModFlag;
  }

  function getAdmin(address admin) external view returns (bool) {
    return isAdmin[admin];
  }

  function getMod(address mod) external view returns (bool) {
    return isMod[mod];
  }

  function getChallenge(address challengeContract) external view returns (Challenge.ChallengeInfo memory) {
    require(isChallengeContract[challengeContract], 'Challenge does not exist');
    return Challenge(challengeContract).getChallengeInfo();
  }

  function getIsChallengeContract(address challengeContract) external view returns (bool) {
    return isChallengeContract[challengeContract];
  }

  function getPlayerChallengesActive(address player) external view returns (address[] memory) {
    return playerChallenges[player];
  }

  function getPlayerChallengesCompleted(address player) external view returns (address[] memory) {
    return playerCompletedChallenges[player];
  }

  /**
   * @dev Get challenges created by a user
   */
  function getCreatorChallenges(address creator) external view returns (address[] memory) {
    return creatorChallenges[creator];
  }

  /**
   * @dev Get all challenge IDs
   */
  function getAllChallenges() external view returns (address[] memory) {
    return allChallenges;
  }

  // Duplicate getChallenge removed; use the earlier version that returns Challenge.getChallenge(challengeId)

  /**
   * @dev Update platform fee rate (only owner)
   */
  function updatePlatformFeeRate(uint256 newFeeRate) external onlyAdmin {
    require(newFeeRate <= 1000, 'Fee rate too high (max 10%)');

    uint256 oldFeeRate = platformFeeRate;
    platformFeeRate = newFeeRate;

    emit PlatformFeeUpdated(oldFeeRate, newFeeRate);
  }

  /**
   * @dev Update fee recipient (only owner)
   */
  function updateFeeRecipient(address newFeeRecipient) external onlyAdmin {
    require(newFeeRecipient != address(0), 'Invalid fee recipient');

    address oldFeeRecipient = feeRecipient;
    feeRecipient = newFeeRecipient;

    emit FeeRecipientUpdated(oldFeeRecipient, newFeeRecipient);
  }

  /**
   * @dev Update minimum entry fee (only owner)
   */
  function updateMinimumEntryFee(uint256 newMinimumFee) external onlyAdmin {
    uint256 oldMinimumFee = minimumEntryFee;
    minimumEntryFee = newMinimumFee;

    emit MinimumEntryFeeUpdated(oldMinimumFee, newMinimumFee);
  }

  /**
   * @dev Get total number of challenges
   */
  function getTotalChallenges() external view returns (uint256) {
    return allChallenges.length;
  }

  /**
   * @dev Emergency pause (only owner) - prevents new challenge creation
   */
  bool public paused = false;

  modifier whenNotPaused() {
    require(!paused, 'Contract is paused');
    _;
  }

  function setPaused(bool _paused) external onlyAdmin {
    paused = _paused;
  }
}

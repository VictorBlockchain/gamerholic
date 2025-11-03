//Gamerholic.fun onchain esports
//Compete in heads up games & tournaments

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Removed Ownable/ReentrancyGuard to reduce bytecode size
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

// Tournament is deployed via external TournamentDeployer; no direct reference needed here
// Externalized deployer to keep factory bytecode minimal
interface ITournamentDeployer {
  function deployTournament(
    uint256 entryFee,
    address payToken,
    uint256 maxParticipants,
    uint256 xftToJoin,
    bool isFFA,
    string memory gameType,
    string memory metadata,
    address feeRecipient,
    uint256 platformFeeAmount,
    address creator
  ) external returns (address);
}

// Minimal interface to avoid importing full ChallengeFactory contract
interface IChallengeFactory {
  function getIsChallengeContract(address challengeContract) external view returns (bool);
}
/**
 * @title TournamentFactory
 * @dev Factory contract dedicated to creating and managing Tournament contracts
 */
contract TournamentFactory {
  // Custom errors to reduce bytecode size
  error OnlyAdmin();
  error OnlyMod();
  error EntryFeeTooLow();
  error InvalidParticipantCount();
  error NotPowerOfTwo();
  error FeeRateTooHigh();
  error InvalidFeeRecipient();
  error OnlyTournamentContract();
  error TournamentNotFound();
  // Address-based enumeration helpers
  address challengeFactory;
  address public tournamentDeployer;
  address[] public allTournaments;
  mapping(address => bool) public isTournamentContract;
  mapping(address => uint256) public allTournamentsIndex;
  mapping(address => address[]) public creatorTournaments;
  mapping(address => address[]) public playerTournaments;
  mapping(address => mapping(address => uint256)) public playerTournamentIndex;

  // Platform fee configuration
  uint256 public platformFeeRate = 250; // 2.5%
  address public feeRecipient;
  uint256 public minimumEntryFee = 0.001 ether;

  // Admins for privileged actions referenced by Tournament via IBridge2
  mapping(address => bool) public isAdmin;
  mapping(address => bool) public isMod;

  address public xftContract;
  mapping(uint256 => uint256) public xftToJoinEntryCount;
  //player => xftToJoin => entryCount
  mapping(address => mapping(uint256 => uint256)) public playerXftToJoinEntryCount;

  // Access control modifiers
  modifier onlyAdmin() {
    if (!isAdmin[msg.sender]) revert OnlyAdmin();
    _;
  }
  modifier onlyMod() {
    if (!(isMod[msg.sender] || isAdmin[msg.sender])) revert OnlyMod();
    _;
  }

  // Events
  event TournamentCreated(
    address indexed creator,
    address tournamentContract,
    uint256 entryFee,
    uint256 maxParticipants,
    bool isFFA,
    string gameType
  );
  event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
  event FeeRecipientUpdated(address oldRecipient, address newRecipient);
  event MinimumEntryFeeUpdated(uint256 oldFee, uint256 newFee);

  constructor(address _feeRecipient, address _challengeFactory) {
    feeRecipient = _feeRecipient;
    challengeFactory = _challengeFactory;
    isMod[msg.sender] = true;
    isAdmin[msg.sender] = true;
  }

  /**
   * @dev Create a new tournament. Supports FFA and bracket tournaments.
   */
  function createTournament(
    uint256 entryFee,
    address payToken,
    uint256 maxParticipants,
    uint256 xftToJoin,
    bool isFFA,
    string memory gameType,
    string memory metadata
  ) external returns (address tournamentContract) {
    if (entryFee < minimumEntryFee) revert EntryFeeTooLow();
    if (!isFFA) {
      if (maxParticipants < 2) revert InvalidParticipantCount();
      if ((maxParticipants & (maxParticipants - 1)) != 0) revert NotPowerOfTwo();
    }

    // Calculate absolute platform fee deducted from prize pool on finalize
    uint256 platformFeeAmount;
    if (isFFA) {
      // For FFA, total prize depends on dynamic contributors; use a baseline on maxParticipants if provided
      platformFeeAmount = (entryFee * maxParticipants * platformFeeRate) / 10000;
    } else {
      platformFeeAmount = (entryFee * maxParticipants * platformFeeRate) / 10000;
    }

    // Delegate deployment to external deployer to avoid embedding Tournament creation bytecode
    if (tournamentDeployer == address(0)) revert OnlyAdmin();
    tournamentContract = ITournamentDeployer(tournamentDeployer).deployTournament(
      entryFee,
      payToken,
      maxParticipants,
      xftToJoin,
      isFFA,
      gameType,
      metadata,
      feeRecipient,
      platformFeeAmount,
      msg.sender
    );
    isTournamentContract[tournamentContract] = true;
    allTournaments.push(tournamentContract);
    allTournamentsIndex[tournamentContract] = allTournaments.length - 1;
    creatorTournaments[msg.sender].push(tournamentContract);

    emit TournamentCreated(
      msg.sender,
      tournamentContract,
      entryFee,
      maxParticipants,
      isFFA,
      gameType
    );
  }

  // Admin management used by Tournament.onlyCreator via IBridge2(factory).getAdmin
  function setAdmin(address admin, bool isAdminFlag) external {
    if (!isAdmin[msg.sender]) revert OnlyAdmin();
    isAdmin[admin] = isAdminFlag;
  }

  // Mod management used by Tournament.onlyCreator via IBridge2(factory).getMod
  function setMod(address mod, bool isModFlag) external {
    if (!isAdmin[msg.sender]) revert OnlyAdmin();
    isMod[mod] = isModFlag;
  }

  function getMod(address mod) external view returns (bool) {
    return isMod[mod];
  }

  function getAdmin(address admin) external view returns (bool) {
    return isAdmin[admin];
  }

  // Basic views
  function getAllTournaments() external view returns (address[] memory) {
    return allTournaments;
  }

  function getTotalTournaments() external view returns (uint256) {
    return allTournaments.length;
  }

  function getIsChallengeContract(address challengeContract) external view returns (bool) {
    return IChallengeFactory(challengeFactory).getIsChallengeContract(challengeContract);
  }
  function getXFTToJoinEntryCount(uint256 xftToJoin) external view returns (uint256) {
    return xftToJoinEntryCount[xftToJoin];
  }
  function getPlayerXFTToJoinEntryCount(
    address player,
    uint256 xftToJoin
  ) external view returns (uint256, uint256, bool) {
    uint256 entryCount = playerXftToJoinEntryCount[player][xftToJoin];
    bool expired = entryCount >= xftToJoinEntryCount[xftToJoin];
    uint256 balance = IERC1155(xftContract).balanceOf(player, xftToJoin);
    return (entryCount, balance, expired);
  }

  // Configuration updates
  function updatePlatformFeeRate(uint256 newFeeRate) external onlyAdmin {
    if (newFeeRate > 1000) revert FeeRateTooHigh();
    uint256 oldFeeRate = platformFeeRate;
    platformFeeRate = newFeeRate;
    emit PlatformFeeUpdated(oldFeeRate, newFeeRate);
  }

  function updateFeeRecipient(address newFeeRecipient) external onlyAdmin {
    if (newFeeRecipient == address(0)) revert InvalidFeeRecipient();
    address oldRecipient = feeRecipient;
    feeRecipient = newFeeRecipient;
    emit FeeRecipientUpdated(oldRecipient, newFeeRecipient);
  }

  function updateMinimumEntryFee(uint256 newMinimumFee) external onlyAdmin {
    uint256 oldFee = minimumEntryFee;
    minimumEntryFee = newMinimumFee;
    emit MinimumEntryFeeUpdated(oldFee, newMinimumFee);
  }

  // Optional cleanup hook removed to reduce code size (was not used)

  function setXFTToJoinEntryCount(
    uint256 xftToJoin,
    address _xftContract,
    uint256 entryCount
  ) external onlyMod {
    xftToJoinEntryCount[xftToJoin] = entryCount;
    xftContract = _xftContract;
  }

  function setPlayerXFTToJoinEntryCount(address player, uint256 xftToJoin) external {
    if (!isTournamentContract[msg.sender]) revert OnlyTournamentContract();
    playerXftToJoinEntryCount[player][xftToJoin]++;
  }

  // Configure external deployer address
  function setTournamentDeployer(address _deployer) external onlyAdmin {
    if (_deployer == address(0)) revert InvalidFeeRecipient();
    tournamentDeployer = _deployer;
  }
}

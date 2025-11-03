// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import "./Challenge.sol"; // Removed to reduce bytecode size; use interface instead

interface IBridge {
  function getMod(address mod) external view returns (bool);
  function getIsChallengeContract(address challengeContract) external view returns (bool);
  function getPlayerXFTToJoinEntryCount(
    address player,
    uint256 xftToJoin
  ) external view returns (uint256, uint256, bool);
  function setPlayerXFTToJoinEntryCount(address player, uint256 xftToJoin) external;
}

// Minimal interface to interact with Challenge contracts without importing full bytecode
interface IChallenge {
  function winner() external view returns (address);
  function getParticipants() external view returns (address[] memory);
}

/**
 * @title Tournament
 * @dev Tournament contract coordinating multi-player brackets using heads-up Challenge contracts per match.
 * Supports free-for-all (FFA) single-winner tournaments and multi-round elimination.
 * Funds are held in this contract and distributed when the final winner is determined.
 */

contract Tournament is ReentrancyGuard, Ownable {
  enum TournamentStatus {
    ACTIVE,
    STARTED,
    COMPLETED,
    DISPUTED,
    CANCELLED
  }

  struct TournamentInfo {
    address creator;
    uint256 entryFee;
    uint256 maxParticipants;
    uint256 xftToJoin;
    uint256 createdAt;
    string gameType;
    string metadata;
    address payToken; // address(0) for native
    bool isFFA; // true for free-for-all single winner
    TournamentStatus status;
    uint256 totalPrizePool;
  }

  struct Participant {
    address player;
    uint256 joinedAt;
    bool hasPaid;
  }

  TournamentInfo public tournamentInfo;

  // Participants
  mapping(address => Participant) public participants;
  address[] public participantList;

  // Active participants for current round (shrinks as winners advance)
  address[] public activeParticipants;
  mapping(address => uint256) public activeParticipantToIndex;

  // Matches for the current round (heads-up Challenge contracts)
  address[] public currentRoundMatches;
  mapping(uint256 => address[]) public roundMatches;

  address[] public challenges;

  mapping(address => mapping(address => address)) public matchToChallenge;

  // Accounting
  address public feeRecipient;
  uint256 public platformFeeAmount; // absolute amount to subtract from totalPrizePool

  ///1st place gets 40%, 2nd place gets 30%, 3rd place gets 15%
  ///tournament host gets 12.5%
  ///Distribution applies to the total prize pool minus any platformFeeAmount.
  ///Remainder due to rounding and 2.5% undistributed portion goes to 1st place.

  // Payout percentages in basis points (out of 10,000). Total = 9,750bp.
  uint256 public constant FIRST_PLACE_BP = 4000; // 40%
  uint256 public constant SECOND_PLACE_BP = 3000; // 30%
  uint256 public constant THIRD_PLACE_BP = 1500; // 15%
  uint256 public constant CREATOR_BP = 1250; // 12.5%

  // Final placements (optional view state)
  address public firstPlace;
  address public secondPlace;
  address public thirdPlace;
  address public reportedFirst;
  address public reportedSecond;
  address public reportedThird;
  // Address of factory (TournamentFactory) that deployed this contract
  address public factory;
  // Bracket tracking
  address public finalMatch;
  address public thirdPlaceMatch;
  address[] public semifinalLosers;
  address public tournamentFactory;

  // Events
  event ParticipantJoined(address indexed player, uint256 amount);
  event RoundMatchesCreated(uint256 indexed round, address[] matches);
  event RoundAdvanced(uint256 indexed round, address[] winners);
  event RoundStarted(uint256 indexed round, uint256 participantCount, string metadata);
  event FFASubmitted(address indexed reporter, address indexed winner);
  event WinnerDeclared(address indexed winner, uint256 prizeAmount);
  event FundsDistributed(address indexed winner, uint256 amount);
  event TournamentCancelled(string reason);
  event PlacementsFinalized(
    address indexed first,
    address indexed second,
    address indexed third,
    uint256 firstAmount,
    uint256 secondAmount,
    uint256 thirdAmount,
    uint256 creatorAmount
  );
  event FinalMatchCreated(address matchAddress);
  event ThirdPlaceMatchCreated(address matchAddress);
  event PlacementsReported(address indexed first, address indexed second, address indexed third);

  modifier onlyCreator() {
    (bool isMod) = IBridge(factory).getMod(msg.sender);
    require(msg.sender == tournamentInfo.creator || isMod, "Only creator or mod");
    _;
  }

  // Allow creator, mod, or any currently active participant to call
  modifier onlyActiveParticipantOrCreator() {
    (bool isMod) = IBridge(factory).getMod(msg.sender);
    bool isCreator = msg.sender == tournamentInfo.creator;
    bool isActive = false;
    for (uint256 i = 0; i < activeParticipants.length; i++) {
      if (activeParticipants[i] == msg.sender) {
        isActive = true;
        break;
      }
    }
    require(isCreator || isMod || isActive, "Only creator, mod, or active participant");
    _;
  }

  constructor(
    uint256 _entryFee,
    uint256 _maxParticipants,
    uint256 _xftToJoin,
    bool _isFFA,
    string memory _gameType,
    string memory _metadata,
    address _feeRecipient,
    uint256 _platformFeeAmount,
    address _payToken,
    address _creator,
    address _factory
  ) {
    require(_maxParticipants >= 2, "Invalid participants");
    tournamentInfo = TournamentInfo({
      creator: _creator,
      entryFee: _entryFee,
      maxParticipants: _maxParticipants,
      xftToJoin: _xftToJoin,
      createdAt: block.timestamp,
      gameType: _gameType,
      metadata: _metadata,
      payToken: _payToken,
      isFFA: _isFFA,
      status: TournamentStatus.ACTIVE,
      totalPrizePool: 0
    });
    feeRecipient = _feeRecipient;
    platformFeeAmount = _platformFeeAmount;
    factory = _factory;
  }

  function joinTournament() external payable nonReentrant {
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(participantList.length < tournamentInfo.maxParticipants, "Full");
    require(participants[msg.sender].player == address(0), "Joined");

    uint256 contribution;
    if (tournamentInfo.payToken == address(0)) {
      require(msg.value == tournamentInfo.entryFee, "Entry fee required");
      contribution = msg.value;
    } else {
      require(
        IERC20(tournamentInfo.payToken).allowance(msg.sender, address(this)) >=
          tournamentInfo.entryFee,
        "Approve tokens"
      );
      IERC20(tournamentInfo.payToken).transferFrom(
        msg.sender,
        address(this),
        tournamentInfo.entryFee
      );
      contribution = tournamentInfo.entryFee;
    }
    if (tournamentInfo.xftToJoin > 0) {
      IBridge bridge = IBridge(factory);
      (uint256 entryCount, uint256 balance, bool expired) = bridge.getPlayerXFTToJoinEntryCount(
        msg.sender,
        tournamentInfo.xftToJoin
      );
      require(!expired, "Expired");
      require(balance > 0, "you don not own this xft");
      bridge.setPlayerXFTToJoinEntryCount(msg.sender, tournamentInfo.xftToJoin);
    }

    participants[msg.sender] = Participant({
      player: msg.sender,
      joinedAt: block.timestamp,
      hasPaid: true
    });
    participantList.push(msg.sender);
    activeParticipants.push(msg.sender);
    activeParticipantToIndex[msg.sender] = activeParticipants.length - 1;
    tournamentInfo.totalPrizePool += contribution;
    emit ParticipantJoined(msg.sender, contribution);
  }

  function setChallenge(address challenge, address player1, address player2) external {
    require(IBridge(factory).getIsChallengeContract(msg.sender), "Not challenge contract");
    challenges.push(challenge);
    matchToChallenge[player1][player2] = challenge;
  }

  // Called by a registered Challenge contract to remove a loser from active participants
  function removeActiveParticipant(address player) external {
    require(IBridge(factory).getIsChallengeContract(msg.sender), "Not challenge contract");
    uint256 idx = activeParticipantToIndex[player];
    // If player is not currently active, skip without reverting (e.g., third-place matches)
    if (activeParticipants.length == 0 || activeParticipants[idx] != player) {
      return;
    }

    uint256 lastIndex = activeParticipants.length - 1;
    if (idx != lastIndex) {
      address last = activeParticipants[lastIndex];
      activeParticipants[idx] = last;
      activeParticipantToIndex[last] = idx;
    }
    activeParticipants.pop();
    delete activeParticipantToIndex[player];
  }

  // FFA flow: a single winner is reported and then confirmed by creator, funds distributed
  address public reportedFFAWinner;

  function submitFFAWinner(address winner) external onlyCreator {
    require(tournamentInfo.isFFA, "Not FFA");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(winner != address(0), "Invalid winner");
    require(participants[winner].player != address(0), "Not participant");
    reportedFFAWinner = winner;
    emit FFASubmitted(msg.sender, winner);
  }

  function confirmFFAWinner() external onlyCreator nonReentrant {
    require(tournamentInfo.isFFA, "Not FFA");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(reportedFFAWinner != address(0), "No winner reported");
    _finalizeWinner(reportedFFAWinner);
  }

  // Internal: finalize FFA winner and distribute entire distributable pool to winner (minus platform fee)
  function _finalizeWinner(address finalWinner) internal {
    require(tournamentInfo.isFFA, "Not FFA");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(finalWinner != address(0), "Invalid winner");
    tournamentInfo.status = TournamentStatus.COMPLETED;
    emit WinnerDeclared(finalWinner, tournamentInfo.totalPrizePool);

    // Use actual contract balance (native or ERC20) for distributable amount
    uint256 prizeAmount;
    if (tournamentInfo.payToken == address(0)) {
      prizeAmount = address(this).balance;
    } else {
      prizeAmount = IERC20(tournamentInfo.payToken).balanceOf(address(this));
    }
    if (platformFeeAmount > 0) {
      prizeAmount = prizeAmount - platformFeeAmount;
    }

    if (tournamentInfo.payToken == address(0)) {
      if (platformFeeAmount > 0) {
        (bool feeOk, ) = payable(feeRecipient).call{value: platformFeeAmount}("");
        require(feeOk, "Fee transfer failed");
      }
      (bool ok, ) = payable(finalWinner).call{value: prizeAmount}("");
      require(ok, "Prize transfer failed");
    } else {
      if (platformFeeAmount > 0) {
        require(
          IERC20(tournamentInfo.payToken).transfer(feeRecipient, platformFeeAmount),
          "Fee transfer failed"
        );
      }
      require(
        IERC20(tournamentInfo.payToken).transfer(finalWinner, prizeAmount),
        "Prize transfer failed"
      );
    }
    emit FundsDistributed(finalWinner, prizeAmount);
  }

  // Multi-round: pair active participants into heads-up matches (Challenge contracts) for current round
  uint256 public currentRound;
  // Batch creation support for large brackets
  uint256 public matchCreationPointer; // index within activeParticipants for next pair
  string public lastRoundMetadata;
  // Track number of active participants at the start of each round
  mapping(uint256 => uint256) public roundStartActiveCount;
  function createRoundMatches(string memory roundMetadata) external onlyActiveParticipantOrCreator {
    require(!tournamentInfo.isFFA, "Use FFA flow");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(activeParticipants.length >= 2, "Need players");
    require(currentRoundMatches.length == 0, "Round in progress");
    require(activeParticipants.length % 2 == 0, "Even players required");

    currentRound++;
    delete currentRoundMatches;
    matchCreationPointer = 0;
    lastRoundMetadata = roundMetadata;
    roundStartActiveCount[currentRound] = activeParticipants.length;
  }
  function startRound(string memory roundMetadata) external onlyActiveParticipantOrCreator {
    require(!tournamentInfo.isFFA, "Use FFA flow");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(activeParticipants.length >= 2, "Need players");
    require(currentRoundMatches.length == 0, "Round in progress");
    require(activeParticipants.length % 2 == 0, "Even players required");

    currentRound++;
    delete currentRoundMatches;
    matchCreationPointer = 0;
    lastRoundMetadata = roundMetadata;
    roundStartActiveCount[currentRound] = activeParticipants.length;
    emit RoundStarted(currentRound, activeParticipants.length, roundMetadata);
  }
  // Create a batch of matches for the current round by registering externally created challenge addresses
  function createRoundMatchesBatch(
    address[] memory matchAddresses
  ) external onlyActiveParticipantOrCreator {
    require(!tournamentInfo.isFFA, "Use FFA flow");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(roundStartActiveCount[currentRound] >= 2, "Need players");
    require(roundStartActiveCount[currentRound] % 2 == 0, "Even players required");
    require(currentRound > 0, "Round not started");
    require(roundStartActiveCount[currentRound] > 0, "Round not initialized");
    require(matchCreationPointer < roundStartActiveCount[currentRound], "All matches created");
    require(
      matchAddresses.length == roundStartActiveCount[currentRound] / 2,
      "Incorrect matches count"
    );

    delete currentRoundMatches;
    delete roundMatches[currentRound];
    for (uint256 i = 0; i < matchAddresses.length; i++) {
      address matchAddr = matchAddresses[i];
      roundMatches[currentRound].push(matchAddr);
      currentRoundMatches.push(matchAddr);
    }
    matchCreationPointer = roundStartActiveCount[currentRound];

    emit RoundMatchesCreated(currentRound, roundMatches[currentRound]);

    // Final round handling: mark final match if only two participants remain and one match provided
    if (
      activeParticipants.length == 2 && finalMatch == address(0) && currentRoundMatches.length == 1
    ) {
      finalMatch = currentRoundMatches[0];
      emit FinalMatchCreated(finalMatch);
    }
  }

  // Allow creator to set third-place match address if created externally
  function setThirdPlaceMatch(address matchAddress) external onlyActiveParticipantOrCreator {
    require(thirdPlaceMatch == address(0), "Third-place already set");
    thirdPlaceMatch = matchAddress;
    emit ThirdPlaceMatchCreated(matchAddress);
  }

  // Advance winners from current round into next activeParticipants by reading match Challenge state
  function advanceRound() external onlyActiveParticipantOrCreator {
    require(!tournamentInfo.isFFA, "Use FFA flow");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(roundMatches[currentRound].length > 0, "No matches");
    require(roundStartActiveCount[currentRound] > 0, "Round not initialized");
    require(
      roundMatches[currentRound].length == roundStartActiveCount[currentRound] / 2,
      "Not all matches created"
    );

    address[] memory winners = new address[](roundMatches[currentRound].length);
    uint256 wcount = 0;
    // Capture semifinal losers if this round has exactly 2 matches
    if (roundMatches[currentRound].length == 2) {
      delete semifinalLosers;
    }
    for (uint256 i = 0; i < roundMatches[currentRound].length; i++) {
      IChallenge matchChallenge = IChallenge(roundMatches[currentRound][i]);
      address mw = matchChallenge.winner();
      require(mw != address(0), "No match winner");
      winners[wcount++] = mw;

      if (roundMatches[currentRound].length == 2) {
        address[] memory parts = matchChallenge.getParticipants();
        address loser = parts[0] == mw ? parts[1] : parts[0];
        semifinalLosers.push(loser);
      }
    }
    // Reset active participant index mappings for previous round
    for (uint256 i = 0; i < activeParticipants.length; i++) {
      address prev = activeParticipants[i];
      delete activeParticipantToIndex[prev];
    }
    delete activeParticipants;
    for (uint256 i = 0; i < wcount; i++) {
      activeParticipants.push(winners[i]);
      activeParticipantToIndex[winners[i]] = i;
    }
    delete currentRoundMatches;
    emit RoundAdvanced(currentRound, winners);

    // If only one remains, mark tentative first; payout waits for finalizeBracket
    if (activeParticipants.length == 1) {
      firstPlace = activeParticipants[0];
    }
  }

  // Finalize bracket automatically: derive 1st/2nd/3rd from final and third-place matches and distribute
  function finalizeBracket() external onlyActiveParticipantOrCreator nonReentrant {
    require(!tournamentInfo.isFFA, "Use bracket flow");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(finalMatch != address(0), "Final not created");

    // Resolve final winner and runner-up
    IChallenge finalC = IChallenge(finalMatch);
    address finalWinner = finalC.winner();
    require(finalWinner != address(0), "Final not completed");
    address[] memory fparts = finalC.getParticipants();
    address runnerUp = fparts[0] == finalWinner ? fparts[1] : fparts[0];

    // Resolve third place if match exists
    address thirdW = address(0);
    if (thirdPlaceMatch != address(0)) {
      IChallenge thirdC = IChallenge(thirdPlaceMatch);
      thirdW = thirdC.winner();
      require(thirdW != address(0), "Third-place not completed");
    }

    // Set placements
    firstPlace = finalWinner;
    secondPlace = runnerUp;
    thirdPlace = thirdW;

    // Distribute according to policy
    _distributeTop3(firstPlace, secondPlace, thirdPlace);
  }

  // Internal: distribute funds to top 3 + creator and complete tournament
  function _distributeTop3(address first, address second, address third) internal {
    require(!tournamentInfo.isFFA, "Not bracket");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(
      first != address(0) &&
        second != address(0) &&
        (thirdPlaceMatch == address(0) || third != address(0)),
      "Invalid placements"
    );

    tournamentInfo.status = TournamentStatus.COMPLETED;

    // Use actual contract balance (native or ERC20) for distributable amount
    uint256 distributable;
    if (tournamentInfo.payToken == address(0)) {
      distributable = address(this).balance;
    } else {
      distributable = IERC20(tournamentInfo.payToken).balanceOf(address(this));
    }
    if (platformFeeAmount > 0) {
      distributable = distributable - platformFeeAmount;
    }

    uint256 firstAmount = (distributable * FIRST_PLACE_BP) / 10000;
    uint256 secondAmount = (distributable * SECOND_PLACE_BP) / 10000;
    uint256 thirdAmount = (distributable * THIRD_PLACE_BP) / 10000;
    uint256 creatorAmount = (distributable * CREATOR_BP) / 10000;
    uint256 allocated = firstAmount + secondAmount + thirdAmount + creatorAmount;
    uint256 remainder = distributable - allocated;

    // Transfer platform fee first if any
    if (platformFeeAmount > 0) {
      if (tournamentInfo.payToken == address(0)) {
        (bool feeOk, ) = payable(feeRecipient).call{value: platformFeeAmount}("");
        require(feeOk, "Fee transfer failed");
      } else {
        require(
          IERC20(tournamentInfo.payToken).transfer(feeRecipient, platformFeeAmount),
          "Fee transfer failed"
        );
      }
    }

    if (tournamentInfo.payToken == address(0)) {
      (bool ok1, ) = payable(first).call{value: firstAmount + remainder}("");
      require(ok1, "First payout failed");
      (bool ok2, ) = payable(second).call{value: secondAmount}("");
      require(ok2, "Second payout failed");
      if (third != address(0)) {
        (bool ok3, ) = payable(third).call{value: thirdAmount}("");
        require(ok3, "Third payout failed");
      }
      (bool okc, ) = payable(tournamentInfo.creator).call{value: creatorAmount}("");
      require(okc, "Creator payout failed");
    } else {
      require(
        IERC20(tournamentInfo.payToken).transfer(first, firstAmount + remainder),
        "First payout failed"
      );
      require(
        IERC20(tournamentInfo.payToken).transfer(second, secondAmount),
        "Second payout failed"
      );
      if (third != address(0)) {
        require(
          IERC20(tournamentInfo.payToken).transfer(third, thirdAmount),
          "Third payout failed"
        );
      }
      require(
        IERC20(tournamentInfo.payToken).transfer(tournamentInfo.creator, creatorAmount),
        "Creator payout failed"
      );
    }

    emit PlacementsFinalized(
      first,
      second,
      third,
      firstAmount + remainder,
      secondAmount,
      thirdAmount,
      creatorAmount
    );
  }

  // Helper to stringify uint for metadata
  function _toString(uint256 value) internal pure returns (string memory) {
    if (value == 0) {
      return "0";
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
      digits++;
      temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
      digits -= 1;
      buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
      value /= 10;
    }
    return string(buffer);
  }

  // Emergency controls
  function cancelTournament(string memory reason) external onlyCreator nonReentrant {
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    tournamentInfo.status = TournamentStatus.CANCELLED;
    emit TournamentCancelled(reason);
  }
  mapping(address => bool) public refundedOnCancel;

  function withdrawOnCancel() external nonReentrant {
    require(tournamentInfo.status == TournamentStatus.CANCELLED, "Not cancelled");
    require(participants[msg.sender].hasPaid, "No payment");
    require(!refundedOnCancel[msg.sender], "Already refunded");
    uint256 amount = tournamentInfo.entryFee;
    if (tournamentInfo.payToken == address(0)) {
      (bool ok, ) = payable(msg.sender).call{value: amount}("");
      require(ok, "Refund failed");
    } else {
      require(IERC20(tournamentInfo.payToken).transfer(msg.sender, amount), "Refund failed");
    }
    refundedOnCancel[msg.sender] = true;
  }

  // Views
  function getParticipants() external view returns (address[] memory) {
    return participantList;
  }
  function getActiveParticipants() external view returns (address[] memory) {
    return activeParticipants;
  }
  function getCurrentRoundMatches() external view returns (address[] memory) {
    return currentRoundMatches;
  }
  function getTournamentInfo() external view returns (TournamentInfo memory) {
    return tournamentInfo;
  }
  function getChallenge(address player1, address player2) external view returns (address) {
    return matchToChallenge[player1][player2];
  }
  function getChallenges() external view returns (address[] memory) {
    return challenges;
  }
  function getHost() external view returns (address) {
    return tournamentInfo.creator;
  }

  function isActiveParticipant(address player1, address player2) external view returns (bool) {
    // Both players must be active in the current round
    bool p1Active = false;
    bool p2Active = false;
    for (uint256 i = 0; i < activeParticipants.length; i++) {
      if (activeParticipants[i] == player1) p1Active = true;
      if (activeParticipants[i] == player2) p2Active = true;
      if (p1Active && p2Active) break;
    }
    if (!p1Active || !p2Active) {
      // Allow third-place match creation between semifinal losers
      bool p1Semi = false;
      bool p2Semi = false;
      for (uint256 i = 0; i < semifinalLosers.length; i++) {
        if (semifinalLosers[i] == player1) p1Semi = true;
        if (semifinalLosers[i] == player2) p2Semi = true;
        if (p1Semi && p2Semi) break;
      }
      if (p1Semi && p2Semi) {
        return true;
      }
      return false;
    }

    // If no matches have been registered yet for the current round,
    // allow creation for any pair of active participants.
    // This enables challenges to be created first, then registered.
    if (currentRoundMatches.length == 0) {
      return true;
    }

    // Check if they are paired in the same current round match
    for (uint256 i = 0; i < currentRoundMatches.length; i++) {
      IChallenge matchC = IChallenge(currentRoundMatches[i]);
      address[] memory parts = matchC.getParticipants();
      if (parts.length < 2) continue;
      if (
        (parts[0] == player1 && parts[1] == player2) || (parts[0] == player2 && parts[1] == player1)
      ) {
        return true;
      }
    }
    return false;
  }

  // Frontend-reported placements fallback
  function submitPlacements(address first, address second, address third) external onlyCreator {
    require(!tournamentInfo.isFFA, "Use bracket flow");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(first != address(0) && second != address(0), "First/second required");
    require(first != second, "Distinct placements");
    require(
      participants[first].player != address(0) && participants[second].player != address(0),
      "Not participants"
    );
    if (third != address(0)) {
      require(third != first && third != second, "Distinct third");
      require(participants[third].player != address(0), "Third not participant");
    }
    reportedFirst = first;
    reportedSecond = second;
    reportedThird = third;
    emit PlacementsReported(first, second, third);
  }

  function confirmPlacements() external onlyCreator nonReentrant {
    require(!tournamentInfo.isFFA, "Use bracket flow");
    require(tournamentInfo.status == TournamentStatus.ACTIVE, "Not active");
    require(reportedFirst != address(0) && reportedSecond != address(0), "No placements reported");
    firstPlace = reportedFirst;
    secondPlace = reportedSecond;
    thirdPlace = reportedThird;
    _distributeTop3(firstPlace, secondPlace, thirdPlace);
  }

  /// @notice Withdraw any leftover tokens (native or ERC20) in the contract after tournament is completed
  /// @param token Address of the token to withdraw (address(0) for native SEI)
  /// @param amount Amount to withdraw (0 for entire balance)
  function withdrawSurplus(address token, uint256 amount) external nonReentrant {
    require(tournamentInfo.status == TournamentStatus.COMPLETED, "Tournament not completed");

    address winner;
    if (tournamentInfo.isFFA) {
      winner = reportedFFAWinner;
    } else {
      winner = firstPlace;
    }
    require(msg.sender == winner, "Only winner");

    uint256 balance;
    if (token == address(0)) {
      balance = address(this).balance;
    } else {
      balance = IERC20(token).balanceOf(address(this));
    }
    require(balance > 0, "No surplus");

    uint256 withdrawAmount = amount == 0 ? balance : amount;
    require(withdrawAmount <= balance, "Amount > balance");

    if (token == address(0)) {
      (bool ok, ) = payable(winner).call{value: withdrawAmount}("");
      require(ok, "Transfer failed");
    } else {
      require(IERC20(token).transfer(winner, withdrawAmount), "Transfer failed");
    }
  }
}

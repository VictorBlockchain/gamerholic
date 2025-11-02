// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBridge {
  function setRemoveChallenge(address player, address challengeContract, uint256 status) external;
  function setCompletedChallenge(address player1, address player2) external;
  function setChallenge(address challenge, address player1, address player2) external;
  function getMod(address mod) external view returns (bool);
}

// Minimal interface to interact with Tournament for active participant management
interface ITournamentActions {
  function removeActiveParticipant(address player) external;
}

/**
 * @title Challenge
 * @dev Individual heads-up challenge contract that holds funds and manages payouts
 */
contract Challenge is ReentrancyGuard, Ownable {
  enum ChallengeType {
    HEADS_UP,
    TOURNAMENT
  }
  // Status codes mapping:
  // 0 CANCELLED, 1 ACTIVE, 2 ACCEPTED, 3 SCORE_REPORTED, 4 SCORE_CONFIRMED, 5 DISPUTED
  enum ChallengeStatus {
    CANCELLED,
    ACTIVE,
    ACCEPTED,
    SCORE_REPORTED,
    SCORE_CONFIRMED,
    DISPUTED
  }

  struct ChallengeInfo {
    ChallengeType challengeType;
    ChallengeStatus status;
    address creator;
    address opponent;
    uint256 entryFee;
    uint256 totalPrizePool;
    uint256 createdAt;
    uint256 currentParticipants;
    uint256 player1score;
    uint256 player2score;
    address scoreReporter;
    uint256 timeScored;
    uint256 timeScoreConfirmed;
    string gameType;
    string metadata; // JSON metadata for additional info
    address tournament; // tournament contract that orchestrates bracket
    address payToken;
    uint256 contractBalance; // dynamic balance of this contract (native or ERC20)
  }

  struct Participant {
    address player;
    uint256 joinedAt;
    bool hasPaid;
    uint256 score;
    bool scoreConfirmed;
  }

  ChallengeInfo public challengeInfo;
  mapping(address => Participant) public participants;
  address[] public participantList;
  mapping(address => uint256) public participantToIndex;

  address public winner;
  bool public fundsDistributed;
  // Tracks whether each participant has agreed to mutually cancel
  mapping(address => bool) public mutualCancelAgreements;

  // Events
  event ParticipantJoined(address indexed player, uint256 entryAmount);
  event ScoreSubmitted(address indexed player, uint256 player1score, uint256 player2score);
  event ScoreConfirmed(address indexed player, uint256 player1score, uint256 player2score);
  event WinnerDeclared(address indexed winner, uint256 prizeAmount);
  event FundsDistributed(address indexed winner, uint256 amount);
  event ChallengeDisputed(address indexed disputer, string reason);
  event ChallengeCancelled(string reason);
  event MutualCancellationAgreed(address indexed player);

  modifier onlyParticipant() {
    require(participants[msg.sender].player != address(0), "Not a participant");
    _;
  }

  modifier onlyCreator() {
    bool isMod = IBridge(factory).getMod(msg.sender);
    require(msg.sender == challengeInfo.creator || isMod, "Only creator or mod can call this");
    _;
  }
  modifier onlyMod() {
    bool isMod = IBridge(factory).getMod(msg.sender);
    require(isMod, "Only mod can call this");
    _;
  }
  modifier challengeActive() {
    // Considered active for operations unless cancelled or disputed
    require(
      challengeInfo.status != ChallengeStatus.CANCELLED &&
        challengeInfo.status != ChallengeStatus.DISPUTED,
      "Challenge not active"
    );
    _;
  }

  address public factory;
  uint256 public platformFeeAmount;
  address public feeRecipient;

  constructor(
    address _tournament,
    ChallengeType /* _type */,
    uint256 _entryFee,
    uint256 /* _maxParticipants */,
    uint256 /* _xftToJoin */,
    string memory _gameType,
    string memory _metadata,
    address _factory,
    uint256 _platformFeeAmount,
    address _feeRecipient,
    address _player1,
    address _player2,
    address _payToken
  ) {
    factory = _factory;
    platformFeeAmount = _platformFeeAmount;
    feeRecipient = _feeRecipient;

    challengeInfo = ChallengeInfo({
      tournament: _tournament,
      challengeType: ChallengeType.HEADS_UP,
      status: ChallengeStatus.ACTIVE,
      creator: _player1,
      opponent: _player2,
      entryFee: _entryFee,
      totalPrizePool: 0,
      createdAt: block.timestamp,
      currentParticipants: 0,
      player1score: 0,
      player2score: 0,
      scoreReporter: address(0),
      timeScored: 0,
      timeScoreConfirmed: 0,
      gameType: _gameType,
      metadata: _metadata,
      payToken: _payToken,
      contractBalance: 0
    });
    // ID is retained in struct for legacy display, but factory uses address
  }

  /**
   * @dev Internal helper to register the creator as a participant
   */
  function _addCreatorAsParticipant(address player1) internal {
    participants[player1] = Participant({
      player: player1,
      joinedAt: block.timestamp,
      hasPaid: true,
      score: 0,
      scoreConfirmed: false
    });
    participantList.push(player1);
    challengeInfo.currentParticipants++;
  }

  /**
   * @dev Join a heads-up challenge by paying the entry fee (opponent only)
   */
  function joinChallenge() external payable challengeActive nonReentrant {
    require(challengeInfo.status == ChallengeStatus.ACTIVE, "Challenge not active");
    address participant = msg.sender;
    require(challengeInfo.currentParticipants < 2, "Challenge full");
    require(participants[participant].player == address(0), "Already joined");
    require(participant == challengeInfo.opponent, "you are not the opponent");

    uint256 contribution;
    if (challengeInfo.payToken == address(0)) {
      require(msg.value >= challengeInfo.entryFee, "Entry fee required");
      contribution = msg.value;
    } else {
      require(
        IERC20(challengeInfo.payToken).balanceOf(participant) >= challengeInfo.entryFee,
        "Not enough tokens"
      );
      IERC20(challengeInfo.payToken).transferFrom(
        participant,
        address(this),
        challengeInfo.entryFee
      );
      contribution = challengeInfo.entryFee;
    }

    participants[participant] = Participant({
      player: participant,
      joinedAt: block.timestamp,
      hasPaid: true,
      score: 0,
      scoreConfirmed: false
    });

    participantList.push(participant);
    participantToIndex[participant] = participantList.length - 1;
    challengeInfo.currentParticipants++;
    challengeInfo.totalPrizePool += contribution;
    // Both participants have joined; mark as accepted
    challengeInfo.status = ChallengeStatus.ACCEPTED;
    if (challengeInfo.tournament != address(0)) {
      IBridge(challengeInfo.tournament).setChallenge(
        address(this),
        challengeInfo.creator,
        challengeInfo.opponent
      );
    }
    emit ParticipantJoined(participant, contribution);
  }

  /**
   * @dev Submit score for a participant (can be called by participant or creator)
   */
  function submitScore(uint256 player1score, uint256 player2score) external challengeActive {
    // Only allow score submission after challenge is accepted
    bool isMod = IBridge(factory).getMod(msg.sender);
    require(challengeInfo.status == ChallengeStatus.ACCEPTED, "Challenge not accepted");
    require(
      msg.sender == challengeInfo.opponent || msg.sender == challengeInfo.creator || isMod,
      "Can only submit own score or creator can submit"
    );

    require(player1score >= 0 && player2score >= 0, "Invalid score");
    require(player1score != player2score, "Scores must be different");

    challengeInfo.player1score = player1score;
    challengeInfo.player2score = player2score;
    challengeInfo.status = ChallengeStatus.SCORE_REPORTED;
    // record reporter and timestamp
    challengeInfo.scoreReporter = msg.sender;
    challengeInfo.timeScored = block.timestamp;
    emit ScoreSubmitted(msg.sender, player1score, player2score);
  }

  /**
   * @dev Confirm score (both players must confirm)
   */
  function confirmScore(address _confirmerInput) external challengeActive {
    require(challengeInfo.status == ChallengeStatus.SCORE_REPORTED, "Scores not submitted");
    require(msg.sender != challengeInfo.scoreReporter, "Score reporter cannot confirm");
    bool isMod = IBridge(factory).getMod(msg.sender);
    // For heads-up, both players can confirm scores
    require(
      msg.sender == challengeInfo.opponent || msg.sender == challengeInfo.creator || isMod,
      "Invalid confirmation"
    );
    address confirmer = address(0);
    if (challengeInfo.scoreReporter == challengeInfo.creator) {
      confirmer = challengeInfo.opponent;
      participants[challengeInfo.creator].score = challengeInfo.player1score;
    } else {
      confirmer = challengeInfo.creator;
      participants[challengeInfo.opponent].score = challengeInfo.player2score;
    }
    participants[challengeInfo.creator].scoreConfirmed = true;
    participants[challengeInfo.opponent].scoreConfirmed = true;

    // record score confirmation timestamp
    challengeInfo.timeScoreConfirmed = block.timestamp;
    emit ScoreConfirmed(confirmer, challengeInfo.player1score, challengeInfo.player2score);

    // Check if we can determine winner
    _checkAndDeclareWinner();
  }

  /**
   * @dev Internal function to check and declare winner
   */
  function _checkAndDeclareWinner() internal {
    // Need both scores confirmed
    if (participantList.length == 2) {
      address player1 = participantList[0];
      address player2 = participantList[1];

      if (participants[player1].scoreConfirmed && participants[player2].scoreConfirmed) {
        address gameWinner = participants[player1].score > participants[player2].score
          ? player1
          : player2;
        _declareWinner(gameWinner);
      }
    }
  }

  /**
   * @dev Internal function to declare winner and distribute funds
   */
  function _declareWinner(address _winner) internal {
    require(winner == address(0), "Winner already declared");

    winner = _winner;
    // Score confirmation completes the challenge
    challengeInfo.status = ChallengeStatus.SCORE_CONFIRMED;

    // Sync completion to factory for both players
    IBridge(factory).setCompletedChallenge(challengeInfo.creator, challengeInfo.opponent);

    // If tournament is set, remove loser from active participants immediately
    if (challengeInfo.tournament != address(0) && participantList.length == 2) {
      address player1 = participantList[0];
      address player2 = participantList[1];
      address loser = player1 == _winner ? player2 : player1;
      ITournamentActions(challengeInfo.tournament).removeActiveParticipant(loser);
    }

    emit WinnerDeclared(_winner, challengeInfo.totalPrizePool);

    // Automatically distribute funds
    _distributeFunds();
  }

  /**
   * @dev Distribute funds to winner
   */
  function _distributeFunds() internal {
    require(!fundsDistributed, "Funds already distributed");
    require(winner != address(0), "No winner declared");

    fundsDistributed = true;
    uint256 totalPool = challengeInfo.totalPrizePool;

    // Use the pre-calculated platform fee amount
    uint256 prizeAmount = totalPool - platformFeeAmount;

    if (challengeInfo.payToken == address(0)) {
      // Transfer platform fee to fee recipient
      if (platformFeeAmount > 0) {
        (bool feeSuccess, ) = payable(feeRecipient).call{value: platformFeeAmount}("");
        require(feeSuccess, "Platform fee transfer failed");
      }

      // Transfer prize to winner
      (bool prizeSuccess, ) = payable(winner).call{value: prizeAmount}("");
      require(prizeSuccess, "Prize transfer failed");
    } else {
      if (platformFeeAmount > 0) {
        require(
          IERC20(challengeInfo.payToken).transfer(feeRecipient, platformFeeAmount),
          "Fee transfer failed"
        );
      }
      require(
        IERC20(challengeInfo.payToken).transfer(winner, prizeAmount),
        "Prize transfer failed"
      );
    }

    // Inform factory to remove active references
    IBridge(factory).setRemoveChallenge(challengeInfo.creator, address(this), 1);
    IBridge(factory).setRemoveChallenge(challengeInfo.opponent, address(this), 1);
    emit FundsDistributed(winner, prizeAmount);
  }

  /**
   * @dev Internal helper to refund all participants and cleanup in factory
   */
  function _refundAllParticipants() internal {
    for (uint256 i = 0; i < participantList.length; i++) {
      address participant = participantList[i];
      if (participants[participant].hasPaid) {
        if (challengeInfo.payToken == address(0)) {
          (bool success, ) = payable(participant).call{value: challengeInfo.entryFee}("");
          require(success, "Refund failed");
        } else {
          require(
            IERC20(challengeInfo.payToken).transfer(participant, challengeInfo.entryFee),
            "Refund failed"
          );
        }
      }
      // cleanup in factory
      IBridge(factory).setRemoveChallenge(participant, address(this), 2);
    }
  }

  /**
   * @dev Dispute a challenge (can be called by any participant)
   */
  function disputeChallenge(string memory reason) external onlyParticipant {
    require(
      challengeInfo.status == ChallengeStatus.ACTIVE ||
        challengeInfo.status == ChallengeStatus.SCORE_CONFIRMED,
      "Cannot dispute"
    );

    challengeInfo.status = ChallengeStatus.DISPUTED;
    emit ChallengeDisputed(msg.sender, reason);
  }

  /**
   * @dev Cancel challenge and refund participants (only creator, only if not completed)
   */
  function cancelChallenge(string memory reason) external onlyCreator nonReentrant {
    require(challengeInfo.status == ChallengeStatus.ACTIVE, "Can only cancel active challenges");

    challengeInfo.status = ChallengeStatus.CANCELLED;

    _refundAllParticipants();

    emit ChallengeCancelled(reason);
  }

  /**
   * @dev Request a mutual cancellation. Both creator and opponent must agree.
   * Allowed when status is ACCEPTED, SCORE_REPORTED, or DISPUTED.
   */
  function requestMutualCancel() external nonReentrant {
    require(
      msg.sender == challengeInfo.creator || msg.sender == challengeInfo.opponent,
      "Only participants can request mutual cancel"
    );
    require(
      challengeInfo.status == ChallengeStatus.ACCEPTED ||
        challengeInfo.status == ChallengeStatus.SCORE_REPORTED ||
        challengeInfo.status == ChallengeStatus.DISPUTED,
      "Mutual cancel not allowed now"
    );
    require(!mutualCancelAgreements[msg.sender], "Already agreed");

    mutualCancelAgreements[msg.sender] = true;
    emit MutualCancellationAgreed(msg.sender);

    // When both parties agree, cancel and refund
    if (
      mutualCancelAgreements[challengeInfo.creator] &&
      mutualCancelAgreements[challengeInfo.opponent]
    ) {
      challengeInfo.status = ChallengeStatus.CANCELLED;
      _refundAllParticipants();
      emit ChallengeCancelled("Mutual agreement");
    }
  }

  function moderatorCancel(string memory reason) external onlyMod nonReentrant {
    require(
      challengeInfo.status == ChallengeStatus.ACCEPTED ||
        challengeInfo.status == ChallengeStatus.SCORE_REPORTED ||
        challengeInfo.status == ChallengeStatus.DISPUTED,
      "Mutual cancel not allowed now"
    );
    challengeInfo.status = ChallengeStatus.CANCELLED;
    _refundAllParticipants();
    emit ChallengeCancelled(reason);
  }
  /**
   * @dev Resolve dispute (only owner of factory can call this)
   */
  function resolveDispute(bool refundParticipants) external onlyMod nonReentrant {
    require(challengeInfo.status == ChallengeStatus.DISPUTED, "No active dispute");

    if (refundParticipants) {
      // Refund all participants
      _refundAllParticipants();
      challengeInfo.status = ChallengeStatus.CANCELLED;
    } else {
      // Continue with current winner or allow new winner declaration
      challengeInfo.status = ChallengeStatus.SCORE_CONFIRMED;
      if (winner != address(0) && !fundsDistributed) {
        _distributeFunds();
      }
    }
  }

  function getMutualCancelAgreements() external view returns (bool, bool) {
    return (
      mutualCancelAgreements[challengeInfo.creator],
      mutualCancelAgreements[challengeInfo.opponent]
    );
  }
  /**
   * @dev Get all participants
   */
  function getParticipants() external view returns (address[] memory) {
    return participantList;
  }

  /**
   * @dev Get participant info
   */
  function getParticipant(address player) external view returns (Participant memory) {
    return participants[player];
  }

  /**
   * @dev Get challenge info
   */
  function getChallengeInfo() external view returns (ChallengeInfo memory) {
    ChallengeInfo memory info = challengeInfo;
    uint256 bal;
    if (info.payToken == address(0)) {
      bal = address(this).balance;
    } else {
      bal = IERC20(info.payToken).balanceOf(address(this));
    }
    info.contractBalance = bal;
    return info;
  }
  // Deprecated: ID-based getter removed; address is the primary identifier

  function addCreatorAsParticipant(address player1) external payable challengeActive {
    require(msg.sender == factory, "Only factory can call");
    require(player1 == challengeInfo.creator, "Invalid creator address");
    uint256 contribution;
    if (challengeInfo.payToken == address(0)) {
      require(msg.value == challengeInfo.entryFee, "Entry fee required");
      contribution = msg.value;
    } else {
      // In token mode, factory should have transferred entry on behalf of player1 already
      contribution = challengeInfo.entryFee;
    }
    _addCreatorAsParticipant(player1);
    challengeInfo.totalPrizePool += contribution;
    emit ParticipantJoined(player1, contribution);
  }
}

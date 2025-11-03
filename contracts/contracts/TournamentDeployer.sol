//Gamerholic.fun onchain esports
//Compete in heads up games & tournaments
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Tournament.sol";

/**
 * @title TournamentDeployer
 * @dev Dedicated deployer to keep TournamentFactory bytecode small by externalizing `new Tournament(...)`.
 */
contract TournamentDeployer {
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
  ) external returns (address tournamentContract) {
    Tournament tournament = new Tournament(
      entryFee,
      maxParticipants,
      xftToJoin,
      isFFA,
      gameType,
      metadata,
      feeRecipient,
      platformFeeAmount,
      payToken,
      creator,
      msg.sender
    );
    return address(tournament);
  }
}

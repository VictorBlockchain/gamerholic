import { IDL } from "@dfinity/candid";

export const idlFactory = ({ IDL: I }: { IDL: typeof IDL }) => {
  const Address = I.Text;
  const TournamentId = I.Text;
  const ChallengeId = I.Text;

  const TournamentInfo = I.Record({
    creator: Address,
    entryFee: I.Nat,
    maxParticipants: I.Nat,
    xftToJoin: I.Nat,
    createdAt: I.Nat64,
    deadline: I.Nat64,
    gameType: I.Text,
    metadata: I.Text,
    payToken: I.Text,
    isFFA: I.Bool,
    status: I.Nat,
    totalPrizePool: I.Nat,
    hostFeeBps: I.Nat,
    title: I.Text,
    console: I.Text,
    scheduledAt: I.Nat64,
    betable: I.Bool,
    marketId: I.Text,
    teamEntry: I.Bool,
    registrationOpen: I.Bool,
    streamUrl: I.Text,
    coverUrl: I.Text,
  });

  const ChallengeInfo = I.Record({
    challengeType: I.Nat,
    status: I.Nat,
    creator: Address,
    opponent: Address,
    entryFee: I.Nat,
    totalPrizePool: I.Nat,
    createdAt: I.Nat64,
    currentParticipants: I.Nat,
    player1score: I.Nat,
    player2score: I.Nat,
    scoreReporter: Address,
    timeScored: I.Nat64,
    timeScoreConfirmed: I.Nat64,
    gameType: I.Text,
    metadata: I.Text,
    tournament: TournamentId,
    payToken: I.Text,
    contractBalance: I.Nat,
    expiresAt: I.Nat64,
    autoResolveThreshold: I.Nat64,
    title: I.Text,
    console: I.Text,
    scheduledAt: I.Nat64,
    betable: I.Bool,
    marketId: I.Text,
    monitor: Address,
    creatorStream: I.Text,
    opponentStream: I.Text,
    scoreIsFinal: I.Bool,
    cancelRequester: Address,
    cancelRequestedAt: I.Nat64,
    disputeVideo: I.Text,
    disputeReason: I.Text,
    disputeBy: Address,
  });

  const Settlement = I.Record({
    pot: I.Nat,
    rakePercent: I.Nat,
    rake: I.Nat,
    winner: Address,
    claimed: I.Bool,
  });

  const Gamer = I.Record({
    wallet: Address,
    username: I.Text,
    avatarUrl: I.Text,
  });

  const RoomInfo = I.Record({
    id: I.Text,
    name: I.Text,
    creator: Address,
    description: I.Text,
    gameTypes: I.Vec(I.Text),
    console: I.Text,
    rules: I.Text,
    imageUrl: I.Text,
    members: I.Vec(Address),
    memberCount: I.Nat,
    createdAt: I.Nat64,
    isActive: I.Bool,
  });

  const RoomChallengeInfo = I.Record({
    id: ChallengeId,
    roomId: I.Text,
    creator: Address,
    roomCreator: Address,
    gameType: I.Text,
    console: I.Text,
    maxPlayers: I.Nat,
    entryFee: I.Nat,
    payToken: I.Text,
    rules: I.Text,
    participants: I.Vec(Address),
    participantCount: I.Nat,
    status: I.Nat,
    startedAt: I.Nat64,
    completedAt: I.Nat64,
    winner: Address,
    prizePool: I.Nat,
    createdAt: I.Nat64,
    payoutTxId: I.Text,
    payoutAmount: I.Nat,
    platformFeeAmount: I.Nat,
    roomHostFeeAmount: I.Nat,
    treasuryAmount: I.Nat,
    payoutTimestamp: I.Nat64,
  });

  const RoomPlayerStats = I.Record({
    roomId: I.Text,
    player: Address,
    gamesPlayed: I.Nat,
    wins: I.Nat,
    losses: I.Nat,
    totalEarnings: I.Nat,
    totalEntryFees: I.Nat,
    totalPayouts: I.Nat,
    createdAt: I.Nat64,
    lastPlayed: I.Nat64,
  });

  const RoomLeaderboardEntry = I.Record({
    player: Address,
    totalRooms: I.Nat,
    totalGamesPlayed: I.Nat,
    totalWins: I.Nat,
    totalLosses: I.Nat,
    totalEarnings: I.Nat,
    winRate: I.Nat,
    lastActive: I.Nat64,
  });

  const GamerStats = I.Record({
    wins: I.Nat,
    losses: I.Nat,
    winRate: I.Nat,
    currentWinStreak: I.Nat,
    currentLossStreak: I.Nat,
    longestWinStreak: I.Nat,
    longestLossStreak: I.Nat,
    totalGamesPlayed: I.Nat,
    gameRecords: I.Vec(
      I.Tuple(
        I.Text,
        I.Record({
          wins: I.Nat,
          losses: I.Nat,
          winStreak: I.Nat,
          lossStreak: I.Nat,
        }),
      ),
    ),
  });

  const GamerEarnings = I.Record({
    totalHeadsUpEarnings: I.Nat,
    totalHeadsUpLosses: I.Nat,
    totalTournamentEarnings: I.Nat,
    totalTournamentLosses: I.Nat,
    tournamentWins: I.Nat,
    tournamentLosses: I.Nat,
    netProfit: I.Int,
    profitMargin: I.Nat,
    earningsByToken: I.Vec(
      I.Tuple(
        I.Text,
        I.Record({
          headsUpEarnings: I.Nat,
          headsUpLosses: I.Nat,
          tournamentEarnings: I.Nat,
          tournamentLosses: I.Nat,
        }),
      ),
    ),
  });

  const ModeratorRole = I.Variant({
    BaseReferee: I.Null,
    VettedMod: I.Null,
    SuperMod: I.Null,
    AdminMod: I.Null,
  });

  const Moderator = I.Record({
    wallet: Address,
    role: ModeratorRole,
    appointedAt: I.Nat64,
    gamesRefereed: I.Nat,
    disputesResolved: I.Nat,
    upvotesReceived: I.Nat,
    lastPromotion: I.Nat64,
  });

  const TeamMemberSplit = I.Record({
    member: Address,
    winSplitBps: I.Nat,
  });

  const TeamClaimLine = I.Record({
    member: Address,
    winSplitBps: I.Nat,
    amount: I.Nat,
  });

  const TeamClaimPreview = I.Record({
    pot: I.Nat,
    hostFeeBps: I.Nat,
    hostCut: I.Nat,
    platformRake: I.Nat,
    teamPrizePool: I.Nat,
    teamId: I.Text,
    lines: I.Vec(TeamClaimLine),
    splitsValid: I.Bool,
    splitsTotalBps: I.Nat,
  });

  return I.Service({
    createTournament: I.Func(
      [Address, I.Nat, I.Text, I.Nat, I.Nat, I.Bool, I.Text, I.Text],
      [TournamentId],
      [],
    ),
    createTournamentEx: I.Func(
      [
        Address,
        I.Nat,
        I.Text,
        I.Nat,
        I.Nat,
        I.Bool,
        I.Text,
        I.Text,
        I.Text,
        I.Text,
        I.Nat64,
        I.Bool,
        I.Text,
        I.Nat,
        I.Bool,
        I.Text,
      ],
      [TournamentId],
      [],
    ),
    getTournamentInfo: I.Func([TournamentId], [I.Opt(TournamentInfo)], ["query"]),
    listTournaments: I.Func(
      [],
      [I.Vec(I.Tuple(TournamentId, TournamentInfo))],
      ["query"],
    ),
    joinTournament: I.Func([TournamentId, Address], [I.Bool], []),
    setTournamentBetable: I.Func(
      [TournamentId, Address, I.Bool, I.Text],
      [I.Bool],
      [],
    ),
    setTournamentSchedule: I.Func(
      [TournamentId, Address, I.Nat64],
      [I.Bool],
      [],
    ),
    createHeadsUpChallenge: I.Func(
      [Address, I.Nat, Address, I.Text, TournamentId, I.Text, I.Text],
      [ChallengeId],
      [],
    ),
    createChallengeEx: I.Func(
      [
        Address,
        I.Nat,
        Address,
        I.Text,
        TournamentId,
        I.Text,
        I.Text,
        I.Nat,
        I.Text,
        I.Text,
        I.Nat64,
        I.Bool,
        I.Text,
        Address,
        I.Text,
        I.Text,
      ],
      [ChallengeId],
      [],
    ),
    getChallengeInfo: I.Func([ChallengeId], [I.Opt(ChallengeInfo)], ["query"]),
    listChallenges: I.Func(
      [],
      [I.Vec(I.Tuple(ChallengeId, ChallengeInfo))],
      ["query"],
    ),
    joinChallenge: I.Func([ChallengeId, Address], [I.Bool], []),
    joinChallengeEx: I.Func([ChallengeId, Address, I.Text], [I.Bool], []),
    submitScore: I.Func([ChallengeId, I.Nat, I.Nat], [I.Bool], []),
    submitScoreEx: I.Func(
      [ChallengeId, I.Nat, I.Nat, Address, I.Bool],
      [I.Bool],
      [],
    ),
    confirmScore: I.Func([ChallengeId, Address], [I.Bool], []),
    disputeChallenge: I.Func([ChallengeId, I.Text], [I.Bool], []),
    cancelChallenge: I.Func([ChallengeId, I.Text], [I.Bool], []),
    requestMutualCancel: I.Func([ChallengeId, Address, I.Nat], [I.Bool], []),
    withdrawMutualCancel: I.Func([ChallengeId, Address], [I.Bool], []),
    acceptMutualCancel: I.Func([ChallengeId, Address], [I.Bool], []),
    disputeMutualCancel: I.Func(
      [ChallengeId, Address, I.Text, I.Text],
      [I.Bool],
      [],
    ),
    setPlayerStream: I.Func([ChallengeId, Address, I.Text], [I.Bool], []),
    setChallengeMonitor: I.Func([ChallengeId, Address, Address], [I.Bool], []),
    openChallengeBetable: I.Func(
      [ChallengeId, Address, I.Text, I.Nat64, Address],
      [I.Bool],
      [],
    ),
    getChallengeDepositAddressICP: I.Func([ChallengeId], [I.Text], ["query"]),
    getChallengeSubaccount: I.Func([ChallengeId], [I.Vec(I.Nat8)], ["query"]),
    getTournamentDepositAddressICP: I.Func(
      [TournamentId],
      [I.Text],
      ["query"],
    ),
    getTournamentSubaccount: I.Func(
      [TournamentId],
      [I.Vec(I.Nat8)],
      ["query"],
    ),
    getBackendPrincipal: I.Func([], [I.Text], ["query"]),
    markBetableSettled: I.Func([I.Text, Address, I.Bool], [I.Bool], []),
    isBetableSettled: I.Func([I.Text], [I.Bool], ["query"]),
    upsertGamer: I.Func([Address, I.Text, I.Text], [], []),
    getGamer: I.Func([Address], [I.Opt(Gamer)], ["query"]),
    listGamers: I.Func([], [I.Vec(Gamer)], ["query"]),
    getMod: I.Func([Address], [I.Opt(Moderator)], ["query"]),
    isMod: I.Func([Address], [I.Bool], ["query"]),
    getChallengeSettlement: I.Func(
      [ChallengeId],
      [I.Opt(Settlement)],
      ["query"],
    ),
    createTeam: I.Func(
      [Address, I.Text, I.Text, I.Text, I.Vec(I.Text)],
      [I.Opt(I.Text)],
      [],
    ),
    inviteToTeamEx: I.Func(
      [I.Text, Address, Address, I.Nat],
      [I.Bool],
      [],
    ),
    setTeamWinSplits: I.Func(
      [I.Text, Address, I.Vec(I.Tuple(Address, I.Nat))],
      [I.Bool],
      [],
    ),
    getTeamWinSplits: I.Func([I.Text], [I.Vec(TeamMemberSplit)], ["query"]),
    getTeamInfo: I.Func([I.Text], [I.Opt(I.Record({
      id: I.Text,
      name: I.Text,
      captain: Address,
      members: I.Vec(Address),
      createdAt: I.Nat64,
      avatar: I.Text,
      description: I.Text,
      gameSpecialties: I.Vec(I.Text),
      tournamentWins: I.Nat,
      tournamentLosses: I.Nat,
      totalEarnings: I.Nat,
      isActive: I.Bool,
    }))], ["query"]),
    listTeams: I.Func([], [I.Vec(I.Tuple(I.Text, I.Record({
      id: I.Text,
      name: I.Text,
      captain: Address,
      members: I.Vec(Address),
      createdAt: I.Nat64,
      avatar: I.Text,
      description: I.Text,
      gameSpecialties: I.Vec(I.Text),
      tournamentWins: I.Nat,
      tournamentLosses: I.Nat,
      totalEarnings: I.Nat,
      isActive: I.Bool,
    })))], ["query"]),
    claimTournament: I.Func(
      [TournamentId, I.Nat, Address, I.Nat],
      [I.Bool],
      [],
    ),
    claimTournamentTeam: I.Func(
      [TournamentId, I.Nat, I.Text, I.Nat],
      [I.Bool],
      [],
    ),
    claimChallenge: I.Func(
      [ChallengeId, I.Nat, Address, I.Nat],
      [I.Bool],
      [],
    ),
    previewTeamTournamentClaim: I.Func(
      [TournamentId, I.Nat, I.Text],
      [I.Opt(TeamClaimPreview)],
      ["query"],
    ),
    getTournamentSettlement: I.Func(
      [TournamentId],
      [I.Opt(Settlement)],
      ["query"],
    ),
    getTournamentWinningTeam: I.Func([TournamentId], [I.Opt(I.Text)], ["query"]),
    // Rooms
    createRoom: I.Func(
      [Address, I.Text, I.Text, I.Vec(I.Text), I.Text, I.Text, I.Text],
      [I.Text],
      [],
    ),
    joinRoom: I.Func([I.Text, Address], [I.Bool], []),
    leaveRoom: I.Func([I.Text, Address], [I.Bool], []),
    updateRoom: I.Func(
      [I.Text, Address, I.Text, I.Text, I.Vec(I.Text), I.Text, I.Text, I.Text],
      [I.Bool],
      [],
    ),
    getRoomInfo: I.Func([I.Text], [I.Opt(RoomInfo)], ["query"]),
    listRooms: I.Func([], [I.Vec(RoomInfo)], ["query"]),
    getUserRooms: I.Func([Address], [I.Vec(RoomInfo)], ["query"]),
    getRoomChallenges: I.Func([I.Text], [I.Vec(RoomChallengeInfo)], ["query"]),
    getRoomPlayerStats: I.Func(
      [I.Text, Address],
      [I.Opt(RoomPlayerStats)],
      ["query"],
    ),
    getRoomLeaderboard: I.Func([], [I.Vec(RoomLeaderboardEntry)], ["query"]),
    getGamerStats: I.Func([Address], [I.Opt(GamerStats)], ["query"]),
    getGamerEarnings: I.Func([Address], [I.Opt(GamerEarnings)], ["query"]),
    /** Play-subaccount ICP balance (e8s) for a user principal */
    getUserICPBalance: I.Func([I.Principal], [I.Nat], []),
    getUserDepositSubaccount: I.Func([I.Principal], [I.Vec(I.Nat8)], ["query"]),
    listGames: I.Func(
      [],
      [
        I.Vec(
          I.Tuple(
            I.Text,
            I.Record({
              name: I.Text,
              description: I.Text,
              category: I.Text,
              createdBy: Address,
              createdAt: I.Nat64,
            }),
          ),
        ),
      ],
      ["query"],
    ),
  });
};

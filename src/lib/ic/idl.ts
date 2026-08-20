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

  const Vote = I.Record({
    moderator: Address,
    winner: Address,
    weight: I.Nat,
  });

  const DisputeStatus = I.Variant({
    Active: I.Null,
    Resolved: I.Null,
    Cancelled: I.Null,
  });

  const Dispute = I.Record({
    challengeId: ChallengeId,
    disputedBy: Address,
    disputedAt: I.Nat64,
    status: DisputeStatus,
    votes: I.Vec(Vote),
    expiresAt: I.Nat64,
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
    setBetableMarketFactory: I.Func([I.Text], [I.Bool], []),
    getBetableMarketFactory: I.Func([], [I.Text], ["query"]),
    createTournamentBetableMarket: I.Func(
      [
        TournamentId,
        Address,
        I.Text, // betableHostPrincipal
        I.Text, // title
        I.Text, // description
        I.Int, // closeDateNs
        I.Text, // resolution
        I.Vec(I.Text), // outcomes
        I.Bool, // splitWithWinner
        I.Nat, // splitPercentage
        I.Text, // liveStream
        I.Float64, // creatorFee
        I.Text, // game
        I.Text, // console
      ],
      [I.Text], // marketId
      [],
    ),
    createChallengeBetableMarket: I.Func(
      [
        ChallengeId,
        Address,
        I.Text,
        I.Text,
        I.Text,
        I.Int,
        I.Text,
        I.Vec(I.Text),
        I.Bool,
        I.Nat,
        I.Text,
        I.Float64,
        I.Text,
        I.Text,
        I.Nat64, // scheduledAt
        Address, // monitor
      ],
      [I.Text],
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
    // Treasury / fees (admin console)
    getTreasuryTransactions: I.Func(
      [
        I.Opt(I.Nat),
        I.Opt(I.Nat),
        I.Opt(I.Text),
        I.Opt(
          I.Variant({
            Deposit: I.Null,
            Withdrawal: I.Null,
            RakeCollection: I.Null,
            PrizeDistribution: I.Null,
            PlatformFee: I.Null,
            TreasuryAllocation: I.Null,
          }),
        ),
      ],
      [
        I.Vec(
          I.Record({
            id: I.Text,
            timestamp: I.Nat64,
            transactionType: I.Variant({
              Deposit: I.Null,
              Withdrawal: I.Null,
              RakeCollection: I.Null,
              PrizeDistribution: I.Null,
              PlatformFee: I.Null,
              TreasuryAllocation: I.Null,
            }),
            tokenType: I.Text,
            amount: I.Nat,
            fromAddress: I.Opt(I.Text),
            toAddress: I.Opt(I.Text),
            challengeId: I.Opt(I.Text),
            tournamentId: I.Opt(I.Text),
            description: I.Text,
          }),
        ),
      ],
      ["query"],
    ),
    getTreasuryBalance: I.Func([I.Text], [I.Nat], ["query"]),
    getTreasurySummary: I.Func([], [I.Vec(I.Tuple(I.Text, I.Nat))], ["query"]),
    platformFeeRate_: I.Func([], [I.Nat], ["query"]),
    setPlatformFeeRate: I.Func([Address, I.Nat], [I.Bool], []),
    getHeadsUpPlatformFeeBps: I.Func([], [I.Nat], ["query"]),
    setHeadsUpPlatformFeeBps: I.Func([Address, I.Nat], [I.Bool], []),
    getTournamentPlatformFeeBps: I.Func([], [I.Nat], ["query"]),
    setTournamentPlatformFeeBps: I.Func([Address, I.Nat], [I.Bool], []),
    getPlatformXftId: I.Func([], [I.Nat], ["query"]),
    getPlatformBagPrincipal: I.Func([], [I.Text], ["query"]),
    getPlatformFeePrincipal: I.Func([], [I.Text], ["query"]),
    setPlatformXftId: I.Func(
      [Address, I.Nat],
      [I.Record({ ok: I.Bool, err: I.Text, bag: I.Text })],
      [],
    ),
    setPlatformFeePrincipal: I.Func(
      [Address, I.Text],
      [I.Record({ ok: I.Bool, err: I.Text })],
      [],
    ),
    getArcadePlatformFeeBps: I.Func([], [I.Nat], ["query"]),
    setArcadePlatformFeeBps: I.Func([Address, I.Nat], [I.Bool], []),
    /** Flat e8s charged when submitting a cabinet for testing (admin-set). */
    getArcadeSubmitFeeE8s: I.Func([], [I.Nat], ["query"]),
    setArcadeSubmitFeeE8s: I.Func([Address, I.Nat], [I.Bool], []),
    feeRecipient_: I.Func([], [Address], ["query"]),
    setFeeRecipient: I.Func([Address, Address], [I.Bool], []),
    /** Native ICP: play sub → challenge escrow */
    debitChallengeEntryFeeNativeICP: I.Func(
      [ChallengeId, I.Nat],
      [I.Bool],
      [],
    ),
    /** Native ICP: play sub → tournament escrow */
    debitTournamentEntryFeeNativeICP: I.Func(
      [TournamentId, I.Nat],
      [I.Bool],
      [],
    ),
    /** Native ICP: play sub → room escrow */
    debitRoomChallengeEntryFeeNativeICP: I.Func(
      [I.Text, ChallengeId, I.Nat],
      [I.Bool],
      [],
    ),
    /** Arcade insert: play sub → escrow (+ platform cut). Returns { ok, err }. */
    debitArcadePlayFeeNativeICP: I.Func(
      [I.Text, I.Nat],
      [I.Record({ ok: I.Bool, err: I.Text })],
      [],
    ),
    /**
     * Arcade submit-for-testing: play sub → platform (admin-set flat fee).
     * Amount from canister policy; gameId for memo + idempotency.
     */
    debitArcadeSubmitFeeNativeICP: I.Func(
      [I.Text],
      [I.Record({ ok: I.Bool, err: I.Text })],
      [],
    ),
    getIcpLedgerPrincipal: I.Func([], [I.Principal], ["query"]),
    /** Shop merch: play sub → platform wallet (amount e8s); orderId in memo */
    debitShopMerchNativeICP: I.Func(
      [I.Text, I.Nat],
      [I.Record({ ok: I.Bool, err: I.Text })],
      [],
    ),
    claimArcadeWinningsNativeICP: I.Func(
      [I.Text, I.Nat],
      [I.Record({ ok: I.Bool, err: I.Text, amount: I.Nat })],
      [],
    ),
    /**
     * Payout challenge pot → winner play sub + optional mod play sub +
     * platform wallet + community vault subaccount.
     */
    distributeChallengePrizeNativeICP: I.Func(
      [ChallengeId, I.Principal, I.Opt(I.Principal)],
      [
        I.Record({
          ok: I.Bool,
          err: I.Text,
          amount: I.Nat,
          amounts: I.Record({
            winner: I.Nat,
            host: I.Nat,
            mod: I.Nat,
            platform: I.Nat,
            vault: I.Nat,
          }),
        }),
      ],
      [],
    ),
    distributeTournamentPrizesNativeICP: I.Func(
      [
        TournamentId,
        I.Vec(I.Tuple(I.Principal, I.Nat)),
        I.Principal,
        I.Opt(I.Principal),
      ],
      [
        I.Record({
          ok: I.Bool,
          err: I.Text,
          transfers: I.Nat,
          amounts: I.Record({
            winner: I.Nat,
            host: I.Nat,
            mod: I.Nat,
            platform: I.Nat,
            vault: I.Nat,
          }),
        }),
      ],
      [],
    ),
    distributeRoomChallengePrizeNativeICP: I.Func(
      [I.Text, ChallengeId, I.Principal, I.Principal, I.Opt(I.Principal)],
      [
        I.Record({
          ok: I.Bool,
          err: I.Text,
          amounts: I.Record({
            winner: I.Nat,
            host: I.Nat,
            mod: I.Nat,
            platform: I.Nat,
            vault: I.Nat,
          }),
        }),
      ],
      [],
    ),
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
    /** Group game inside an existing room community (max seats, buy-in) */
    createRoomChallenge: I.Func(
      [Address, I.Text, I.Text, I.Text, I.Nat, I.Nat, I.Text],
      [I.Text],
      [],
    ),
    joinRoomChallenge: I.Func([Address, ChallengeId], [I.Bool], []),
    /** Game host starts FFA when table is full (status open → live) */
    startRoomChallenge: I.Func([Address, ChallengeId], [I.Bool], []),
    /** Game host reports FFA winner (status live → settled). No dispute. */
    recordRoomChallengeWinner: I.Func(
      [Address, ChallengeId, Address],
      [I.Bool],
      [],
    ),
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
    // Moderators / admin console
    listModerators: I.Func([], [I.Vec(Moderator)], ["query"]),
    listAllModerators: I.Func([], [I.Vec(Moderator)], ["query"]),
    getModerator: I.Func([Address], [I.Opt(Moderator)], ["query"]),
    isAdmin: I.Func([Address], [I.Bool], ["query"]),
    /** Grant/revoke admin flag — caller must already be admin (or bootstrap if none). */
    setAdmin: I.Func([Address, I.Bool], [I.Bool], []),
    listAdmins: I.Func([], [I.Vec(Address)], ["query"]),
    appointModerator: I.Func([Address, Address, ModeratorRole], [I.Bool], []),
    applyBaseReferee: I.Func([Address], [I.Bool], []),
    promoteModerator: I.Func([Address, Address], [I.Bool], []),
    listActiveDisputes: I.Func([], [I.Vec(Dispute)], ["query"]),
    getDispute: I.Func([ChallengeId], [I.Opt(Dispute)], ["query"]),
    voteOnDispute: I.Func(
      [ChallengeId, Address, Address, I.Nat],
      [I.Bool],
      [],
    ),
    finalizeDispute: I.Func([ChallengeId, Address], [I.Bool], []),
    getPenalty: I.Func(
      [Address],
      [I.Opt(I.Record({ surchargeUntil: I.Nat64, multiplier: I.Nat }))],
      ["query"],
    ),
    // Device sync (multi-II primary / alias)
    create_device_sync_code: I.Func(
      [],
      [
        I.Record({
          success: I.Bool,
          code: I.Text,
          expires_at: I.Int,
          message: I.Text,
        }),
      ],
      [],
    ),
    claim_device_sync_code: I.Func(
      [I.Text],
      [
        I.Record({
          success: I.Bool,
          primary: I.Text,
          message: I.Text,
        }),
      ],
      [],
    ),
    get_canonical_principal: I.Func(
      [I.Principal],
      [I.Principal],
      ["query"],
    ),
    list_linked_devices: I.Func(
      [],
      [
        I.Record({
          primary: I.Text,
          devices: I.Vec(I.Text),
          is_primary: I.Bool,
        }),
      ],
      ["query"],
    ),
    unlink_device: I.Func(
      [I.Principal],
      [I.Record({ success: I.Bool, message: I.Text })],
      [],
    ),
    set_linked_betable_principal: I.Func(
      [I.Text],
      [I.Record({ success: I.Bool, message: I.Text })],
      [],
    ),
    get_linked_betable_principal: I.Func([], [I.Opt(I.Text)], ["query"]),
    clear_linked_betable_principal: I.Func(
      [],
      [I.Record({ success: I.Bool, message: I.Text })],
      [],
    ),
    set_linked_afta_principal: I.Func(
      [I.Text],
      [I.Record({ success: I.Bool, message: I.Text })],
      [],
    ),
    get_linked_afta_principal: I.Func([], [I.Opt(I.Text)], ["query"]),
    get_ownership_principals: I.Func([], [I.Vec(I.Text)], ["query"]),
  });
};

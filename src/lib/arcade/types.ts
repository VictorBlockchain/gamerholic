/**
 * High Score Arcade — AI-created games on a standardized Phaser 3 host.
 * Creators submit CSS + game JS only — never a full HTML document.
 */

export type PlayFeeToken = "ICP" | "GAMER";

/**
 * Community approval lifecycle for a cabinet.
 * - **testing** — submitted for playtests; real insert coins + leaderboard; creator may edit CSS/gameCode
 * - **live** — 10+ upvotes; open to everyone; tester scores stay on the board
 */
export type ArcadeGameStatus = "testing" | "live";

/** Upvotes required to promote a testing cabinet to live. */
export const ARCADE_LIVE_UPVOTE_THRESHOLD = 10;

/** Standardized runtime (host-provided). */
export type ArcadeEngineId = "phaser3";

/** Game-asset XFT the title accepts (Dexsta type-8 game_asset). */
export type AcceptedGameAsset = {
  /** Dexsta XFT token id */
  tokenId: number;
  /** Designer label shown in UI */
  label: string;
  /** Role in game e.g. weapon, hat, skin */
  role: string;
  notes?: string;
};

export type ArcadeGame = {
  id: string;
  title: string;
  description: string;
  /** Rules + controls (markdown-ish plain text) */
  rules: string;
  /** Cover / cabinet art (data URL or /public path) */
  imageUrl: string;
  /**
   * Optional CSS only (no <html>). Prefer scoping under #gh-arcade-root.
   */
  css: string;
  /**
   * Game logic only (no <html>). Must register:
   * window.GamerholicArcadeGame = { boot(Phaser, bridge, parentEl) { ... } }
   */
  gameCode: string;
  /** Host engine — always phaser3 for new titles */
  engine: ArcadeEngineId;
  /** @deprecated Legacy full HTML — migrated via host shell when present without gameCode */
  htmlCode?: string;
  /** Play fee amount (human units, e.g. 0.003) */
  playFee: number;
  playFeeToken: PlayFeeToken;
  /**
   * How many defenders split a non-record play fee (players ranked above the run).
   * 1–10 (default 3).
   */
  payoutTopN: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  /** Session length in seconds */
  playTimeSec: number;
  /** Creator username / principal */
  creator: string;
  creatorPrincipal: string;
  /**
   * Per-game escrow id (deterministic demo subaccount label).
   * On-chain: dedicated ICRC subaccount under platform/game vault.
   * Play fees enter escrow; winnings stay until claim.
   */
  escrowId: string;
  /**
   * Dexsta Lead Label id this cabinet is bound to.
   * When set, host loads player's game-asset XFTs via getUserGameAssetXfts
   * and keeps only those with linkedTo === linkedLabelId.
   * When 0 / unset, equip pipeline is skipped entirely.
   */
  linkedLabelId: number;
  /** Optional design-time accepted ids/roles (hints for AI + UI) */
  acceptedGameAssets: AcceptedGameAsset[];
  plays: number;
  highScore: number;
  highScoreBy?: string;
  createdAt: string;
  /**
   * Visible in catalog (testing + live). Unpublished drafts stay local-only.
   */
  published: boolean;
  /**
   * Approval status. New cabinets start as `testing`.
   * Reach `live` after {@link ARCADE_LIVE_UPVOTE_THRESHOLD} unique upvotes.
   */
  status: ArcadeGameStatus;
  /** Unique tester upvotes toward go-live. */
  upvotes: number;
  /** Principals who already upvoted (one vote each). */
  upvotedBy: string[];
  /**
   * When the cabinet was promoted to live (null while testing).
   * Submission date is {@link createdAt}.
   */
  approvedAt?: string | null;
};

/** Comment channel matches cabinet lifecycle tab. */
export type ArcadeCommentChannel = "testing" | "live";

/** Bug = trackable defect; feedback = general notes. */
export type ArcadeCommentKind = "bug" | "feedback";

export type ArcadeComment = {
  id: string;
  gameId: string;
  channel: ArcadeCommentChannel;
  kind: ArcadeCommentKind;
  body: string;
  authorPrincipal: string;
  authorUsername: string;
  /** Bugs start false; feedback always false / ignored in UI */
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export type ArcadeRating = {
  id: string;
  gameId: string;
  principal: string;
  username: string;
  stars: number;
  createdAt: string;
  updatedAt?: string;
};

export type ArcadeRatingSummary = {
  average: number;
  count: number;
  /** Current user's stars (0 if none) */
  mine: number;
};

export type ArcadeTester = {
  principal: string;
  username: string;
  plays: number;
  lastAt: string;
};

/** On-chain-shaped escrow balance for one cabinet */
export type GameEscrowAccount = {
  gameId: string;
  escrowId: string;
  /** Tokens held in escrow (fees in, claims out) */
  icp: number;
  gamer: number;
  /** Platform 1.5% accrued (claimable by platform later) */
  platformIcp: number;
  platformGamer: number;
};

/**
 * Per-player earnings for a single arcade game (escrow ledger).
 * Winnings / creator fees accumulate here — user must claim to play subaccount.
 */
export type PlayerGameEarnings = {
  gameId: string;
  principal: string;
  username: string;
  /** Pending claim → user play subaccount */
  pendingIcp: number;
  pendingGamer: number;
  /** Lifetime earned (pending + already claimed) */
  lifetimeIcp: number;
  lifetimeGamer: number;
  claimedIcp: number;
  claimedGamer: number;
  updatedAt: string;
};

export type EarningsLedgerEntry = {
  id: string;
  gameId: string;
  principal: string;
  username: string;
  at: string;
  kind:
    | "prize_win"
    | "creator_fee"
    | "high_score_refund"
    | "claim_to_subaccount"
    | "play_fee_in";
  token: PlayFeeToken;
  amount: number;
  note: string;
};

export type LeaderboardEntry = {
  id: string;
  gameId: string;
  username: string;
  principal: string;
  score: number;
  /** Only paid sessions appear on official board */
  paid: boolean;
  playFeePaid: number;
  playFeeToken: PlayFeeToken;
  at: string;
  /** Session ended how */
  endReason: "timer" | "game" | "unload" | "manual";
  /** Settlement for this paid run (if any) */
  settlementKind?:
    | "new_high_score_refund"
    | "distributed"
    | "no_recipients"
    | "free";
  settlementNote?: string;
};

/** Audit log for fee splits / refunds */
export type ArcadePayoutEvent = {
  id: string;
  gameId: string;
  at: string;
  kind: "new_high_score_refund" | "distributed" | "no_recipients";
  playFee: number;
  token: PlayFeeToken;
  playerUsername: string;
  score: number;
  creatorCut: number;
  platformCut: number;
  prizePool: number;
  refundAmount?: number;
  potCredit?: number;
  lines: Array<{
    username: string;
    principal: string;
    rank: number;
    amount: number;
  }>;
  note: string;
};

export type PlaySession = {
  id: string;
  gameId: string;
  username: string;
  principal: string;
  paid: boolean;
  playFee: number;
  playFeeToken: PlayFeeToken;
  playTimeSec: number;
  startedAt: number;
  endsAt: number;
  score: number;
  submitted: boolean;
  endReason?: LeaderboardEntry["endReason"];
};

/** Runtime equip — includes wrap power from Dexsta bags */
export type EquippedGameAsset = {
  tokenId: number;
  /** If this token wraps another game asset (e.g. #99 wraps #45) */
  wrapsTokenId?: number;
  label: string;
  role: string;
  /** Power tokens (or attribute units) in the XFT bag — boosts effective power */
  bagPowerTokens: number;
  /** Base power for bare print; wraps + bag increase this */
  effectivePower: number;
  quantity: number;
  imageUrl?: string;
  /** Lead Label this asset nests under (Dexsta linkedTo) */
  linkedLabelId?: number;
};

/** postMessage protocol between host shell and React parent */
export type GhGameHostToGame =
  | {
      type: "gamerholic:init";
      sessionId: string;
      gameId: string;
      paid: boolean;
      playTimeSec: number;
      remainingSec: number;
      /** Official score only when paid === true */
      scoresCount: boolean;
      assets: EquippedGameAsset[];
    }
  | { type: "gamerholic:start"; sessionId: string; remainingSec: number }
  | { type: "gamerholic:tick"; remainingSec: number }
  | { type: "gamerholic:stop"; reason: string }
  | { type: "gamerholic:assets"; assets: EquippedGameAsset[] };

export type GhGameToHost =
  | { type: "gamerholic:ready" }
  | { type: "gamerholic:score"; score: number; final?: boolean }
  | { type: "gamerholic:end"; score: number }
  | { type: "gamerholic:requestAssets" };

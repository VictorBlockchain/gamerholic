/**
 * Arcade prize distribution (ranked / paid plays only).
 *
 * Flow per paid attempt with play fee F:
 * 1) New all-time high score (#1) → full fee refunded to player. Nobody paid.
 * 2) Otherwise:
 *    - Creator 3% of F
 *    - Platform 1.5% of F
 *    - Remaining 95.5% split among players ranked STRICTLY ABOVE this score
 *      (up to payoutTopN = 1–10). #1 of that set gets lion's share.
 *    - If only one player is above you → they take 100% of the prize share.
 *
 * Example:
 *  A scores 900 (HS) → A refunded
 *  B scores 870 → only A (above B) is paid
 *  C scores 1000 (new HS) → C refunded
 *  D scores 400 → C, A, B (top 3 above D) split prize · C > A > B shares
 */

import type { PlayFeeToken } from "./types";

export const CREATOR_FEE_BPS = 300; // 3%
export const PLATFORM_FEE_BPS = 150; // 1.5%
export const PRIZE_BPS = 10_000 - CREATOR_FEE_BPS - PLATFORM_FEE_BPS; // 9550 = 95.5%

/** How many defenders above a run share the prize pool (1–10). */
export type PayoutTopN = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const PAYOUT_TOP_N_MIN = 1;
export const PAYOUT_TOP_N_MAX = 10;

/** Clamp any input to a valid payout top N. Default 3. */
export function clampPayoutTopN(n: unknown): PayoutTopN {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return 3;
  if (v < PAYOUT_TOP_N_MIN) return PAYOUT_TOP_N_MIN;
  if (v > PAYOUT_TOP_N_MAX) return PAYOUT_TOP_N_MAX;
  return v as PayoutTopN;
}

/**
 * Relative weights — lion share to #1, decreasing down the board.
 * Sum is ~100. Classic 3/5 splits preserved; other N use geometric decay.
 */
export function payoutWeights(topN: PayoutTopN | number): number[] {
  const n = clampPayoutTopN(topN);
  if (n === 1) return [100];
  if (n === 2) return [65, 35];
  if (n === 3) return [50, 30, 20];
  if (n === 5) return [40, 25, 18, 12, 5];

  // Geometric decay for remaining sizes
  const r = 0.62;
  const raw = Array.from({ length: n }, (_, i) => Math.pow(r, i));
  const sum = raw.reduce((a, b) => a + b, 0);
  const weights = raw.map((w) => Math.max(1, Math.round((w / sum) * 100)));
  const total = weights.reduce((a, b) => a + b, 0);
  weights[0] = (weights[0] ?? 0) + (100 - total);
  return weights;
}

/** @deprecated Use {@link payoutWeights} — kept for UI that maps known keys. */
export const PAYOUT_WEIGHTS: Record<3 | 5, number[]> = {
  3: [50, 30, 20],
  5: [40, 25, 18, 12, 5],
};

export type ScoreRow = {
  id: string;
  username: string;
  principal: string;
  score: number;
  at: string;
};

export type PayoutLine = {
  username: string;
  principal: string;
  rank: number; // 1-based among recipients
  amount: number;
  weight: number;
};

export type PrizeSettlement =
  | {
      kind: "new_high_score_refund";
      playFee: number;
      token: PlayFeeToken;
      refundTo: { username: string; principal: string };
      /** Full fee returned */
      refundAmount: number;
      creatorCut: 0;
      platformCut: 0;
      prizePool: 0;
      payouts: [];
      note: string;
    }
  | {
      kind: "distributed";
      playFee: number;
      token: PlayFeeToken;
      creatorCut: number;
      platformCut: number;
      prizePool: number;
      creator: { username: string; principal: string };
      payouts: PayoutLine[];
      note: string;
    }
  | {
      kind: "no_recipients";
      playFee: number;
      token: PlayFeeToken;
      creatorCut: number;
      platformCut: number;
      prizePool: number;
      /** Unclaimed prize held on game pot */
      potCredit: number;
      note: string;
    };

function roundToken(amount: number, token: PlayFeeToken): number {
  if (token === "GAMER") return Math.round(amount * 100) / 100;
  // ICP e8s-ish
  return Math.round(amount * 1e8) / 1e8;
}

/**
 * Best score per principal (keeps highest), sorted desc.
 */
export function bestScoresByPrincipal(rows: ScoreRow[]): ScoreRow[] {
  const map = new Map<string, ScoreRow>();
  for (const r of rows) {
    const k = r.principal || r.username;
    const prev = map.get(k);
    if (!prev || r.score > prev.score) map.set(k, r);
  }
  return [...map.values()].sort(
    (a, b) => b.score - a.score || b.at.localeCompare(a.at),
  );
}

/**
 * Settle one paid play after its score is known.
 * `boardBefore` = paid scores already on the cabinet (excluding this attempt).
 */
export function settlePaidPlay(opts: {
  playFee: number;
  token: PlayFeeToken;
  score: number;
  player: { username: string; principal: string };
  creator: { username: string; principal: string };
  payoutTopN: PayoutTopN;
  /** Existing paid scores before this attempt */
  boardBefore: ScoreRow[];
}): PrizeSettlement {
  const fee = Math.max(0, opts.playFee);
  const token = opts.token;
  const topN = clampPayoutTopN(opts.payoutTopN);

  const bestBefore = bestScoresByPrincipal(opts.boardBefore);
  const prevHigh = bestBefore[0]?.score ?? 0;
  const isNewHigh = opts.score > prevHigh;

  if (isNewHigh) {
    return {
      kind: "new_high_score_refund",
      playFee: fee,
      token,
      refundTo: opts.player,
      refundAmount: roundToken(fee, token),
      creatorCut: 0,
      platformCut: 0,
      prizePool: 0,
      payouts: [],
      note: "New high score — play fee refunded. No payouts this run.",
    };
  }

  const creatorCut = roundToken((fee * CREATOR_FEE_BPS) / 10_000, token);
  const platformCut = roundToken((fee * PLATFORM_FEE_BPS) / 10_000, token);
  let prizePool = roundToken(fee - creatorCut - platformCut, token);
  // Fix dust
  if (prizePool < 0) prizePool = 0;

  // Players strictly above this score (defenders), best-per-principal
  const above = bestBefore.filter((r) => r.score > opts.score).slice(0, topN);

  if (above.length === 0) {
    return {
      kind: "no_recipients",
      playFee: fee,
      token,
      creatorCut,
      platformCut,
      prizePool,
      potCredit: prizePool,
      note: "No players ranked above this score — prize held in cabinet pot.",
    };
  }

  const weights = payoutWeights(topN).slice(0, above.length);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const payouts: PayoutLine[] = [];
  let allocated = 0;
  for (let i = 0; i < above.length; i++) {
    const w = weights[i]!;
    const isLast = i === above.length - 1;
    const amount = isLast
      ? roundToken(prizePool - allocated, token)
      : roundToken((prizePool * w) / wSum, token);
    allocated = roundToken(allocated + amount, token);
    payouts.push({
      username: above[i]!.username,
      principal: above[i]!.principal,
      rank: i + 1,
      amount,
      weight: w,
    });
  }

  const onlyOne = above.length === 1;
  return {
    kind: "distributed",
    playFee: fee,
    token,
    creatorCut,
    platformCut,
    prizePool,
    creator: opts.creator,
    payouts,
    note: onlyOne
      ? `Only #1 (${above[0]!.username}) ranked above — takes the full prize share (${formatPct(PRIZE_BPS)} of fee). Creator ${formatPct(CREATOR_FEE_BPS)} · platform ${formatPct(PLATFORM_FEE_BPS)}.`
      : `Top ${above.length} above this score split the prize (weights ${weights.join("/")}). Creator ${formatPct(CREATOR_FEE_BPS)} · platform ${formatPct(PLATFORM_FEE_BPS)}.`,
  };
}

function formatPct(bps: number) {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

export function describePayoutRules(topN: PayoutTopN | number): string {
  const n = clampPayoutTopN(topN);
  const w = payoutWeights(n);
  return (
    `Each cabinet has its own escrow. Top ${n} above your score share ${(PRIZE_BPS / 100).toFixed(1)}% of the fee ` +
    `(weights ${w.join("/")}) as claimable earnings. New high score → fee refunded to your play subaccount. ` +
    `Creator 3% · platform 1.5% on non-record plays. Prize / creator earnings require claim.`
  );
}

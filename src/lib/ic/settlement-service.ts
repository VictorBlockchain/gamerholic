/**
 * Native ICP settlements — debit entry fees into escrow subaccounts and
 * distribute pots to play subaccounts (winner / host / mod) + platform + vault.
 *
 * Production ledger: ryjl3-tyaaa-aaaaa-aaaba-cai (set on canister as icpLedgerPrincipal).
 * User balances: getUserICPBalance(principal) → owner = gh_backend, subaccount = principal blob.
 */

import type { Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import {
  createBackendActor,
  icpToE8s,
  isCanisterConfigured,
} from "./canisters";

export type PayoutAmounts = {
  winner: number;
  host: number;
  mod: number;
  platform: number;
  vault: number;
};

function asActor(identity?: Identity | null) {
  return createBackendActor(identity) as Promise<any>;
}

function optPrincipal(p?: string | null): [] | [Principal] {
  if (!p || !p.trim()) return [];
  try {
    return [Principal.fromText(p.trim())];
  } catch {
    return [];
  }
}

function mapAmounts(a: any): PayoutAmounts {
  return {
    winner: Number(a?.winner ?? 0) / 1e8,
    host: Number(a?.host ?? 0) / 1e8,
    mod: Number(a?.mod ?? 0) / 1e8,
    platform: Number(a?.platform ?? 0) / 1e8,
    vault: Number(a?.vault ?? 0) / 1e8,
  };
}

/** Skip chain money when free (0 ICP). */
export function needsIcpSettlement(amountIcp: number): boolean {
  return Number.isFinite(amountIcp) && amountIcp > 0;
}

// ─── Debits (caller play subaccount → escrow) ───────────────────────────────

export async function debitChallengeEntry(
  challengeId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<boolean> {
  if (!needsIcpSettlement(amountIcp)) return true;
  if (!isCanisterConfigured()) throw new Error("Canister not configured");
  const actor = await asActor(identity);
  if (!actor?.debitChallengeEntryFeeNativeICP) {
    throw new Error("debitChallengeEntryFeeNativeICP not available on canister");
  }
  return Boolean(
    await actor.debitChallengeEntryFeeNativeICP(
      challengeId,
      icpToE8s(amountIcp),
    ),
  );
}

export async function debitTournamentEntry(
  tournamentId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<boolean> {
  if (!needsIcpSettlement(amountIcp)) return true;
  if (!isCanisterConfigured()) throw new Error("Canister not configured");
  const actor = await asActor(identity);
  if (!actor?.debitTournamentEntryFeeNativeICP) {
    throw new Error("debitTournamentEntryFeeNativeICP not available");
  }
  return Boolean(
    await actor.debitTournamentEntryFeeNativeICP(
      tournamentId,
      icpToE8s(amountIcp),
    ),
  );
}

export async function debitRoomGameEntry(
  roomId: string,
  challengeId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<boolean> {
  if (!needsIcpSettlement(amountIcp)) return true;
  if (!isCanisterConfigured()) throw new Error("Canister not configured");
  const actor = await asActor(identity);
  if (!actor?.debitRoomChallengeEntryFeeNativeICP) {
    throw new Error("debitRoomChallengeEntryFeeNativeICP not available");
  }
  return Boolean(
    await actor.debitRoomChallengeEntryFeeNativeICP(
      roomId,
      challengeId,
      icpToE8s(amountIcp),
    ),
  );
}

export async function debitArcadePlayFee(
  gameId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<boolean> {
  if (!needsIcpSettlement(amountIcp)) return true;
  if (!isCanisterConfigured()) throw new Error("Canister not configured");
  const actor = await asActor(identity);
  if (!actor?.debitArcadePlayFeeNativeICP) {
    throw new Error("debitArcadePlayFeeNativeICP not available");
  }
  return Boolean(
    await actor.debitArcadePlayFeeNativeICP(gameId, icpToE8s(amountIcp)),
  );
}

// ─── Distributions (escrow → play subaccounts / platform / vault) ────────────

/**
 * Heads-up prize: winner play subaccount + optional mod + platform + community vault.
 * No tournament/room host cut.
 */
export async function distributeChallengePrize(opts: {
  challengeId: string;
  winnerPrincipal: string;
  moderatorPrincipal?: string | null;
  identity?: Identity | null;
}): Promise<{ ok: boolean; err: string; amounts: PayoutAmounts }> {
  const actor = await asActor(opts.identity);
  if (!actor?.distributeChallengePrizeNativeICP) {
    return {
      ok: false,
      err: "distributeChallengePrizeNativeICP not available",
      amounts: { winner: 0, host: 0, mod: 0, platform: 0, vault: 0 },
    };
  }
  const winner = Principal.fromText(opts.winnerPrincipal);
  const mod = optPrincipal(opts.moderatorPrincipal);
  const r = await actor.distributeChallengePrizeNativeICP(
    opts.challengeId,
    winner,
    mod,
  );
  return {
    ok: Boolean(r?.ok),
    err: String(r?.err || ""),
    amounts: mapAmounts(r?.amounts),
  };
}

/**
 * Tournament: winners (share of winner pool) + host play sub + optional mod + platform + vault.
 */
export async function distributeTournamentPrize(opts: {
  tournamentId: string;
  /** Winner principals with bps of the winner pool (usually one winner @ 10000) */
  winners: { principal: string; poolBps: number }[];
  hostPrincipal: string;
  moderatorPrincipal?: string | null;
  identity?: Identity | null;
}): Promise<{ ok: boolean; err: string; amounts: PayoutAmounts }> {
  const actor = await asActor(opts.identity);
  if (!actor?.distributeTournamentPrizesNativeICP) {
    return {
      ok: false,
      err: "distributeTournamentPrizesNativeICP not available",
      amounts: { winner: 0, host: 0, mod: 0, platform: 0, vault: 0 },
    };
  }
  const winners = opts.winners.map(
    (w) =>
      [Principal.fromText(w.principal), BigInt(w.poolBps)] as [
        Principal,
        bigint,
      ],
  );
  const host = Principal.fromText(opts.hostPrincipal);
  const mod = optPrincipal(opts.moderatorPrincipal);
  const r = await actor.distributeTournamentPrizesNativeICP(
    opts.tournamentId,
    winners,
    host,
    mod,
  );
  return {
    ok: Boolean(r?.ok),
    err: String(r?.err || ""),
    amounts: mapAmounts(r?.amounts),
  };
}

/**
 * Room FFA: winner + room host + optional mod play subs + platform + vault.
 */
export async function distributeRoomGamePrize(opts: {
  roomId: string;
  challengeId: string;
  winnerPrincipal: string;
  hostPrincipal: string;
  moderatorPrincipal?: string | null;
  identity?: Identity | null;
}): Promise<{ ok: boolean; err: string; amounts: PayoutAmounts }> {
  const actor = await asActor(opts.identity);
  if (!actor?.distributeRoomChallengePrizeNativeICP) {
    return {
      ok: false,
      err: "distributeRoomChallengePrizeNativeICP not available",
      amounts: { winner: 0, host: 0, mod: 0, platform: 0, vault: 0 },
    };
  }
  const r = await actor.distributeRoomChallengePrizeNativeICP(
    opts.roomId,
    opts.challengeId,
    Principal.fromText(opts.winnerPrincipal),
    Principal.fromText(opts.hostPrincipal),
    optPrincipal(opts.moderatorPrincipal),
  );
  return {
    ok: Boolean(r?.ok),
    err: String(r?.err || ""),
    amounts: mapAmounts(r?.amounts),
  };
}

export async function claimArcadeWinningsOnChain(
  gameId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<{ ok: boolean; err: string; amountIcp: number }> {
  if (!needsIcpSettlement(amountIcp)) {
    return { ok: true, err: "", amountIcp: 0 };
  }
  const actor = await asActor(identity);
  if (!actor?.claimArcadeWinningsNativeICP) {
    return {
      ok: false,
      err: "claimArcadeWinningsNativeICP not available",
      amountIcp: 0,
    };
  }
  const r = await actor.claimArcadeWinningsNativeICP(
    gameId,
    icpToE8s(amountIcp),
  );
  return {
    ok: Boolean(r?.ok),
    err: String(r?.err || ""),
    amountIcp: Number(r?.amount ?? 0) / 1e8,
  };
}

/**
 * Human-readable split policy for UI.
 * Host/mod bps only apply when those principals are provided.
 */
export const PAYOUT_POLICY = {
  hostBps: 500,
  modBps: 200,
  platformBps: 400,
  vaultBps: 100,
  /** Winner gets the remainder (≈90% with host+mod, more without) */
  note: "Winner + platform + community vault; host (room/tournament) and moderator when present. User cuts credit play subaccounts on gh_backend.",
} as const;

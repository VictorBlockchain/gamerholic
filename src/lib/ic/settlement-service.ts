/**
 * Native ICP settlements — debit entry fees into escrow subaccounts and
 * distribute pots to play subaccounts (winner / host / mod) + platform + vault.
 *
 * Production ledger: ryjl3-tyaaa-aaaaa-aaaba-cai (mainnet ICP).
 * User balances: getUserICPBalance(principal) → owner = gh_backend, subaccount = principal blob.
 *
 * All public helpers catch agent/canister rejects and return { ok, err } where possible.
 */

import type { Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import {
  createBackendActor,
  icpToE8s,
  isCanisterConfigured,
} from "./canisters";
import {
  formatCanisterError,
  parseOkErr,
  safeCanisterCall,
} from "./canister-errors";

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

async function callDebitBool(
  method: string,
  invoke: (actor: any) => Promise<unknown>,
  identity?: Identity | null,
): Promise<{ ok: boolean; err?: string }> {
  if (!isCanisterConfigured()) {
    return { ok: false, err: "Canister not configured" };
  }
  const actor = await asActor(identity);
  if (!actor || typeof actor[method] !== "function") {
    return {
      ok: false,
      err: `${method} not available — redeploy gh_backend`,
    };
  }
  const res = await safeCanisterCall(
    () => invoke(actor),
    `${method} failed`,
  );
  if (!res.ok) return { ok: false, err: res.err };
  // bool or {ok,err}
  if (typeof res.data === "boolean") {
    return {
      ok: res.data,
      err: res.data
        ? undefined
        : "Debit failed — deposit ICP to your play subaccount",
    };
  }
  const parsed = parseOkErr(
    res.data,
    "Debit failed — deposit ICP to your play subaccount",
  );
  return { ok: parsed.ok, err: parsed.ok ? undefined : parsed.err };
}

// ─── Debits (caller play subaccount → escrow) ───────────────────────────────

export async function debitChallengeEntry(
  challengeId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<boolean> {
  if (!needsIcpSettlement(amountIcp)) return true;
  const r = await callDebitBool(
    "debitChallengeEntryFeeNativeICP",
    (a) =>
      a.debitChallengeEntryFeeNativeICP(challengeId, icpToE8s(amountIcp)),
    identity,
  );
  if (!r.ok && r.err) {
    console.warn("[settlement] debitChallengeEntry", r.err);
  }
  return r.ok;
}

export async function debitTournamentEntry(
  tournamentId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<boolean> {
  if (!needsIcpSettlement(amountIcp)) return true;
  const r = await callDebitBool(
    "debitTournamentEntryFeeNativeICP",
    (a) =>
      a.debitTournamentEntryFeeNativeICP(tournamentId, icpToE8s(amountIcp)),
    identity,
  );
  if (!r.ok && r.err) {
    console.warn("[settlement] debitTournamentEntry", r.err);
  }
  return r.ok;
}

export async function debitRoomGameEntry(
  roomId: string,
  challengeId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<boolean> {
  if (!needsIcpSettlement(amountIcp)) return true;
  const r = await callDebitBool(
    "debitRoomChallengeEntryFeeNativeICP",
    (a) =>
      a.debitRoomChallengeEntryFeeNativeICP(
        roomId,
        challengeId,
        icpToE8s(amountIcp),
      ),
    identity,
  );
  if (!r.ok && r.err) {
    console.warn("[settlement] debitRoomGameEntry", r.err);
  }
  return r.ok;
}

/**
 * Debit arcade insert from play subaccount (native ICP ledger ryjl3-… on mainnet).
 */
export async function debitArcadePlayFee(
  gameId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<{ ok: boolean; err?: string }> {
  if (!needsIcpSettlement(amountIcp)) return { ok: true };
  return callDebitBool(
    "debitArcadePlayFeeNativeICP",
    (a) => a.debitArcadePlayFeeNativeICP(gameId, icpToE8s(amountIcp)),
    identity,
  );
}

/**
 * Debit admin-set arcade submit fee (play sub → platform) when shipping a cabinet for testing.
 * Amount is fixed on-chain; gameId is for memo + idempotent retries.
 */
export async function debitArcadeSubmitFee(
  gameId: string,
  identity?: Identity | null,
): Promise<{ ok: boolean; err: string }> {
  if (!gameId?.trim()) return { ok: false, err: "Missing game id" };
  if (!isCanisterConfigured()) {
    return { ok: false, err: "Canister not configured" };
  }
  const actor = await asActor(identity);
  if (!actor?.debitArcadeSubmitFeeNativeICP) {
    return {
      ok: false,
      err: "debitArcadeSubmitFeeNativeICP not available — redeploy gh_backend",
    };
  }
  const res = await safeCanisterCall(
    () => actor.debitArcadeSubmitFeeNativeICP(gameId.trim()),
    "Arcade submit fee failed",
  );
  if (!res.ok) return { ok: false, err: res.err };
  const parsed = parseOkErr(res.data, "Arcade submit fee failed");
  return { ok: parsed.ok, err: parsed.err };
}

/**
 * Shop merch checkout: debit whole-order ICP from caller play sub → platform wallet.
 */
export async function debitShopMerch(
  orderId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<{ ok: boolean; err: string }> {
  if (!needsIcpSettlement(amountIcp)) return { ok: true, err: "" };
  if (!orderId?.trim()) return { ok: false, err: "Missing order id" };
  if (!isCanisterConfigured()) {
    return { ok: false, err: "Canister not configured" };
  }
  const actor = await asActor(identity);
  if (!actor?.debitShopMerchNativeICP) {
    return {
      ok: false,
      err: "debitShopMerchNativeICP not available — redeploy gh_backend",
    };
  }
  const res = await safeCanisterCall(
    () =>
      actor.debitShopMerchNativeICP(orderId.trim(), icpToE8s(amountIcp)),
    "Shop debit failed",
  );
  if (!res.ok) return { ok: false, err: res.err };
  const parsed = parseOkErr(res.data, "Shop debit failed");
  return { ok: parsed.ok, err: parsed.err };
}

// ─── Distributions (escrow → play subaccounts / platform / vault) ────────────

async function callPayout(
  method: string,
  invoke: (actor: any) => Promise<any>,
  identity?: Identity | null,
): Promise<{ ok: boolean; err: string; amounts: PayoutAmounts }> {
  const empty = { winner: 0, host: 0, mod: 0, platform: 0, vault: 0 };
  if (!isCanisterConfigured()) {
    return { ok: false, err: "Canister not configured", amounts: empty };
  }
  const actor = await asActor(identity);
  if (!actor || typeof actor[method] !== "function") {
    return {
      ok: false,
      err: `${method} not available — redeploy gh_backend`,
      amounts: empty,
    };
  }
  const res = await safeCanisterCall(() => invoke(actor), `${method} failed`);
  if (!res.ok) {
    return { ok: false, err: res.err, amounts: empty };
  }
  const r = res.data as any;
  return {
    ok: Boolean(r?.ok),
    err: String(r?.err || (r?.ok ? "" : "Payout failed")),
    amounts: mapAmounts(r?.amounts),
  };
}

export async function distributeChallengePrize(opts: {
  challengeId: string;
  winnerPrincipal: string;
  moderatorPrincipal?: string | null;
  identity?: Identity | null;
}): Promise<{ ok: boolean; err: string; amounts: PayoutAmounts }> {
  return callPayout(
    "distributeChallengePrizeNativeICP",
    (a) =>
      a.distributeChallengePrizeNativeICP(
        opts.challengeId,
        Principal.fromText(opts.winnerPrincipal),
        optPrincipal(opts.moderatorPrincipal),
      ),
    opts.identity,
  );
}

export async function distributeTournamentPrize(opts: {
  tournamentId: string;
  winners: { principal: string; poolBps: number }[];
  hostPrincipal: string;
  moderatorPrincipal?: string | null;
  identity?: Identity | null;
}): Promise<{ ok: boolean; err: string; amounts: PayoutAmounts }> {
  const winners = opts.winners.map(
    (w) =>
      [Principal.fromText(w.principal), BigInt(w.poolBps)] as [
        Principal,
        bigint,
      ],
  );
  return callPayout(
    "distributeTournamentPrizesNativeICP",
    (a) =>
      a.distributeTournamentPrizesNativeICP(
        opts.tournamentId,
        winners,
        Principal.fromText(opts.hostPrincipal),
        optPrincipal(opts.moderatorPrincipal),
      ),
    opts.identity,
  );
}

export async function distributeRoomGamePrize(opts: {
  roomId: string;
  challengeId: string;
  winnerPrincipal: string;
  hostPrincipal: string;
  moderatorPrincipal?: string | null;
  identity?: Identity | null;
}): Promise<{ ok: boolean; err: string; amounts: PayoutAmounts }> {
  return callPayout(
    "distributeRoomChallengePrizeNativeICP",
    (a) =>
      a.distributeRoomChallengePrizeNativeICP(
        opts.roomId,
        opts.challengeId,
        Principal.fromText(opts.winnerPrincipal),
        Principal.fromText(opts.hostPrincipal),
        optPrincipal(opts.moderatorPrincipal),
      ),
    opts.identity,
  );
}

export async function claimArcadeWinningsOnChain(
  gameId: string,
  amountIcp: number,
  identity?: Identity | null,
): Promise<{ ok: boolean; err: string; amountIcp: number }> {
  if (!needsIcpSettlement(amountIcp)) {
    return { ok: true, err: "", amountIcp: 0 };
  }
  if (!isCanisterConfigured()) {
    return { ok: false, err: "Canister not configured", amountIcp: 0 };
  }
  const actor = await asActor(identity);
  if (!actor?.claimArcadeWinningsNativeICP) {
    return {
      ok: false,
      err: "claimArcadeWinningsNativeICP not available — redeploy gh_backend",
      amountIcp: 0,
    };
  }
  const res = await safeCanisterCall(
    () =>
      actor.claimArcadeWinningsNativeICP(gameId, icpToE8s(amountIcp)),
    "Arcade claim failed",
  );
  if (!res.ok) {
    return { ok: false, err: res.err, amountIcp: 0 };
  }
  const r = res.data as { ok?: boolean; err?: string; amount?: bigint | number };
  return {
    ok: Boolean(r?.ok),
    err: String(r?.err || (r?.ok ? "" : "Claim failed")),
    amountIcp: Number(r?.amount ?? 0) / 1e8,
  };
}

/** Withdraw ICP from play subaccount to a principal (wallet UI). */
export async function withdrawPlayIcp(
  amountIcp: number,
  toPrincipal: string,
  identity?: Identity | null,
): Promise<{ ok: boolean; err: string }> {
  if (!needsIcpSettlement(amountIcp)) {
    return { ok: false, err: "Amount must be > 0" };
  }
  if (!toPrincipal?.trim()) {
    return { ok: false, err: "Destination principal required" };
  }
  if (!isCanisterConfigured()) {
    return { ok: false, err: "Canister not configured" };
  }
  let dest: Principal;
  try {
    dest = Principal.fromText(toPrincipal.trim());
  } catch {
    return { ok: false, err: "Invalid destination principal" };
  }
  const actor = await asActor(identity);
  if (!actor?.withdrawICP) {
    return {
      ok: false,
      err: "withdrawICP not available — redeploy gh_backend",
    };
  }
  const res = await safeCanisterCall(
    () => actor.withdrawICP(icpToE8s(amountIcp), dest),
    "Withdraw failed",
  );
  if (!res.ok) return { ok: false, err: res.err };
  const parsed = parseOkErr(res.data, "Withdraw failed");
  return { ok: parsed.ok, err: parsed.err };
}

/**
 * Human-readable split policy for UI.
 */
/**
 * Default UI hints — live rates come from canister getFeePolicy.
 * Heads-up platform default 10% (1000 bps); tournament/room 5% (500 bps).
 */
export const PAYOUT_POLICY = {
  hostBps: 500,
  modBps: 200,
  /** @deprecated prefer headsUp / tournament platform bps from fee policy */
  platformBps: 500,
  headsUpPlatformBps: 1000,
  tournamentPlatformBps: 500,
  vaultBps: 100,
  note: "Winner + platform + community vault; host (room/tournament) and moderator when present. User cuts credit play subaccounts on gh_backend. When platformXftId > 0, 50% of platform fees go to the Dexsta XFT bag.",
} as const;

/** Re-export for UI toasts */
export { formatCanisterError } from "./canister-errors";

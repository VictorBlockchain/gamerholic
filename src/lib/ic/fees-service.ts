/**
 * Admin fee ledger + policy — treasury transactions and fee rates from gh_backend.
 */

import type { Identity } from "@dfinity/agent";
import {
  createBackendActor,
  e8sToIcp,
  isCanisterConfigured,
} from "./canisters";

export type TreasuryTxType =
  | "Deposit"
  | "Withdrawal"
  | "RakeCollection"
  | "PrizeDistribution"
  | "PlatformFee"
  | "TreasuryAllocation";

export type TreasuryTx = {
  id: string;
  timestampMs: number;
  type: TreasuryTxType;
  token: string;
  amountIcp: number;
  amountRaw: number;
  from?: string;
  to?: string;
  challengeId?: string;
  tournamentId?: string;
  description: string;
};

export type FeePolicy = {
  /** Tournament/legacy platform rake % (0–100), synced from tournament bps */
  platformFeeRatePct: number;
  /** Heads-up (1v1) platform fee bps of pot — default 1000 = 10% */
  headsUpPlatformFeeBps: number;
  /** Tournament/room platform fee bps of pot — default 500 = 5% */
  tournamentPlatformFeeBps: number;
  /** Arcade platform fee bps of play fee */
  arcadePlatformFeeBps: number;
  /** Flat ICP to submit a cabinet for testing (admin-set) */
  arcadeSubmitFeeIcp: number;
  /** Same fee in e8s (source of truth on canister) */
  arcadeSubmitFeeE8s: number;
  /** Dexsta XFT id for platform bag (0 = disabled) */
  platformXftId: number;
  /** Cached bag principal text when platformXftId > 0 */
  platformBagPrincipal: string;
  /** Live ICP payout principal for platform fee (non-bag share) */
  platformFeePrincipal: string;
  /** Legacy fee recipient text (kept in sync when payout principal is set) */
  feeRecipient: string;
};

function asActor(identity?: Identity | null) {
  return createBackendActor(identity) as Promise<any>;
}

function variantKey(v: unknown): string {
  if (v && typeof v === "object") {
    const k = Object.keys(v as object)[0];
    if (k) return k;
  }
  return "Deposit";
}

function tsToMs(n: bigint | number): number {
  const v = typeof n === "bigint" ? Number(n) : n;
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (v > 1e15) return Math.floor(v / 1e6);
  if (v < 1e12) return Math.floor(v * 1000);
  return Math.floor(v);
}

function unwrapOptText(o: unknown): string | undefined {
  if (o == null) return undefined;
  if (Array.isArray(o)) return o[0] != null ? String(o[0]) : undefined;
  return String(o);
}

export async function listTreasuryTransactions(
  identity?: Identity | null,
  limit = 100,
): Promise<TreasuryTx[]> {
  if (!isCanisterConfigured()) return [];
  try {
    const actor = await asActor(identity);
    if (!actor?.getTreasuryTransactions) return [];
    const rows = await actor.getTreasuryTransactions(
      [BigInt(limit)],
      [BigInt(0)],
      [],
      [],
    );
    return (rows || [])
      .map((tx: any) => {
        const raw = Number(tx.amount ?? 0);
        const token = String(tx.tokenType || "ICP");
        // amounts are stored in e8s for ICP/WICP in native path; legacy may be same unit
        const amountIcp =
          token === "ICP" || token === "WICP" ? raw / 1e8 : raw;
        return {
          id: String(tx.id),
          timestampMs: tsToMs(tx.timestamp),
          type: variantKey(tx.transactionType) as TreasuryTxType,
          token,
          amountIcp,
          amountRaw: raw,
          from: unwrapOptText(tx.fromAddress),
          to: unwrapOptText(tx.toAddress),
          challengeId: unwrapOptText(tx.challengeId),
          tournamentId: unwrapOptText(tx.tournamentId),
          description: String(tx.description || ""),
        } satisfies TreasuryTx;
      })
      .reverse(); // newest first if buffer is append-only
  } catch (e) {
    console.warn("[fees] listTreasuryTransactions", e);
    return [];
  }
}

export async function getTreasurySummary(
  identity?: Identity | null,
): Promise<{ token: string; balanceIcp: number; balanceRaw: number }[]> {
  if (!isCanisterConfigured()) return [];
  try {
    const actor = await asActor(identity);
    if (!actor?.getTreasurySummary) return [];
    const rows = (await actor.getTreasurySummary()) as [string, bigint][];
    return (rows || []).map(([token, bal]) => {
      const raw = Number(bal);
      const t = String(token);
      return {
        token: t,
        balanceRaw: raw,
        balanceIcp: t === "ICP" || t === "WICP" ? raw / 1e8 : raw,
      };
    });
  } catch {
    return [];
  }
}

export async function getFeePolicy(
  identity?: Identity | null,
): Promise<FeePolicy> {
  const defaults: FeePolicy = {
    platformFeeRatePct: 5,
    headsUpPlatformFeeBps: 1000,
    tournamentPlatformFeeBps: 500,
    arcadePlatformFeeBps: 150,
    arcadeSubmitFeeIcp: 0.01,
    arcadeSubmitFeeE8s: 1_000_000,
    platformXftId: 0,
    platformBagPrincipal: "",
    platformFeePrincipal: "",
    feeRecipient: "",
  };
  if (!isCanisterConfigured()) return defaults;
  try {
    const actor = await asActor(identity);
    const [
      pct,
      huBps,
      tourneyBps,
      bps,
      submitE8s,
      xftId,
      bag,
      payout,
      recip,
    ] = await Promise.all([
      actor.platformFeeRate_?.() ?? 5,
      actor.getHeadsUpPlatformFeeBps?.() ?? 1000,
      actor.getTournamentPlatformFeeBps?.() ?? 500,
      actor.getArcadePlatformFeeBps?.() ?? 150,
      actor.getArcadeSubmitFeeE8s?.() ?? 1_000_000,
      actor.getPlatformXftId?.() ?? 0,
      actor.getPlatformBagPrincipal?.() ?? "",
      actor.getPlatformFeePrincipal?.() ?? "",
      actor.feeRecipient_?.() ?? "",
    ]);
    const e8s = Number(submitE8s ?? 1_000_000);
    const payoutText = String(payout || recip || "");
    return {
      platformFeeRatePct: Number(pct),
      headsUpPlatformFeeBps: Number(huBps),
      tournamentPlatformFeeBps: Number(tourneyBps),
      arcadePlatformFeeBps: Number(bps),
      arcadeSubmitFeeE8s: e8s,
      arcadeSubmitFeeIcp: e8s / 1e8,
      platformXftId: Number(xftId),
      platformBagPrincipal: String(bag || ""),
      platformFeePrincipal: payoutText,
      feeRecipient: String(recip || payoutText || ""),
    };
  } catch {
    return defaults;
  }
}

export async function setPlatformFeeRate(
  caller: string,
  pct: number,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await asActor(identity);
  if (!actor?.setPlatformFeeRate) return false;
  return Boolean(await actor.setPlatformFeeRate(caller, BigInt(Math.floor(pct))));
}

/** Admin: heads-up platform fee bps of pot (0–2000). */
export async function setHeadsUpPlatformFeeBps(
  caller: string,
  bps: number,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await asActor(identity);
  if (!actor?.setHeadsUpPlatformFeeBps) return false;
  return Boolean(
    await actor.setHeadsUpPlatformFeeBps(caller, BigInt(Math.floor(bps))),
  );
}

/** Admin: tournament/room platform fee bps of pot (0–2000). */
export async function setTournamentPlatformFeeBps(
  caller: string,
  bps: number,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await asActor(identity);
  if (!actor?.setTournamentPlatformFeeBps) return false;
  return Boolean(
    await actor.setTournamentPlatformFeeBps(caller, BigInt(Math.floor(bps))),
  );
}

/**
 * Admin: Dexsta XFT id for 50% platform-fee bag split.
 * Returns bag principal text when ok; err message when failed.
 */
export async function setPlatformXftId(
  caller: string,
  xftId: number,
  identity?: Identity | null,
): Promise<{ ok: boolean; err: string; bag: string }> {
  const actor = await asActor(identity);
  if (!actor?.setPlatformXftId) {
    return { ok: false, err: "setPlatformXftId not available", bag: "" };
  }
  try {
    const r = await actor.setPlatformXftId(caller, BigInt(Math.floor(xftId)));
    return {
      ok: Boolean(r?.ok),
      err: String(r?.err || ""),
      bag: String(r?.bag || ""),
    };
  } catch (e) {
    return {
      ok: false,
      err: e instanceof Error ? e.message : String(e),
      bag: "",
    };
  }
}

export async function setArcadePlatformFeeBps(
  caller: string,
  bps: number,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await asActor(identity);
  if (!actor?.setArcadePlatformFeeBps) return false;
  return Boolean(
    await actor.setArcadePlatformFeeBps(caller, BigInt(Math.floor(bps))),
  );
}

/** Admin sets flat ICP fee to submit an arcade cabinet for testing. */
export async function setArcadeSubmitFeeIcp(
  caller: string,
  icp: number,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await asActor(identity);
  if (!actor?.setArcadeSubmitFeeE8s) return false;
  if (!Number.isFinite(icp) || icp < 0) return false;
  const e8s = Math.round(icp * 1e8);
  if (e8s > 1_000_000_000) return false;
  return Boolean(
    await actor.setArcadeSubmitFeeE8s(caller, BigInt(e8s)),
  );
}

/** Public query: submit fee in ICP (0 = free). */
export async function getArcadeSubmitFeeIcp(
  identity?: Identity | null,
): Promise<number> {
  if (!isCanisterConfigured()) return 0.01;
  try {
    const actor = await asActor(identity);
    if (!actor?.getArcadeSubmitFeeE8s) return 0.01;
    const e8s = Number(await actor.getArcadeSubmitFeeE8s());
    return Number.isFinite(e8s) ? e8s / 1e8 : 0.01;
  } catch {
    return 0.01;
  }
}

export async function setFeeRecipient(
  caller: string,
  address: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await asActor(identity);
  // Prefer setPlatformFeePrincipal when available (validates principal)
  if (actor?.setPlatformFeePrincipal) {
    try {
      const r = await actor.setPlatformFeePrincipal(caller, address);
      if (r?.ok) return true;
      // fall through to legacy if invalid principal path wanted text only
      if (r?.err && String(r.err).includes("Invalid")) {
        // still try legacy
      } else if (r && r.ok === false) {
        return false;
      }
    } catch {
      /* fall through */
    }
  }
  if (!actor?.setFeeRecipient) return false;
  return Boolean(await actor.setFeeRecipient(caller, address));
}

/** Admin: set platform ICP payout principal. */
export async function setPlatformFeePrincipal(
  caller: string,
  principalText: string,
  identity?: Identity | null,
): Promise<{ ok: boolean; err: string }> {
  const actor = await asActor(identity);
  if (actor?.setPlatformFeePrincipal) {
    try {
      const r = await actor.setPlatformFeePrincipal(caller, principalText);
      return {
        ok: Boolean(r?.ok),
        err: String(r?.err || ""),
      };
    } catch (e) {
      return {
        ok: false,
        err: e instanceof Error ? e.message : String(e),
      };
    }
  }
  // Fallback: setFeeRecipient
  if (!actor?.setFeeRecipient) {
    return { ok: false, err: "setPlatformFeePrincipal not available" };
  }
  try {
    const ok = Boolean(await actor.setFeeRecipient(caller, principalText));
    return { ok, err: ok ? "" : "setFeeRecipient failed" };
  } catch (e) {
    return {
      ok: false,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Aggregate platform/vault/rake totals from tx list for the fees dashboard. */
export function summarizeFeeCollections(txs: TreasuryTx[]): {
  platformIcp: number;
  vaultIcp: number;
  rakeIcp: number;
  prizesIcp: number;
  depositsIcp: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  let platformIcp = 0;
  let vaultIcp = 0;
  let rakeIcp = 0;
  let prizesIcp = 0;
  let depositsIcp = 0;
  for (const t of txs) {
    byType[t.type] = (byType[t.type] || 0) + t.amountIcp;
    if (t.type === "PlatformFee") platformIcp += t.amountIcp;
    if (t.type === "TreasuryAllocation") vaultIcp += t.amountIcp;
    if (t.type === "RakeCollection") rakeIcp += t.amountIcp;
    if (t.type === "PrizeDistribution") prizesIcp += t.amountIcp;
    if (t.type === "Deposit") depositsIcp += t.amountIcp;
  }
  return { platformIcp, vaultIcp, rakeIcp, prizesIcp, depositsIcp, byType };
}

export function formatIcpShort(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) < 0.0001 && n !== 0) return n.toFixed(6);
  if (Math.abs(n) < 1) return n.toFixed(4);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

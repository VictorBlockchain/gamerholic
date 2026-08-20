/**
 * Gamer list + stats from canister (replaces DEMO_ONLINE / DEMO_ARENA_STATS).
 */

import type { Identity } from "@dfinity/agent";
import {
  createBackendActor,
  e8sToIcp,
  isCanisterConfigured,
  unwrapOpt,
} from "./canisters";
import type { ChatUser } from "@/lib/chat/types";
import { listOnlineUsers } from "./presence-service";

export type ArenaStats = {
  subaccountIcp: number;
  headsUp: { wins: number; losses: number };
  tournament: { wins: number; losses: number };
  winStreak: number;
  lossStreak: number;
  bestWinStreak: number;
};

export type GamerRow = {
  wallet: string;
  username: string;
  avatarUrl: string;
};

export async function listGamers(
  identity?: Identity | null,
): Promise<GamerRow[]> {
  if (!isCanisterConfigured()) return [];
  try {
    const actor = await createBackendActor(identity);
    if (!actor) return [];
    const rows = (await (actor as any).listGamers()) as GamerRow[];
    return rows || [];
  } catch {
    return [];
  }
}

/**
 * Online discovery list for dashboard.
 * Only returns live `gh_presence` heartbeats (not offline gamers).
 * Empty array = nobody online / presence not configured — not a directory dump.
 */
export async function listDiscoveryUsers(
  _identity?: Identity | null,
): Promise<ChatUser[]> {
  return listOnlineUsers(50);
}

/**
 * Directory for opponent autocomplete — online + gamers + Supabase profiles.
 */
export async function searchChallengeUsers(
  query: string,
  identity?: Identity | null,
  limit = 12,
): Promise<ChatUser[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  const map = new Map<string, ChatUser>();
  const push = (u: ChatUser) => {
    const key = (u.principal || u.id || u.username).toLowerCase();
    if (!key) return;
    const existing = map.get(key);
    if (!existing) map.set(key, u);
    else {
      map.set(key, {
        ...existing,
        ...u,
        games: u.games?.length ? u.games : existing.games,
        avatarUrl: u.avatarUrl || existing.avatarUrl,
      });
    }
  };

  try {
    const [online, gamers] = await Promise.all([
      listOnlineUsers(80),
      listGamers(identity),
    ]);
    for (const u of online) push(u);
    for (const g of gamers) {
      push({
        id: g.wallet,
        username: g.username || g.wallet,
        avatarUrl: g.avatarUrl || undefined,
        principal: g.wallet,
        status: "offline",
      });
    }
  } catch {
    /* ignore */
  }

  try {
    const { getSupabase, isSupabaseConfigured } = await import(
      "@/lib/supabase/client"
    );
    const { GH_TABLES } = await import("@/lib/supabase/tables");
    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb
          .from(GH_TABLES.profiles)
          .select("principal, username, avatar_url, games")
          .ilike("username", `%${q}%`)
          .limit(limit);
        for (const row of data || []) {
          const username = String(row.username || "").trim();
          const principal = String(row.principal || "").trim();
          if (!username && !principal) continue;
          push({
            id: principal || username,
            username: username || principal.slice(0, 8),
            principal: principal || undefined,
            avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
            games: Array.isArray(row.games)
              ? row.games.map(String)
              : undefined,
            status: "offline",
          });
        }
      }
    }
  } catch {
    /* ignore */
  }

  const matches = [...map.values()].filter((u) => {
    const name = (u.username || "").toLowerCase();
    const p = (u.principal || u.id || "").toLowerCase();
    return name.includes(q) || p.includes(q) || p.startsWith(q);
  });

  matches.sort((a, b) => {
    const an = (a.username || "").toLowerCase();
    const bn = (b.username || "").toLowerCase();
    const aExact = an === q ? 0 : an.startsWith(q) ? 1 : 2;
    const bExact = bn === q ? 0 : bn.startsWith(q) ? 1 : 2;
    if (aExact !== bExact) return aExact - bExact;
    return an.localeCompare(bn);
  });

  return matches.slice(0, limit);
}

/** ICP ledger transfer fee (10_000 e8s) — deposit into challenge escrow needs this on top of stake. */
export const ICP_TRANSFER_FEE = 0.0001;

/**
 * ICP a player must hold to enter a challenge: entry stake + ledger transfer fee.
 * Free matches (entry 0) require 0.
 */
export function requiredIcpForChallengeEntry(entryFeeIcp: number): number {
  if (!Number.isFinite(entryFeeIcp) || entryFeeIcp <= 0) return 0;
  return entryFeeIcp + ICP_TRANSFER_FEE;
}

/** Tournament entry: stake + one ICRC-1 fee (play sub → tournament escrow). */
export function requiredIcpForTournamentEntry(entryFeeIcp: number): number {
  return requiredIcpForChallengeEntry(entryFeeIcp);
}

/**
 * Arcade insert: play fee + 2× ledger fee (platform cut transfer + escrow transfer).
 * Matches debitArcadePlayFeeNativeICP reserve on gh_backend.
 */
export function requiredIcpForArcadeInsert(playFeeIcp: number): number {
  if (!Number.isFinite(playFeeIcp) || playFeeIcp <= 0) return 0;
  return playFeeIcp + ICP_TRANSFER_FEE * 2;
}

/**
 * Arcade submit-for-testing: flat admin fee + 1× ledger fee.
 * Matches debitArcadeSubmitFeeNativeICP reserve on gh_backend.
 */
export function requiredIcpForArcadeSubmit(submitFeeIcp: number): number {
  if (!Number.isFinite(submitFeeIcp) || submitFeeIcp <= 0) return 0;
  return submitFeeIcp + ICP_TRANSFER_FEE;
}

export type PlayIcpAffordCheck = {
  /** True when known balance is enough, or when balance could not be read (allow canister path). */
  ok: boolean;
  /** Known shortfall — only false when balance was read and is too low. */
  insufficient: boolean;
  balance: number | null;
  need: number;
  shortfall: number;
  /** Balance query failed / canister not configured */
  unknown: boolean;
};

export function formatIcpShort(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "0";
  const s = n.toFixed(digits);
  return s.replace(/\.?0+$/, "") || "0";
}

/**
 * User-facing low-balance copy (toasts / banners). Prefer showing this before
 * calling the canister so we never wait on InsufficientFunds traps.
 */
export function lowBalanceMessage(opts: {
  action: string;
  need: number;
  balance: number;
}): string {
  const shortfall = Math.max(0, opts.need - opts.balance);
  return (
    `Need ${formatIcpShort(opts.need)} ICP to ${opts.action} ` +
    `(have ${formatIcpShort(opts.balance)} ICP · short ${formatIcpShort(shortfall)} ICP). ` +
    `Deposit to your Gamerholic play subaccount first.`
  );
}

/**
 * Pre-check play-subaccount ICP vs required amount.
 * When balance is unknown, `ok` is true and `unknown` is true — caller may still call canister.
 */
export async function checkPlayIcpAfford(
  principalText: string,
  needIcp: number,
  identity?: Identity | null,
): Promise<PlayIcpAffordCheck> {
  const need =
    Number.isFinite(needIcp) && needIcp > 0 ? needIcp : 0;
  if (need <= 0) {
    return {
      ok: true,
      insufficient: false,
      balance: null,
      need: 0,
      shortfall: 0,
      unknown: false,
    };
  }
  if (!principalText) {
    return {
      ok: false,
      insufficient: true,
      balance: 0,
      need,
      shortfall: need,
      unknown: false,
    };
  }
  const balance = await getUserPlayIcpBalance(principalText, identity);
  if (balance == null) {
    return {
      ok: true,
      insufficient: false,
      balance: null,
      need,
      shortfall: 0,
      unknown: true,
    };
  }
  const shortfall = Math.max(0, need - balance);
  const insufficient = balance < need;
  return {
    ok: !insufficient,
    insufficient,
    balance,
    need,
    shortfall,
    unknown: false,
  };
}

/** ICP play-subaccount balance in whole ICP (not e8s). */
export async function getUserPlayIcpBalance(
  principalText: string,
  identity?: Identity | null,
): Promise<number | null> {
  if (!principalText || !isCanisterConfigured()) return null;
  try {
    const { Principal } = await import("@dfinity/principal");
    const actor = await createBackendActor(identity);
    if (!actor || typeof (actor as any).getUserICPBalance !== "function") {
      return null;
    }
    const p = Principal.fromText(principalText);
    const e8s = await (actor as any).getUserICPBalance(p);
    return Number(e8s) / 1e8;
  } catch (e) {
    console.warn("[gamer] getUserPlayIcpBalance", e);
    return null;
  }
}

export async function loadArenaStats(
  address: string,
  identity?: Identity | null,
): Promise<ArenaStats> {
  const empty: ArenaStats = {
    subaccountIcp: 0,
    headsUp: { wins: 0, losses: 0 },
    tournament: { wins: 0, losses: 0 },
    winStreak: 0,
    lossStreak: 0,
    bestWinStreak: 0,
  };
  if (!isCanisterConfigured() || !address) return empty;
  try {
    const actor = await createBackendActor(identity);
    if (!actor) return empty;
    const a = actor as any;
    const [statsOpt, earnOpt] = await Promise.all([
      a.getGamerStats(address) as Promise<
        | []
        | [
            {
              wins: bigint;
              losses: bigint;
              currentWinStreak: bigint;
              currentLossStreak: bigint;
              longestWinStreak: bigint;
            },
          ]
      >,
      a.getGamerEarnings(address) as Promise<
        | []
        | [
            {
              tournamentWins: bigint;
              tournamentLosses: bigint;
              totalHeadsUpEarnings: bigint;
              totalTournamentEarnings: bigint;
            },
          ]
      >,
    ]);
    const s = unwrapOpt(statsOpt);
    const e = unwrapOpt(earnOpt);
    const wins = Number(s?.wins ?? 0);
    const losses = Number(s?.losses ?? 0);
    const tW = Number(e?.tournamentWins ?? 0);
    const tL = Number(e?.tournamentLosses ?? 0);
    return {
      subaccountIcp: 0, // filled by wallet/ledger when available
      headsUp: {
        wins: Math.max(0, wins - tW),
        losses: Math.max(0, losses - tL),
      },
      tournament: { wins: tW, losses: tL },
      winStreak: Number(s?.currentWinStreak ?? 0),
      lossStreak: Number(s?.currentLossStreak ?? 0),
      bestWinStreak: Number(s?.longestWinStreak ?? 0),
    };
  } catch {
    return empty;
  }
}

/** Persist username + avatar URL on gh_backend (source of truth for rooms / lists). */
export async function upsertGamerProfile(
  address: string,
  username: string,
  avatarUrl: string,
  identity?: Identity | null,
): Promise<boolean> {
  if (!isCanisterConfigured() || !address) return false;
  try {
    const actor = await createBackendActor(identity);
    if (!actor || typeof (actor as any).upsertGamer !== "function") return false;
    await (actor as any).upsertGamer(
      address,
      username || address,
      avatarUrl || "",
    );
    return true;
  } catch (e) {
    console.warn("[gamer] upsertGamer failed", e);
    return false;
  }
}

export async function listOfficialGameNames(
  identity?: Identity | null,
): Promise<string[]> {
  if (!isCanisterConfigured()) {
    return [
      "Street Fighter 6",
      "Tekken 8",
      "Apex Legends",
      "Call of Duty",
      "Rocket League",
    ];
  }
  try {
    const actor = await createBackendActor(identity);
    if (!actor) return [];
    const rows = (await (actor as any).listGames()) as [
      string,
      { name: string },
    ][];
    const names = (rows || []).map(([, g]) => g.name).filter(Boolean);
    return names.length ? names : ["Street Fighter 6", "Tekken 8"];
  } catch {
    return ["Street Fighter 6", "Tekken 8"];
  }
}

export function overallRecord(stats: ArenaStats) {
  const w = stats.headsUp.wins + stats.tournament.wins;
  const l = stats.headsUp.losses + stats.tournament.losses;
  return { wins: w, losses: l, label: `${w}–${l}` };
}

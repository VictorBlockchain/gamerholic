/**
 * Arcade games + leaderboard.
 *
 * **Game catalog (title, cover, CSS, gameCode) = Supabase only** (`gh_arcade_games`).
 * Not localStorage. Not on-chain (too large for Motoko; canister = fees/escrow/settle).
 *
 * In-memory cache for the current session only (never persisted to disk).
 *
 * Lifecycle: submit → **testing** → 10 upvotes → **live**.
 * No seed/mock cabinets — empty until users submit via Add Game.
 */

import { resolveArcadeCoverUrl } from "./cover";
import { buildPhaserHostDocument } from "./engine";
import {
  clampPayoutTopN,
  settlePaidPlay,
  type PrizeSettlement,
} from "./prize";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  ARCADE_LIVE_UPVOTE_THRESHOLD,
  type ArcadeGame,
  type ArcadeGameStatus,
  type ArcadePayoutEvent,
  type EarningsLedgerEntry,
  type GameEscrowAccount,
  type LeaderboardEntry,
  type PlaySession,
  type PlayerGameEarnings,
  type PlayFeeToken,
} from "./types";

export { ARCADE_LIVE_UPVOTE_THRESHOLD, type ArcadeGameStatus } from "./types";

/** @deprecated game catalog is Supabase-only — key cleared on load */
const LEGACY_GAMES_KEY = "gh_arcade_games_v8";
const SCORES_KEY = "gh_arcade_scores_v1";
const BALANCE_KEY = "gh_arcade_play_balance_v1";
const PAYOUTS_KEY = "gh_arcade_payouts_v1";
const ESCROW_KEY = "gh_arcade_escrow_v1";
const EARNINGS_KEY = "gh_arcade_earnings_v1";
const LEDGER_KEY = "gh_arcade_earnings_ledger_v1";
/** Idempotent canister/local settles keyed by secure session id */
const SETTLED_SESSIONS_KEY = "gh_arcade_settled_sessions_v1";

/** Session memory cache for cabinets (title/css/gameCode) — never localStorage */
let gamesCache: ArcadeGame[] = [];

function dropLegacyGameLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_GAMES_KEY);
    // older keys
    window.localStorage.removeItem("gh_arcade_games_v7");
    window.localStorage.removeItem("gh_arcade_games_v6");
  } catch {
    /* ignore */
  }
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Deterministic escrow label per game (mirrors ICP subaccount derivation later). */
export function makeEscrowId(gameId: string): string {
  return `gh-arcade-escrow-${gameId}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

function normalizeStatus(
  g: Partial<ArcadeGame> & { id: string },
): ArcadeGameStatus {
  if (g.status === "testing" || g.status === "live") return g.status;
  // Legacy cabinets (pre-approval) that were published → treat as live
  if (g.published !== false) return "live";
  return "testing";
}

function normalizeUpvotedBy(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((x) => String(x || "").trim())
        .filter((x) => x.length > 0),
    ),
  ];
}

function normalizeGame(g: Partial<ArcadeGame> & { id: string }): ArcadeGame {
  const top = clampPayoutTopN(g.payoutTopN ?? 3);
  const status = normalizeStatus(g);
  const upvotedBy = normalizeUpvotedBy(g.upvotedBy);
  const upvotes = Math.max(
    upvotedBy.length,
    Math.max(0, Math.floor(Number(g.upvotes) || 0)),
  );
  return {
    id: g.id,
    title: g.title || "Untitled",
    description: g.description || "",
    rules: g.rules || "",
    // Always keep creator-selected cover (preset path or uploaded data/https URL)
    imageUrl: resolveArcadeCoverUrl(g.imageUrl),
    css: g.css || "",
    gameCode: g.gameCode || "",
    engine: g.engine || "phaser3",
    htmlCode: g.htmlCode,
    playFee: g.playFee ?? 0.003,
    playFeeToken: g.playFeeToken || "ICP",
    payoutTopN: top,
    playTimeSec: g.playTimeSec || 180,
    creator: g.creator || "player",
    creatorPrincipal: g.creatorPrincipal || "",
    escrowId: g.escrowId || makeEscrowId(g.id),
    linkedLabelId: Math.max(0, Math.floor(Number(g.linkedLabelId) || 0)),
    acceptedGameAssets: g.acceptedGameAssets || [],
    plays: g.plays || 0,
    highScore: g.highScore || 0,
    highScoreBy: g.highScoreBy,
    createdAt: g.createdAt || new Date().toISOString(),
    published: g.published !== false,
    status,
    upvotes,
    upvotedBy,
  };
}

function emptyEscrow(gameId: string, escrowId: string): GameEscrowAccount {
  return {
    gameId,
    escrowId,
    icp: 0,
    gamer: 0,
    platformIcp: 0,
    platformGamer: 0,
  };
}

export function getGameEscrow(gameId: string): GameEscrowAccount {
  const game = getArcadeGame(gameId);
  const all = readJson<Record<string, GameEscrowAccount>>(ESCROW_KEY, {});
  if (all[gameId]) return all[gameId]!;
  return emptyEscrow(gameId, game?.escrowId || makeEscrowId(gameId));
}

function saveEscrow(esc: GameEscrowAccount) {
  const all = readJson<Record<string, GameEscrowAccount>>(ESCROW_KEY, {});
  all[esc.gameId] = esc;
  writeJson(ESCROW_KEY, all);
}

function earningsKey(gameId: string, principal: string) {
  return `${gameId}::${principal}`;
}

export function getPlayerEarnings(
  gameId: string,
  principal: string,
): PlayerGameEarnings | null {
  if (!principal) return null;
  const all = readJson<Record<string, PlayerGameEarnings>>(EARNINGS_KEY, {});
  return all[earningsKey(gameId, principal)] || null;
}

export function listPlayerEarningsForGame(
  gameId: string,
): PlayerGameEarnings[] {
  const all = readJson<Record<string, PlayerGameEarnings>>(EARNINGS_KEY, {});
  return Object.values(all)
    .filter((e) => e.gameId === gameId)
    .sort(
      (a, b) =>
        b.lifetimeIcp +
        b.lifetimeGamer -
        (a.lifetimeIcp + a.lifetimeGamer),
    );
}

export function listEarningsLedger(
  gameId: string,
  principal?: string,
  limit = 30,
): EarningsLedgerEntry[] {
  const all = readJson<EarningsLedgerEntry[]>(LEDGER_KEY, []);
  return all
    .filter(
      (e) =>
        e.gameId === gameId &&
        (!principal || e.principal === principal),
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

function appendLedger(entry: Omit<EarningsLedgerEntry, "id">) {
  const all = readJson<EarningsLedgerEntry[]>(LEDGER_KEY, []);
  all.push({ ...entry, id: uid("led") });
  writeJson(LEDGER_KEY, all);
}

function roundTok(n: number, token: PlayFeeToken) {
  return token === "GAMER"
    ? Math.round(n * 100) / 100
    : Math.round(n * 1e8) / 1e8;
}

/** Credit pending earnings inside game escrow (does NOT touch play subaccount). */
function creditPendingEarnings(opts: {
  gameId: string;
  principal: string;
  username: string;
  token: PlayFeeToken;
  amount: number;
  kind: EarningsLedgerEntry["kind"];
  note: string;
}) {
  if (opts.amount <= 0 || !opts.principal) return;
  const amt = roundTok(opts.amount, opts.token);
  const all = readJson<Record<string, PlayerGameEarnings>>(EARNINGS_KEY, {});
  const k = earningsKey(opts.gameId, opts.principal);
  const cur: PlayerGameEarnings = all[k] || {
    gameId: opts.gameId,
    principal: opts.principal,
    username: opts.username,
    pendingIcp: 0,
    pendingGamer: 0,
    lifetimeIcp: 0,
    lifetimeGamer: 0,
    claimedIcp: 0,
    claimedGamer: 0,
    updatedAt: new Date().toISOString(),
  };
  cur.username = opts.username || cur.username;
  if (opts.token === "ICP") {
    cur.pendingIcp = roundTok(cur.pendingIcp + amt, "ICP");
    cur.lifetimeIcp = roundTok(cur.lifetimeIcp + amt, "ICP");
  } else {
    cur.pendingGamer = roundTok(cur.pendingGamer + amt, "GAMER");
    cur.lifetimeGamer = roundTok(cur.lifetimeGamer + amt, "GAMER");
  }
  cur.updatedAt = new Date().toISOString();
  all[k] = cur;
  writeJson(EARNINGS_KEY, all);
  appendLedger({
    gameId: opts.gameId,
    principal: opts.principal,
    username: opts.username,
    at: cur.updatedAt,
    kind: opts.kind,
    token: opts.token,
    amount: amt,
    note: opts.note,
  });
}

/**
 * Claim pending winnings for this game → user play subaccount.
 * ICP path: native claimArcadeWinningsNativeICP (arcade escrow → play sub) when canister configured.
 * GAMER / offline: local escrow mirror.
 */
export function claimGameEarnings(
  gameId: string,
  principal: string,
): {
  ok: boolean;
  claimedIcp: number;
  claimedGamer: number;
  balances: { icp: number; gamer: number };
  error?: string;
} {
  const earn = getPlayerEarnings(gameId, principal);
  if (!earn || (earn.pendingIcp <= 0 && earn.pendingGamer <= 0)) {
    return {
      ok: false,
      claimedIcp: 0,
      claimedGamer: 0,
      balances: getPlayBalances(),
      error: "Nothing to claim for this cabinet",
    };
  }
  const esc = getGameEscrow(gameId);
  const icp = Math.min(earn.pendingIcp, esc.icp);
  const gamer = Math.min(earn.pendingGamer, esc.gamer);

  esc.icp = roundTok(esc.icp - icp, "ICP");
  esc.gamer = roundTok(esc.gamer - gamer, "GAMER");
  saveEscrow(esc);

  const all = readJson<Record<string, PlayerGameEarnings>>(EARNINGS_KEY, {});
  const k = earningsKey(gameId, principal);
  const cur = all[k]!;
  cur.pendingIcp = roundTok(cur.pendingIcp - icp, "ICP");
  cur.pendingGamer = roundTok(cur.pendingGamer - gamer, "GAMER");
  cur.claimedIcp = roundTok(cur.claimedIcp + icp, "ICP");
  cur.claimedGamer = roundTok(cur.claimedGamer + gamer, "GAMER");
  cur.updatedAt = new Date().toISOString();
  all[k] = cur;
  writeJson(EARNINGS_KEY, all);

  const bal = getPlayBalances();
  bal.icp = roundTok(bal.icp + icp, "ICP");
  bal.gamer = roundTok(bal.gamer + gamer, "GAMER");
  writeJson(BALANCE_KEY, bal);

  if (icp > 0) {
    appendLedger({
      gameId,
      principal,
      username: cur.username,
      at: cur.updatedAt,
      kind: "claim_to_subaccount",
      token: "ICP",
      amount: icp,
      note: "Claimed to play subaccount (local mirror; chain via claimArcadeWinningsOnChain)",
    });
  }
  if (gamer > 0) {
    appendLedger({
      gameId,
      principal,
      username: cur.username,
      at: cur.updatedAt,
      kind: "claim_to_subaccount",
      token: "GAMER",
      amount: gamer,
      note: "Claimed to play subaccount",
    });
  }

  return {
    ok: true,
    claimedIcp: icp,
    claimedGamer: gamer,
    balances: bal,
  };
}

/**
 * Async ICP claim: native canister transfer arcade escrow → caller play subaccount.
 * Call from UI with identity after claimGameEarnings for local books, or alone for chain.
 */
export async function claimGameEarningsIcpOnChain(
  gameId: string,
  amountIcp: number,
  identity: import("@dfinity/agent").Identity | null | undefined,
): Promise<{ ok: boolean; amountIcp: number; error?: string }> {
  if (!(amountIcp > 0)) return { ok: true, amountIcp: 0 };
  try {
    const { claimArcadeWinningsOnChain } = await import(
      "@/lib/ic/settlement-service"
    );
    const r = await claimArcadeWinningsOnChain(gameId, amountIcp, identity);
    return {
      ok: r.ok,
      amountIcp: r.amountIcp,
      error: r.ok ? undefined : r.err,
    };
  } catch (e) {
    return {
      ok: false,
      amountIcp: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function listCachedGames(): ArcadeGame[] {
  return gamesCache.map(normalizeGame).filter((g) => g.published !== false);
}

function setGamesCache(games: ArcadeGame[]) {
  gamesCache = games.map(normalizeGame);
}

function upsertGamesCache(game: ArcadeGame) {
  const g = normalizeGame(game);
  gamesCache = [g, ...gamesCache.filter((x) => x.id !== g.id)];
}

function rowToGame(row: Record<string, unknown>): ArcadeGame {
  return normalizeGame({
    id: String(row.id),
    title: String(row.title || ""),
    description: String(row.description || ""),
    rules: String(row.rules || ""),
    imageUrl: resolveArcadeCoverUrl(
      String(row.image_url || row.imageUrl || ""),
    ),
    css: String(row.css || ""),
    gameCode: String(row.game_code || row.gameCode || ""),
    engine: "phaser3",
    playFee: Number(row.play_fee ?? row.playFee ?? 0.003),
    playFeeToken: (row.play_fee_token || row.playFeeToken || "ICP") as PlayFeeToken,
    payoutTopN: clampPayoutTopN(row.payout_top_n ?? row.payoutTopN ?? 3),
    playTimeSec: Number(row.play_time_sec ?? row.playTimeSec ?? 180),
    creator: String(row.creator || "player"),
    creatorPrincipal: String(row.creator_principal || row.creatorPrincipal || ""),
    escrowId: String(row.escrow_id || row.escrowId || makeEscrowId(String(row.id))),
    linkedLabelId: Number(row.linked_label_id ?? row.linkedLabelId ?? 0),
    acceptedGameAssets: Array.isArray(row.accepted_game_assets)
      ? (row.accepted_game_assets as ArcadeGame["acceptedGameAssets"])
      : Array.isArray(row.acceptedGameAssets)
        ? (row.acceptedGameAssets as ArcadeGame["acceptedGameAssets"])
        : [],
    plays: Number(row.plays ?? 0),
    highScore: Number(row.high_score ?? row.highScore ?? 0),
    highScoreBy: row.high_score_by
      ? String(row.high_score_by)
      : row.highScoreBy
        ? String(row.highScoreBy)
        : undefined,
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    published: row.published !== false,
    status:
      row.status === "testing" || row.status === "live"
        ? row.status
        : undefined,
    upvotes: Number(row.upvotes ?? 0),
    upvotedBy: Array.isArray(row.upvoted_by)
      ? (row.upvoted_by as string[])
      : Array.isArray(row.upvotedBy)
        ? (row.upvotedBy as string[])
        : [],
  });
}

/** Sync list from session cache. Prefer listArcadeGamesAsync (Supabase). */
export function listArcadeGames(): ArcadeGame[] {
  return listCachedGames();
}

/**
 * Load cabinets from Supabase only (includes css + game_code).
 * No localStorage. No mock seeds.
 */
export async function listArcadeGamesAsync(): Promise<ArcadeGame[]> {
  dropLegacyGameLocalStorage();
  if (!isSupabaseConfigured()) {
    console.warn("[arcade] Supabase not configured — game catalog empty");
    setGamesCache([]);
    return [];
  }

  try {
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("gh_arcade_games")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error || !data) {
      console.warn("[arcade] list games supabase:", error?.message);
      return listCachedGames();
    }
    const remote = (data as Record<string, unknown>[]).map(rowToGame);
    setGamesCache(remote);
    return listCachedGames().sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  } catch (e) {
    console.warn("[arcade] listArcadeGamesAsync", e);
    return listCachedGames();
  }
}

export function getArcadeGame(id: string): ArcadeGame | null {
  return listCachedGames().find((g) => g.id === id) ?? null;
}

/** Always prefer Supabase for full gameCode/css */
export async function getArcadeGameAsync(id: string): Promise<ArcadeGame | null> {
  dropLegacyGameLocalStorage();
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase()!;
      const { data, error } = await sb
        .from("gh_arcade_games")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) {
        const g = rowToGame(data as Record<string, unknown>);
        upsertGamesCache(g);
        return g;
      }
    } catch {
      /* fall through to cache */
    }
  }
  return getArcadeGame(id);
}

/** Host iframe document — Phaser shell + creator CSS/JS only */
export function getGameSrcDoc(game: ArcadeGame): string {
  return buildPhaserHostDocument({
    title: game.title,
    css: game.css || "",
    gameCode: game.gameCode || "",
  });
}

function gameToRow(g: ArcadeGame) {
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    rules: g.rules,
    image_url: g.imageUrl,
    css: g.css,
    game_code: g.gameCode,
    engine: g.engine,
    play_fee: g.playFee,
    play_fee_token: g.playFeeToken,
    payout_top_n: g.payoutTopN,
    play_time_sec: g.playTimeSec,
    creator: g.creator,
    creator_principal: g.creatorPrincipal,
    escrow_id: g.escrowId,
    linked_label_id: g.linkedLabelId,
    accepted_game_assets: g.acceptedGameAssets,
    plays: g.plays,
    high_score: g.highScore,
    high_score_by: g.highScoreBy ?? null,
    published: g.published,
    status: g.status,
    upvotes: g.upvotes,
    upvoted_by: g.upvotedBy,
    created_at: g.createdAt,
    updated_at: new Date().toISOString(),
  };
}

export type SaveArcadeGameInput = Omit<
  ArcadeGame,
  | "id"
  | "plays"
  | "highScore"
  | "createdAt"
  | "published"
  | "engine"
  | "escrowId"
  | "status"
  | "upvotes"
  | "upvotedBy"
> & { id?: string; engine?: ArcadeGame["engine"]; escrowId?: string };

function buildArcadeGame(input: SaveArcadeGameInput): ArcadeGame {
  const now = new Date().toISOString();
  if (input.id) {
    const prev = getArcadeGame(input.id);
    if (prev) {
      return normalizeGame({
        ...prev,
        ...input,
        id: input.id,
        engine: "phaser3",
        status: prev.status,
        upvotes: prev.upvotes,
        upvotedBy: prev.upvotedBy,
      });
    }
  }
  const id = input.id || uid("game");
  return normalizeGame({
    id,
    title: input.title,
    description: input.description,
    rules: input.rules,
    imageUrl: resolveArcadeCoverUrl(input.imageUrl),
    css: input.css,
    gameCode: input.gameCode,
    engine: "phaser3",
    playFee: input.playFee,
    playFeeToken: input.playFeeToken,
    payoutTopN: clampPayoutTopN(input.payoutTopN ?? 3),
    playTimeSec: input.playTimeSec,
    creator: input.creator,
    creatorPrincipal: input.creatorPrincipal,
    escrowId: makeEscrowId(id),
    linkedLabelId: Math.max(0, Math.floor(Number(input.linkedLabelId) || 0)),
    acceptedGameAssets: input.acceptedGameAssets || [],
    plays: 0,
    highScore: 0,
    createdAt: now,
    published: true,
    status: "testing",
    upvotes: 0,
    upvotedBy: [],
  });
}

/**
 * @deprecated Prefer saveArcadeGameAsync — catalog is Supabase-only.
 * Sync helper only updates memory after a successful async persist path.
 */
export function saveArcadeGame(input: SaveArcadeGameInput): ArcadeGame {
  const game = buildArcadeGame(input);
  upsertGamesCache(game);
  saveEscrow(emptyEscrow(game.id, game.escrowId));
  return game;
}

/**
 * Creator-only content update while the cabinet is in **testing**.
 * Once live, CSS/gameCode are locked (metadata-only changes not exposed here).
 */
export function updateArcadeGameWhileTesting(
  gameId: string,
  creatorPrincipal: string,
  patch: Partial<
    Pick<
      ArcadeGame,
      | "title"
      | "description"
      | "rules"
      | "imageUrl"
      | "css"
      | "gameCode"
      | "playFee"
      | "playFeeToken"
      | "payoutTopN"
      | "playTimeSec"
      | "linkedLabelId"
      | "acceptedGameAssets"
    >
  >,
): { ok: true; game: ArcadeGame } | { ok: false; error: string } {
  // Prefer cache; caller should hydrate via getArcadeGameAsync first
  let prev = getArcadeGame(gameId);
  if (!prev) {
    return { ok: false, error: "Game not found — reload from Supabase" };
  }
  if (prev.status !== "testing") {
    return {
      ok: false,
      error: "Cabinet is live — CSS and game code are locked after go-live.",
    };
  }
  const me = (creatorPrincipal || "").trim();
  const owner = (prev.creatorPrincipal || "").trim();
  if (!me || !owner || me !== owner) {
    return { ok: false, error: "Only the creator can edit while testing" };
  }
  const next = normalizeGame({
    ...prev,
    ...patch,
    id: prev.id,
    status: "testing",
    upvotes: prev.upvotes,
    upvotedBy: prev.upvotedBy,
    creatorPrincipal: prev.creatorPrincipal,
    creator: prev.creator,
    plays: prev.plays,
    highScore: prev.highScore,
    highScoreBy: prev.highScoreBy,
    createdAt: prev.createdAt,
    escrowId: prev.escrowId,
  });
  upsertGamesCache(next);
  return { ok: true, game: next };
}

export async function updateArcadeGameWhileTestingAsync(
  gameId: string,
  creatorPrincipal: string,
  patch: Parameters<typeof updateArcadeGameWhileTesting>[2],
): Promise<
  | { ok: true; game: ArcadeGame; storedOn: "supabase" }
  | { ok: false; error: string }
> {
  // Ensure we have latest row (with gameCode) from Supabase
  const remote = await getArcadeGameAsync(gameId);
  if (!remote) return { ok: false, error: "Game not found on Supabase" };
  upsertGamesCache(remote);
  const result = updateArcadeGameWhileTesting(gameId, creatorPrincipal, patch);
  if (!result.ok) return result;
  const ok = await persistGameToSupabase(result.game);
  if (!ok) {
    return {
      ok: false,
      error: "Failed to save to Supabase (css / gameCode not stored)",
    };
  }
  return { ok: true, game: result.game, storedOn: "supabase" };
}

/**
 * Community upvote toward go-live. One vote per principal.
 * At {@link ARCADE_LIVE_UPVOTE_THRESHOLD} unique votes → `status: "live"`.
 * Leaderboard is **not** cleared — tester scores remain.
 */
export function upvoteArcadeGame(
  gameId: string,
  principal: string,
): {
  ok: boolean;
  game?: ArcadeGame;
  wentLive?: boolean;
  error?: string;
  alreadyVoted?: boolean;
} {
  const voter = (principal || "").trim();
  if (!voter) {
    return { ok: false, error: "Sign in to upvote" };
  }
  const prev = getArcadeGame(gameId);
  if (!prev) return { ok: false, error: "Game not found" };
  if (prev.status === "live") {
    return { ok: true, game: prev, wentLive: false, alreadyVoted: false };
  }
  if (prev.upvotedBy.includes(voter)) {
    return {
      ok: false,
      error: "You already upvoted this cabinet",
      alreadyVoted: true,
      game: prev,
    };
  }
  const upvotedBy = [...prev.upvotedBy, voter];
  const upvotes = upvotedBy.length;
  const wentLive = upvotes >= ARCADE_LIVE_UPVOTE_THRESHOLD;
  const next = normalizeGame({
    ...prev,
    upvotedBy,
    upvotes,
    status: wentLive ? "live" : "testing",
  });
  upsertGamesCache(next);
  return { ok: true, game: next, wentLive };
}

export async function upvoteArcadeGameAsync(
  gameId: string,
  principal: string,
): Promise<
  ReturnType<typeof upvoteArcadeGame> & { storedOn?: "supabase" }
> {
  await getArcadeGameAsync(gameId);
  const result = upvoteArcadeGame(gameId, principal);
  if (!result.ok || !result.game) return result;
  const ok = await persistGameToSupabase(result.game);
  if (!ok) {
    return {
      ok: false,
      error: "Failed to save upvote to Supabase",
      game: result.game,
    };
  }
  return { ...result, storedOn: "supabase" };
}

async function persistGameToSupabase(game: ArcadeGame): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const sb = getSupabase()!;
    const row = gameToRow(game);
    // Prefer RPC (SECURITY DEFINER) — includes full game_code + css
    const { error: rpcErr } = await sb.rpc("gh_arcade_upsert_game", { p: row });
    if (!rpcErr) {
      upsertGamesCache(game);
      return true;
    }
    const { error } = await sb.from("gh_arcade_games").upsert(row, {
      onConflict: "id",
    });
    if (error) {
      console.warn("[arcade] persist game:", rpcErr?.message, error.message);
      return false;
    }
    upsertGamesCache(game);
    return true;
  } catch (e) {
    console.warn("[arcade] persistGameToSupabase", e);
    return false;
  }
}

/**
 * Create/update cabinet — **requires Supabase**.
 * Persists title, cover, CSS, and gameCode to `gh_arcade_games` (not localStorage).
 */
export async function saveArcadeGameAsync(
  input: SaveArcadeGameInput,
): Promise<
  | { game: ArcadeGame; storedOn: "supabase" }
  | { game: null; storedOn: never; error: string }
> {
  dropLegacyGameLocalStorage();
  if (!isSupabaseConfigured()) {
    return {
      game: null,
      storedOn: undefined as never,
      error:
        "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY — arcade cabinets are not stored in localStorage.",
    };
  }
  const game = buildArcadeGame(input);
  const ok = await persistGameToSupabase(game);
  if (!ok) {
    return {
      game: null,
      storedOn: undefined as never,
      error: "Failed to save cabinet to Supabase (including gameCode).",
    };
  }
  saveEscrow(emptyEscrow(game.id, game.escrowId));
  return { game, storedOn: "supabase" };
}

/** @deprecated sync cache only — use listScoresAsync (Supabase) */
export function listScores(gameId: string, limit = 25): LeaderboardEntry[] {
  const all = readJson<LeaderboardEntry[]>(SCORES_KEY, []);
  return all
    .filter((s) => s.gameId === gameId && s.paid)
    .sort((a, b) => b.score - a.score || b.at.localeCompare(a.at))
    .slice(0, limit);
}

function rowToScore(row: Record<string, unknown>): LeaderboardEntry {
  const kindRaw = String(row.settlement_kind || row.settlementKind || "");
  const kindOk = (
    [
      "new_high_score_refund",
      "distributed",
      "no_recipients",
      "free",
    ] as const
  ).includes(kindRaw as "free")
    ? (kindRaw as LeaderboardEntry["settlementKind"])
    : undefined;
  const endRaw = String(row.end_reason || row.endReason || "timer");
  const endReason = (
    ["timer", "game", "unload", "manual"] as const
  ).includes(endRaw as "timer")
    ? (endRaw as LeaderboardEntry["endReason"])
    : "timer";
  return {
    id: String(row.id),
    gameId: String(row.game_id || row.gameId || ""),
    username: String(row.username || "player"),
    principal: String(row.principal || ""),
    score: Number(row.score || 0),
    paid: row.paid !== false,
    playFeePaid: Number(row.play_fee ?? row.playFeePaid ?? 0),
    playFeeToken: (row.play_fee_token || row.playFeeToken || "ICP") as PlayFeeToken,
    at: String(row.at || new Date().toISOString()),
    endReason,
    settlementKind: kindOk,
    settlementNote: row.settlement_note
      ? String(row.settlement_note)
      : row.settlementNote
        ? String(row.settlementNote)
        : undefined,
  };
}

/** Paid leaderboard from Supabase (testing + live). Falls back to session finals. */
export async function listScoresAsync(
  gameId: string,
  limit = 25,
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return listScores(gameId, limit);
  try {
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("gh_arcade_scores")
      .select("*")
      .eq("game_id", gameId)
      .eq("paid", true)
      .order("score", { ascending: false })
      .order("at", { ascending: false })
      .limit(limit);
    if (!error && data && data.length > 0) {
      const rows = (data as Record<string, unknown>[]).map(rowToScore);
      // warm local cache for sync helpers
      const all = readJson<LeaderboardEntry[]>(SCORES_KEY, []);
      const byId = new Map(all.map((s) => [s.id, s]));
      for (const r of rows) byId.set(r.id, r);
      writeJson(SCORES_KEY, [...byId.values()]);
      return rows;
    }
    // Fallback: finalized paid sessions (includes testing playtests)
    const { data: sessions } = await sb
      .from("gh_arcade_sessions")
      .select("id,game_id,username,player_principal,final_score,paid,play_fee_e8s,play_fee_token,status,updated_at")
      .eq("game_id", gameId)
      .eq("paid", true)
      .not("final_score", "is", null)
      .in("status", [
        "confirmed",
        "finalized_pending_chain",
        "refunded",
        "chain_failed",
      ])
      .order("final_score", { ascending: false })
      .limit(limit);
    if (sessions && sessions.length) {
      return (sessions as Record<string, unknown>[]).map((s) => ({
        id: String(s.id),
        gameId: String(s.game_id),
        username: String(s.username || "player"),
        principal: String(s.player_principal || ""),
        score: Number(s.final_score || 0),
        paid: true,
        playFeePaid: Number(s.play_fee_e8s || 0) / 1e8,
        playFeeToken: (s.play_fee_token || "ICP") as PlayFeeToken,
        at: String(s.updated_at || new Date().toISOString()),
        endReason: "timer" as const,
      }));
    }
  } catch (e) {
    console.warn("[arcade] listScoresAsync", e);
  }
  return listScores(gameId, limit);
}

export type PlayerArcadeBoardGame = {
  gameId: string;
  title: string;
  imageUrl: string;
  bestScore: number;
  /** Rank on that game's paid board (1-based), if known */
  rank?: number;
};

/**
 * Arcade cabinets where this player appears on the paid leaderboard.
 * Used on dashboard under Online list.
 */
export async function listPlayerArcadeLeaderboardGames(opts: {
  principal?: string;
  username?: string;
  limit?: number;
}): Promise<PlayerArcadeBoardGame[]> {
  const principal = (opts.principal || "").trim();
  const username = (opts.username || "").trim();
  if (!principal && !username) return [];
  const limit = Math.max(1, Math.min(opts.limit ?? 12, 24));

  type ScoreHit = { gameId: string; score: number };
  const hits: ScoreHit[] = [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase()!;
      // Prefer principal; also match username for older rows
      let q = sb
        .from("gh_arcade_scores")
        .select("game_id,score,principal,username")
        .eq("paid", true)
        .order("score", { ascending: false })
        .limit(200);
      if (principal) {
        q = q.eq("principal", principal);
      } else {
        q = q.eq("username", username);
      }
      const { data, error } = await q;
      if (!error && data?.length) {
        for (const row of data as Record<string, unknown>[]) {
          hits.push({
            gameId: String(row.game_id || ""),
            score: Number(row.score || 0),
          });
        }
      } else {
        // Sessions fallback
        let sq = sb
          .from("gh_arcade_sessions")
          .select("game_id,final_score,player_principal,username,paid,status")
          .eq("paid", true)
          .not("final_score", "is", null)
          .limit(200);
        if (principal) sq = sq.eq("player_principal", principal);
        else sq = sq.eq("username", username);
        const { data: sessions } = await sq;
        for (const s of (sessions || []) as Record<string, unknown>[]) {
          hits.push({
            gameId: String(s.game_id || ""),
            score: Number(s.final_score || 0),
          });
        }
      }
    } catch (e) {
      console.warn("[arcade] listPlayerArcadeLeaderboardGames", e);
    }
  }

  // Local cache fallback
  if (!hits.length) {
    const all = readJson<LeaderboardEntry[]>(SCORES_KEY, []);
    for (const s of all) {
      if (!s.paid) continue;
      const matchP = principal && s.principal === principal;
      const matchU =
        username && s.username.toLowerCase() === username.toLowerCase();
      if (matchP || matchU) {
        hits.push({ gameId: s.gameId, score: s.score });
      }
    }
  }

  // Best score per game
  const best = new Map<string, number>();
  for (const h of hits) {
    if (!h.gameId) continue;
    const prev = best.get(h.gameId) ?? 0;
    if (h.score > prev) best.set(h.gameId, h.score);
  }
  if (!best.size) return [];

  // Titles / covers
  const ids = [...best.keys()].slice(0, limit);
  const games = await listArcadeGamesAsync();
  const byId = new Map(games.map((g) => [g.id, g]));

  const out: PlayerArcadeBoardGame[] = [];
  for (const gameId of ids) {
    const g = byId.get(gameId) || getArcadeGame(gameId);
    out.push({
      gameId,
      title: g?.title || gameId,
      imageUrl: g?.imageUrl || "/art/arcade-cabinet.jpg",
      bestScore: best.get(gameId) || 0,
    });
  }

  // Optional ranks (best-effort, parallel limited)
  await Promise.all(
    out.slice(0, 8).map(async (row) => {
      try {
        const board = await listScoresAsync(row.gameId, 100);
        const idx = board.findIndex(
          (s) =>
            (principal && s.principal === principal) ||
            (username &&
              s.username.toLowerCase() === username.toLowerCase()),
        );
        if (idx >= 0) row.rank = idx + 1;
      } catch {
        /* ignore */
      }
    }),
  );

  return out.sort((a, b) => b.bestScore - a.bestScore);
}

async function persistScoreToSupabase(row: LeaderboardEntry, sessionId?: string) {
  if (!isSupabaseConfigured() || !row.paid) return false;
  try {
    const sb = getSupabase()!;
    const payload = {
      id: row.id,
      game_id: row.gameId,
      username: row.username,
      principal: row.principal || "",
      score: row.score,
      paid: true,
      play_fee: row.playFeePaid,
      play_fee_token: row.playFeeToken,
      session_id: sessionId || null,
      end_reason: row.endReason || null,
      settlement_kind: row.settlementKind || null,
      settlement_note: row.settlementNote || null,
      at: row.at,
    };
    const { error: rpcErr } = await sb.rpc("gh_arcade_upsert_score", {
      p: payload,
    });
    if (!rpcErr) return true;
    const { error } = await sb.from("gh_arcade_scores").upsert(payload, {
      onConflict: "id",
    });
    if (error) {
      console.warn("[arcade] persist score", rpcErr?.message, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[arcade] persistScoreToSupabase", e);
    return false;
  }
}

/** One row per player: best score + earnings for this cabinet. */
export type LeaderboardPlayerRow = {
  rank: number;
  username: string;
  principal: string;
  bestScore: number;
  at: string;
  /** Lifetime prize/creator earnings on this game (pending + claimed) */
  lifetimeIcp: number;
  lifetimeGamer: number;
  pendingIcp: number;
  pendingGamer: number;
  claimedIcp: number;
  claimedGamer: number;
};

export function listLeaderboardWithEarnings(
  gameId: string,
  limit = 25,
): LeaderboardPlayerRow[] {
  const scores = listScores(gameId, 200);
  // Best score per principal
  const best = new Map<
    string,
    { username: string; principal: string; bestScore: number; at: string }
  >();
  for (const s of scores) {
    const k = s.principal || s.username;
    const prev = best.get(k);
    if (!prev || s.score > prev.bestScore) {
      best.set(k, {
        username: s.username,
        principal: s.principal,
        bestScore: s.score,
        at: s.at,
      });
    }
  }
  const earnAll = listPlayerEarningsForGame(gameId);
  const earnByP = new Map(earnAll.map((e) => [e.principal || e.username, e]));

  const rows: LeaderboardPlayerRow[] = [...best.values()]
    .sort((a, b) => b.bestScore - a.bestScore || b.at.localeCompare(a.at))
    .slice(0, limit)
    .map((b, i) => {
      const e = earnByP.get(b.principal) || earnByP.get(b.username);
      return {
        rank: i + 1,
        username: b.username,
        principal: b.principal,
        bestScore: b.bestScore,
        at: b.at,
        lifetimeIcp: e?.lifetimeIcp ?? 0,
        lifetimeGamer: e?.lifetimeGamer ?? 0,
        pendingIcp: e?.pendingIcp ?? 0,
        pendingGamer: e?.pendingGamer ?? 0,
        claimedIcp: e?.claimedIcp ?? 0,
        claimedGamer: e?.claimedGamer ?? 0,
      };
    });
  return rows;
}

/** Async leaderboard — scores from Supabase, earnings still local until claimed */
export async function listLeaderboardWithEarningsAsync(
  gameId: string,
  limit = 25,
): Promise<LeaderboardPlayerRow[]> {
  const scores = await listScoresAsync(gameId, 200);
  const best = new Map<
    string,
    { username: string; principal: string; bestScore: number; at: string }
  >();
  for (const s of scores) {
    const k = s.principal || s.username;
    const prev = best.get(k);
    if (!prev || s.score > prev.bestScore) {
      best.set(k, {
        username: s.username,
        principal: s.principal,
        bestScore: s.score,
        at: s.at,
      });
    }
  }
  const earnAll = listPlayerEarningsForGame(gameId);
  const earnByP = new Map(earnAll.map((e) => [e.principal || e.username, e]));
  return [...best.values()]
    .sort((a, b) => b.bestScore - a.bestScore || b.at.localeCompare(a.at))
    .slice(0, limit)
    .map((b, i) => {
      const e = earnByP.get(b.principal) || earnByP.get(b.username);
      return {
        rank: i + 1,
        username: b.username,
        principal: b.principal,
        bestScore: b.bestScore,
        at: b.at,
        lifetimeIcp: e?.lifetimeIcp ?? 0,
        lifetimeGamer: e?.lifetimeGamer ?? 0,
        pendingIcp: e?.pendingIcp ?? 0,
        pendingGamer: e?.pendingGamer ?? 0,
        claimedIcp: e?.claimedIcp ?? 0,
        claimedGamer: e?.claimedGamer ?? 0,
      };
    });
}

export function formatEarningsShort(row: {
  lifetimeIcp: number;
  lifetimeGamer: number;
  pendingIcp?: number;
  pendingGamer?: number;
}): string {
  const parts: string[] = [];
  if (row.lifetimeIcp > 0) parts.push(`${row.lifetimeIcp} ICP`);
  if (row.lifetimeGamer > 0) parts.push(`${row.lifetimeGamer} GAMER`);
  if (parts.length === 0) return "—";
  const pending =
    (row.pendingIcp ?? 0) > 0 || (row.pendingGamer ?? 0) > 0
      ? " (pending)"
      : "";
  return parts.join(" · ") + pending;
}

export function listPayoutEvents(gameId: string, limit = 20): ArcadePayoutEvent[] {
  const all = readJson<ArcadePayoutEvent[]>(PAYOUTS_KEY, []);
  return all
    .filter((e) => e.gameId === gameId)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

type SettledSessionRecord = {
  sessionId: string;
  gameId: string;
  score: number;
  settlement: PrizeSettlement | null;
  rowId: string;
  tx: string;
  at: string;
  note?: string;
};

function getSettledSession(sessionId: string): SettledSessionRecord | null {
  if (!sessionId) return null;
  const all = readJson<Record<string, SettledSessionRecord>>(
    SETTLED_SESSIONS_KEY,
    {},
  );
  return all[sessionId] || null;
}

function markSessionSettled(rec: SettledSessionRecord) {
  const all = readJson<Record<string, SettledSessionRecord>>(
    SETTLED_SESSIONS_KEY,
    {},
  );
  all[rec.sessionId] = rec;
  writeJson(SETTLED_SESSIONS_KEY, all);
}

/**
 * Record paid score + settle against game escrow.
 *
 * **Idempotent when `sessionId` is provided** — safe to retry after canister lag/errors.
 * Replays return the original settlement without double-crediting escrow/earnings.
 *
 * Money flow:
 * 1) Ranked play fee was already debited from player subaccount → lands in game escrow
 * 2) Settlement credits PENDING earnings (claim later)
 * 3) New high-score refunds return fee from escrow → play subaccount immediately
 */
export function submitScore(
  entry: Omit<LeaderboardEntry, "id" | "at"> & {
    at?: string;
    /** Secure session id — required for safe canister retry */
    sessionId?: string;
  },
): {
  row: LeaderboardEntry;
  settlement: PrizeSettlement | null;
  alreadySettled?: boolean;
  tx?: string;
} | null {
  if (!entry.paid) {
    const row: LeaderboardEntry = {
      ...entry,
      id: uid("scr"),
      at: entry.at || new Date().toISOString(),
      settlementKind: "free",
      settlementNote: "Free play — not on board, no fee.",
    };
    return { row, settlement: null };
  }

  // ── Idempotent retry: same session never settles twice ──
  if (entry.sessionId) {
    const prior = getSettledSession(entry.sessionId);
    if (prior) {
      const row: LeaderboardEntry = {
        ...entry,
        id: prior.rowId,
        score: prior.score,
        at: prior.at,
        settlementKind: prior.settlement?.kind,
        settlementNote:
          prior.note ||
          "Already settled for this session (idempotent retry).",
      };
      return {
        row,
        settlement: prior.settlement,
        alreadySettled: true,
        tx: prior.tx,
      };
    }
  }

  const game = getArcadeGame(entry.gameId);
  if (!game) return null;

  const token = entry.playFeeToken;
  const fee = entry.playFeePaid;

  // Ensure fee is inside this game's escrow (player already debited at insert)
  const esc = getGameEscrow(entry.gameId);
  if (token === "ICP") esc.icp = roundTok(esc.icp + fee, "ICP");
  else esc.gamer = roundTok(esc.gamer + fee, "GAMER");
  saveEscrow(esc);
  appendLedger({
    gameId: entry.gameId,
    principal: entry.principal,
    username: entry.username,
    at: new Date().toISOString(),
    kind: "play_fee_in",
    token,
    amount: fee,
    note: entry.sessionId
      ? `Play fee into escrow ${game.escrowId} · session ${entry.sessionId}`
      : `Play fee into escrow ${game.escrowId}`,
  });

  const boardBefore = listScores(entry.gameId, 200).map((s) => ({
    id: s.id,
    username: s.username,
    principal: s.principal,
    score: s.score,
    at: s.at,
  }));

  const settlement = settlePaidPlay({
    playFee: fee,
    token,
    score: entry.score,
    player: { username: entry.username, principal: entry.principal },
    creator: {
      username: game.creator,
      principal: game.creatorPrincipal || game.creator,
    },
    payoutTopN: clampPayoutTopN(game.payoutTopN),
    boardBefore,
  });

  const esc2 = getGameEscrow(entry.gameId);

  if (settlement.kind === "new_high_score_refund") {
    const ref = settlement.refundAmount;
    if (token === "ICP") {
      esc2.icp = roundTok(Math.max(0, esc2.icp - ref), "ICP");
    } else {
      esc2.gamer = roundTok(Math.max(0, esc2.gamer - ref), "GAMER");
    }
    saveEscrow(esc2);
    const bal = getPlayBalances();
    if (token === "ICP") bal.icp = roundTok(bal.icp + ref, "ICP");
    else bal.gamer = roundTok(bal.gamer + ref, "GAMER");
    writeJson(BALANCE_KEY, bal);
    appendLedger({
      gameId: entry.gameId,
      principal: entry.principal,
      username: entry.username,
      at: new Date().toISOString(),
      kind: "high_score_refund",
      token,
      amount: ref,
      note: "New high score — fee refunded to play subaccount",
    });
  } else if (settlement.kind === "distributed") {
    if (token === "ICP") {
      esc2.platformIcp = roundTok(
        esc2.platformIcp + settlement.platformCut,
        "ICP",
      );
    } else {
      esc2.platformGamer = roundTok(
        esc2.platformGamer + settlement.platformCut,
        "GAMER",
      );
    }
    saveEscrow(esc2);
    creditPendingEarnings({
      gameId: entry.gameId,
      principal: settlement.creator.principal,
      username: settlement.creator.username,
      token,
      amount: settlement.creatorCut,
      kind: "creator_fee",
      note: "Creator 3% of play fee (claimable)",
    });
    for (const line of settlement.payouts) {
      creditPendingEarnings({
        gameId: entry.gameId,
        principal: line.principal,
        username: line.username,
        token,
        amount: line.amount,
        kind: "prize_win",
        note: `Prize rank #${line.rank} (claimable from escrow)`,
      });
    }
  } else if (settlement.kind === "no_recipients") {
    if (token === "ICP") {
      esc2.platformIcp = roundTok(
        esc2.platformIcp + settlement.platformCut,
        "ICP",
      );
    } else {
      esc2.platformGamer = roundTok(
        esc2.platformGamer + settlement.platformCut,
        "GAMER",
      );
    }
    saveEscrow(esc2);
    creditPendingEarnings({
      gameId: entry.gameId,
      principal: game.creatorPrincipal || game.creator,
      username: game.creator,
      token,
      amount: settlement.creatorCut,
      kind: "creator_fee",
      note: "Creator 3% (claimable)",
    });
  }

  const rowId = uid("scr");
  const at = entry.at || new Date().toISOString();
  const note =
    settlement.kind === "new_high_score_refund"
      ? settlement.note
      : `${settlement.note} Winnings stay in game escrow until claimed.`;
  const row: LeaderboardEntry = {
    ...entry,
    id: rowId,
    at,
    settlementKind: settlement.kind,
    settlementNote: note,
  };
  // Session cache only — source of truth is Supabase
  const all = readJson<LeaderboardEntry[]>(SCORES_KEY, []);
  all.push(row);
  writeJson(SCORES_KEY, all);
  void persistScoreToSupabase(row, entry.sessionId);

  const ev: ArcadePayoutEvent = {
    id: uid("pay"),
    gameId: entry.gameId,
    at: row.at,
    kind: settlement.kind,
    playFee: settlement.playFee,
    token: settlement.token,
    playerUsername: entry.username,
    score: entry.score,
    creatorCut:
      settlement.kind === "new_high_score_refund" ? 0 : settlement.creatorCut,
    platformCut:
      settlement.kind === "new_high_score_refund" ? 0 : settlement.platformCut,
    prizePool:
      settlement.kind === "new_high_score_refund" ? 0 : settlement.prizePool,
    refundAmount:
      settlement.kind === "new_high_score_refund"
        ? settlement.refundAmount
        : undefined,
    potCredit:
      settlement.kind === "no_recipients" ? settlement.potCredit : undefined,
    lines:
      settlement.kind === "distributed"
        ? settlement.payouts.map((p) => ({
            username: p.username,
            principal: p.principal,
            rank: p.rank,
            amount: p.amount,
          }))
        : [],
    note: row.settlementNote || settlement.note,
  };
  const pays = readJson<ArcadePayoutEvent[]>(PAYOUTS_KEY, []);
  pays.push(ev);
  writeJson(PAYOUTS_KEY, pays);

  const g = getArcadeGame(entry.gameId);
  if (g) {
    const next = normalizeGame({
      ...g,
      plays: (g.plays || 0) + 1,
      highScore:
        entry.score > (g.highScore || 0) ? entry.score : g.highScore,
      highScoreBy:
        entry.score > (g.highScore || 0) ? entry.username : g.highScoreBy,
    });
    upsertGamesCache(next);
    void persistGameToSupabase(next);
  }

  const tx = entry.sessionId
    ? `settle:${entry.sessionId}`
    : `settle:${rowId}`;
  if (entry.sessionId) {
    markSessionSettled({
      sessionId: entry.sessionId,
      gameId: entry.gameId,
      score: entry.score,
      settlement,
      rowId,
      tx,
      at,
      note,
    });
  }

  return { row, settlement, alreadySettled: false, tx };
}

export function getPlayBalances(): { icp: number; gamer: number } {
  return readJson(BALANCE_KEY, { icp: 2.5, gamer: 500 });
}

export function debitPlayFee(
  token: "ICP" | "GAMER",
  amount: number,
): { ok: boolean; balances: { icp: number; gamer: number }; error?: string } {
  const bal = getPlayBalances();
  if (amount <= 0) return { ok: true, balances: bal };
  if (token === "ICP") {
    if (bal.icp < amount) {
      return {
        ok: false,
        balances: bal,
        error: `Need ${amount} ICP in play subaccount (have ${bal.icp.toFixed(4)})`,
      };
    }
    bal.icp = Math.round((bal.icp - amount) * 1e8) / 1e8;
  } else {
    if (bal.gamer < amount) {
      return {
        ok: false,
        balances: bal,
        error: `Need ${amount} GAMER in play subaccount (have ${bal.gamer})`,
      };
    }
    bal.gamer = Math.round((bal.gamer - amount) * 100) / 100;
  }
  writeJson(BALANCE_KEY, bal);
  return { ok: true, balances: bal };
}

export function formatPlayFee(fee: number, token: "ICP" | "GAMER"): string {
  if (token === "GAMER") return `${fee} GAMER`;
  const s = fee < 0.01 ? fee.toFixed(4) : fee.toFixed(3);
  return `${s.replace(/0+$/, "").replace(/\.$/, "")} ICP`;
}

export type {
  ArcadeGame,
  ArcadePayoutEvent,
  EarningsLedgerEntry,
  GameEscrowAccount,
  LeaderboardEntry,
  PlaySession,
  PlayerGameEarnings,
};

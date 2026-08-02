/**
 * Betable.fun integration for gamerholic tournaments & challenges.
 *
 * Market creation rules (esports):
 * - Category: Esports (minted label on dexsta)
 * - Multi-outcome free-text labels (teams need not be betable users)
 * - Host (caller) must be a betable member / category license holder
 * - Creator fee: 1% → tournament host (market creator)
 * - split_with_winner + fixed_split_recipient = tournament/challenge escrow
 *   so winner-fee share always pays the pot, no matter which outcome wins
 * - stop_bets closes trading without finalizing resolution
 */

import { Actor, type Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { createAgent, getIcHost, isLocalHost } from "./canisters";
import { betableMarketFactoryIdl } from "./betable-idl";

function envOr(key: string, fallback = ""): string {
  const v = process.env[key];
  return v && v.trim().length > 0 ? v.trim() : fallback;
}

/** Default local market_factory id from betable dfx; override via env. */
export const BETABLE_FACTORY_ID = envOr(
  "NEXT_PUBLIC_BETABLE_MARKET_FACTORY_ID",
  envOr("NEXT_PUBLIC_MARKET_FACTORY_CANISTER_ID", ""),
);

/** 1% creator fee paid to market creator (tournament host). */
export const BETABLE_CREATOR_FEE = 0.01;

/**
 * % of creator fee routed to escrow (split_with_winner).
 * With creator fee 1% and split 100%, entire 1% goes to escrow — host keeps 0 from market fees.
 * Default 0: host keeps full 1%; set via env if pot growth from volume is desired.
 * Product note: host fee on entry pot is separate from this market creator fee.
 */
export const BETABLE_ESCROW_SPLIT_PCT = Number(
  envOr("NEXT_PUBLIC_BETABLE_ESCROW_SPLIT_PCT", "100"),
);

export const BETABLE_ESPORTS_CATEGORY = envOr(
  "NEXT_PUBLIC_BETABLE_ESPORTS_CATEGORY",
  "Esports",
);

export type BetableMarketStatus =
  | "pending"
  | "active"
  | "closed"
  | "resolved"
  | "canceled"
  | "unknown";

export type BetableMarket = {
  id: string;
  title: string;
  status: BetableMarketStatus;
  creatorFee: number;
  outcomes: string[];
  splitWithWinner: boolean;
  externalOutcomes: boolean;
  resolvedToIndex: number | null;
  closeDateMs: number;
};

export function isBetableConfigured(): boolean {
  return Boolean(BETABLE_FACTORY_ID && BETABLE_FACTORY_ID.length > 5);
}

function statusFromVariant(s: unknown): BetableMarketStatus {
  if (!s || typeof s !== "object") return "unknown";
  const k = Object.keys(s as object)[0];
  if (
    k === "pending" ||
    k === "active" ||
    k === "closed" ||
    k === "resolved" ||
    k === "canceled"
  ) {
    return k;
  }
  return "unknown";
}

export async function createBetableFactoryActor(identity?: Identity | null) {
  if (!isBetableConfigured()) return null;
  const agent = await createAgent(identity);
  return Actor.createActor(betableMarketFactoryIdl as never, {
    agent,
    canisterId: BETABLE_FACTORY_ID,
  }) as {
    create_market: (...args: unknown[]) => Promise<string>;
    get_market: (id: string) => Promise<[] | [Record<string, unknown>]>;
    stop_bets: (id: string) => Promise<boolean>;
    close_market: (id: string) => Promise<boolean>;
  };
}

export async function getBetableMarket(
  marketId: string,
  identity?: Identity | null,
): Promise<BetableMarket | null> {
  if (!marketId || !isBetableConfigured()) return null;
  const actor = await createBetableFactoryActor(identity);
  if (!actor) return null;
  try {
    const opt = await actor.get_market(marketId);
    const m = Array.isArray(opt) && opt.length ? opt[0] : null;
    if (!m) return null;
    const resolvedIdx = m.resolved_to_index as [] | [bigint] | undefined;
    return {
      id: String(m.id),
      title: String(m.title ?? ""),
      status: statusFromVariant(m.status),
      creatorFee: Number(m.creator_fee ?? 0),
      outcomes: Array.isArray(m.outcomes) ? (m.outcomes as string[]) : [],
      splitWithWinner: Boolean(m.split_with_winner),
      externalOutcomes: Boolean(m.external_outcomes),
      resolvedToIndex:
        resolvedIdx && Array.isArray(resolvedIdx) && resolvedIdx.length
          ? Number(resolvedIdx[0])
          : null,
      closeDateMs: Number(m.close_date ?? 0) / 1_000_000,
    };
  } catch {
    return null;
  }
}

/** True when market is fully settled (resolved). Closed-only is not enough for prize claim. */
export function isBetableMarketSettled(m: BetableMarket | null): boolean {
  return m?.status === "resolved";
}

export type CreateEsportsMarketInput = {
  title: string;
  description: string;
  /** Game title (e.g. Tekken 8) — required on betable description/title */
  game: string;
  /** Console / platform (e.g. PS5, PC) — required on betable description/title */
  console: string;
  /** Free-text outcome labels (team names, players) — not betable users */
  outcomes: string[];
  /** Close / resolve-by time */
  closeDate: Date;
  /** Resolution criteria text */
  resolutionCriteria: string;
  country?: string;
  liveStreamUrl?: string;
  /** Gamerholic backend principal (escrow owner) */
  escrowOwnerPrincipal: string;
  /** 32-byte tournament/challenge subaccount */
  escrowSubaccount: Uint8Array | number[];
  /**
   * Creator fee as fraction (default 0.01 = 1% to host).
   * Host is msg.caller (must hold Esports category access on betable).
   */
  creatorFee?: number;
  /**
   * % of creator fee paid to escrow on resolve (default 100 if split enabled).
   * Set 0 to disable split (host keeps full creator fee).
   */
  escrowSplitPct?: number;
  signalSources?: { url: string; title: string; source_type: string }[];
  licenseXftId?: number | null;
  /** tournament | match entity id for signal source metadata */
  entityId?: string;
  entityKind?: "tournament" | "match";
};

/** Build betable title including game + console so they show in market cards. */
export function formatEsportsMarketTitle(
  title: string,
  game: string,
  consoleName: string,
): string {
  const base = title.trim() || "Esports match";
  const g = game.trim();
  const c = consoleName.trim();
  const suffix = [g, c].filter(Boolean).join(" · ");
  if (!suffix) return base;
  // Avoid double-append if already present
  if (base.toLowerCase().includes(g.toLowerCase()) && (!c || base.toLowerCase().includes(c.toLowerCase()))) {
    return base;
  }
  return `${base} · ${suffix}`;
}

/** Description always carries Game / Console lines for betable UI + resolution. */
export function formatEsportsMarketDescription(input: {
  description?: string;
  game: string;
  console: string;
  entityId?: string;
  entityKind?: "tournament" | "match";
}): string {
  const game = input.game.trim() || "Unknown";
  const consoleName = input.console.trim() || "Unknown";
  const lines = [
    input.description?.trim() || "",
    "",
    `Game: ${game}`,
    `Console: ${consoleName}`,
  ];
  if (input.entityId) {
    lines.push(
      `${input.entityKind === "match" ? "Match" : "Tournament"} ID: ${input.entityId}`,
    );
  }
  lines.push("Source: Gamerholic");
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
}

/**
 * Create a multi-outcome Esports market on betable with:
 * - external_outcomes (teams as labels)
 * - fixed split recipient = tournament escrow
 * - 1% creator fee to host (caller)
 * - game + console embedded in title, description, and resolution criteria
 */
export async function createEsportsBetableMarket(
  input: CreateEsportsMarketInput,
  identity?: Identity | null,
): Promise<{ marketId: string }> {
  if (!isBetableConfigured()) {
    throw new Error(
      "Betable not configured. Set NEXT_PUBLIC_BETABLE_MARKET_FACTORY_ID.",
    );
  }
  const actor = await createBetableFactoryActor(identity);
  if (!actor) throw new Error("Failed to create betable actor");

  const game = input.game.trim();
  const consoleName = input.console.trim();
  if (!game) throw new Error("game is required when creating a betable market");
  if (!consoleName) {
    throw new Error("console is required when creating a betable market");
  }

  const outcomes = input.outcomes.map((o) => o.trim()).filter(Boolean);
  if (outcomes.length < 2) {
    throw new Error("At least 2 outcome labels required");
  }
  const closeNs = BigInt(input.closeDate.getTime()) * BigInt(1_000_000);
  if (closeNs <= BigInt(Date.now()) * BigInt(1_000_000)) {
    throw new Error("Close date must be in the future");
  }

  const creatorFee = input.creatorFee ?? BETABLE_CREATOR_FEE;
  const splitPct = input.escrowSplitPct ?? BETABLE_ESCROW_SPLIT_PCT;
  const splitWithWinner = splitPct > 0;
  if (splitWithWinner && (splitPct < 1 || splitPct > 100)) {
    throw new Error("escrowSplitPct must be 1–100 (or 0 to disable)");
  }

  let escrowOwner: Principal;
  try {
    escrowOwner = Principal.fromText(input.escrowOwnerPrincipal);
  } catch {
    throw new Error("Invalid escrow owner principal");
  }

  const sub = Array.from(input.escrowSubaccount);
  if (sub.length !== 32) {
    throw new Error("Escrow subaccount must be 32 bytes");
  }

  const license: [] | [bigint] =
    input.licenseXftId != null && Number.isFinite(input.licenseXftId)
      ? [BigInt(input.licenseXftId)]
      : [];

  const title = formatEsportsMarketTitle(input.title, game, consoleName);
  const description = formatEsportsMarketDescription({
    description: input.description,
    game,
    console: consoleName,
    entityId: input.entityId,
    entityKind: input.entityKind,
  });
  const resolutionCriteria =
    input.resolutionCriteria.trim() ||
    `Official gamerholic result for ${game} (${consoleName}) determines the winning outcome.`;

  const signalSources = [
    ...(input.signalSources ?? []),
    {
      url: input.entityId
        ? `gamerholic://${input.entityKind || "tournament"}/${input.entityId}`
        : "https://gamerholic.app",
      title: `${game} · ${consoleName}`,
      source_type: "data" as const,
    },
  ];

  const marketId = await actor.create_market(
    title,
    description,
    input.country ?? "Global",
    BETABLE_ESPORTS_CATEGORY,
    closeNs,
    resolutionCriteria,
    "",
    creatorFee,
    signalSources.map((s) => ({
      url: s.url,
      title: s.title,
      source_type: s.source_type,
    })),
    license,
    { multi_outcome: null },
    outcomes,
    splitWithWinner,
    splitWithWinner ? [BigInt(Math.round(splitPct))] : [],
    input.liveStreamUrl ?? "",
    [],
    true, // external_outcomes
    [escrowOwner],
    [sub],
  );

  return { marketId: String(marketId) };
}

/**
 * Stop accepting bets (status → closed) without resolving the market.
 * Host/creator should call when the match/tournament starts.
 */
export async function stopBetableBets(
  marketId: string,
  identity?: Identity | null,
): Promise<boolean> {
  if (!marketId || !isBetableConfigured()) return false;
  const actor = await createBetableFactoryActor(identity);
  if (!actor) return false;
  try {
    return await actor.stop_bets(marketId);
  } catch {
    return false;
  }
}

/** Public betable market URL (mainnet or local). */
export function betableMarketUrl(marketId: string): string {
  const base = envOr(
    "NEXT_PUBLIC_BETABLE_APP_URL",
    isLocalHost(getIcHost())
      ? "http://localhost:3000"
      : "https://betable.fun",
  );
  return `${base.replace(/\/$/, "")}/market/${marketId}`;
}

export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): number[] {
  const h = hex.replace(/^0x/i, "");
  if (h.length % 2 !== 0) throw new Error("Invalid hex");
  const out: number[] = [];
  for (let i = 0; i < h.length; i += 2) {
    out.push(parseInt(h.slice(i, i + 2), 16));
  }
  return out;
}

// ── Gamerholic → Betable secured HTTP API (Esports only) ──────────────

function betableApiBase(): string {
  return envOr(
    "NEXT_PUBLIC_BETABLE_APP_URL",
    envOr("BETABLE_API_URL", "https://betable.fun"),
  ).replace(/\/$/, "");
}

/** Server-only secret for x-gamerholic-secret (never expose as NEXT_PUBLIC_). */
function gamerholicApiSecret(): string {
  return envOr("GAMERHOLIC_API_SECRET", envOr("BETABLE_GAMERHOLIC_SECRET", ""));
}

async function betableEsportsFetch(
  path: string,
  opts: { method?: string; json?: Record<string, unknown> } = {},
): Promise<{ ok: boolean; data: any; status: number }> {
  const secret = gamerholicApiSecret();
  if (!secret && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      status: 503,
      data: { error: "GAMERHOLIC_API_SECRET not configured" },
    };
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(secret
      ? {
          "x-gamerholic-secret": secret,
        }
      : {}),
  };
  const res = await fetch(`${betableApiBase()}${path}`, {
    method: opts.method || "POST",
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
    cache: "no-store",
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = { error: await res.text() };
  }
  return { ok: res.ok && data?.success !== false, data, status: res.status };
}

export type EsportsOutcomePayload = {
  label: string;
  avatar_url?: string;
  source_id: string;
  source_kind?: "team" | "player";
  active?: boolean;
};

/**
 * Link market to tournament/match + seed outcomes (after create_market).
 * Requires gamerholic secret on betable.
 */
export async function linkEsportsOutcomes(params: {
  marketId: string;
  entityId: string;
  entityKind: "tournament" | "match";
  outcomes: EsportsOutcomePayload[];
}): Promise<{ ok: boolean; error?: string }> {
  const r = await betableEsportsFetch("/api/esports/outcomes", {
    json: {
      action: "link",
      market_id: params.marketId,
      entity_id: params.entityId,
      entity_kind: params.entityKind,
      outcomes: params.outcomes.map((o) => ({
        label: o.label,
        avatar_url: o.avatar_url || "",
        source_id: o.source_id,
        source_kind: o.source_kind || "team",
        active: o.active !== false,
      })),
    },
  });
  return { ok: r.ok, error: r.data?.error };
}

/**
 * Player/team joined tournament or match — add multi-outcome option.
 * Sends avatar + team name + tournament/match id.
 */
export async function addEsportsOutcome(params: {
  marketId: string;
  entityId: string;
  entityKind: "tournament" | "match";
  label: string;
  avatarUrl?: string;
  sourceId: string;
  sourceKind?: "team" | "player";
}): Promise<{ ok: boolean; error?: string }> {
  const r = await betableEsportsFetch("/api/esports/outcomes", {
    json: {
      action: "add",
      market_id: params.marketId,
      entity_id: params.entityId,
      entity_kind: params.entityKind,
      tournament_id:
        params.entityKind === "tournament" ? params.entityId : undefined,
      match_id: params.entityKind === "match" ? params.entityId : undefined,
      label: params.label,
      avatar_url: params.avatarUrl || "",
      source_id: params.sourceId,
      source_kind: params.sourceKind || "team",
    },
  });
  return { ok: r.ok, error: r.data?.error };
}

/**
 * Entrant left tournament (withdraw) — soft-remove outcome (not via match loss).
 */
export async function removeEsportsOutcome(params: {
  marketId: string;
  sourceId: string;
  entityId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const r = await betableEsportsFetch("/api/esports/outcomes", {
    json: {
      action: "remove",
      market_id: params.marketId,
      source_id: params.sourceId,
      entity_id: params.entityId,
    },
  });
  return { ok: r.ok, error: r.data?.error };
}

/**
 * Finalize tournament or heads-up match → settle betable market.
 */
export async function settleEsportsMarket(params: {
  marketId: string;
  winningSourceId?: string;
  winningIndex?: number;
  entityId?: string;
  entityKind?: "tournament" | "match";
}): Promise<{ ok: boolean; error?: string; data?: any }> {
  const r = await betableEsportsFetch("/api/esports/settle", {
    json: {
      market_id: params.marketId,
      winning_source_id: params.winningSourceId,
      winning_index: params.winningIndex,
      entity_id: params.entityId,
      entity_kind: params.entityKind,
    },
  });
  return { ok: r.ok, error: r.data?.error, data: r.data };
}

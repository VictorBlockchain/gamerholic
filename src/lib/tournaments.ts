/**
 * Tournament domain types.
 * Catalog is filled by tournament-service from the canister (no mock list).
 */

import { ART } from "@/lib/art";

export type TournamentStatus =
  | "draft"
  | "open"
  | "checkin"
  | "live"
  | "settled"
  | "cancelled";

export type BracketMatchStatus = "pending" | "ready" | "live" | "done";

export type TournamentEntrant = {
  id: string;
  username: string;
  seed: number;
  checkedIn: boolean;
  paid: boolean;
  record?: string;
  isHost?: boolean;
  teamTag?: string;
  streamUrl?: string;
};

export type BracketMatch = {
  id: string;
  round: number;
  slot: number;
  p1: string | null;
  p2: string | null;
  winner: string | null;
  score?: string;
  status: BracketMatchStatus;
  challengeId?: string;
};

export type TournamentMarketLine = {
  label: string;
  odds: string;
  pct: number;
  volumeIcp?: number;
};

export type TournamentDetail = {
  id: string;
  title: string;
  game: string;
  console: string;
  description: string;
  coverUrl: string;
  status: TournamentStatus;
  format: "single_elim" | "double_elim" | "round_robin";
  /**
   * bracket = elim tree (1v1 progression).
   * group_pot = multiplayer table / FFA pot (room-style seats, no elim tree).
   */
  kind: "bracket" | "group_pot";
  entryFeeIcp: number;
  hostFeePct: number;
  maxPlayers: number;
  hostUsername: string;
  scheduledAt: string | null;
  createdAt: string;
  teamEntry: boolean;
  registrationOpen: boolean;
  betable: boolean;
  marketId?: string;
  marketVolumeIcp?: number;
  marketLiquidityIcp?: number;
  marketStatus?: "open" | "live" | "settled";
  marketLines?: TournamentMarketLine[];
  prizePotIcp?: number;
  entrants: TournamentEntrant[];
  matches: BracketMatch[];
  rules?: string;
  streamUrl?: string;
  hostStats?: {
    tournamentsHosted: number;
    disputes: number;
    earningsIcp: number;
    record?: string;
  };
};

/** Runtime cache populated by tournament-service */
const tournamentCache = new Map<string, TournamentDetail>();

export function getTournament(id: string): TournamentDetail | undefined {
  return tournamentCache.get(id);
}

export function setTournamentCache(t: TournamentDetail) {
  tournamentCache.set(t.id, t);
}

export function setTournamentCacheMany(list: TournamentDetail[]) {
  tournamentCache.clear();
  for (const t of list) tournamentCache.set(t.id, t);
}

export function listCachedTournaments(): TournamentDetail[] {
  return Array.from(tournamentCache.values());
}

export const TOURNAMENT_LIST: TournamentDetail[] = [];

export function hostStatsFor(t: TournamentDetail) {
  return (
    t.hostStats ?? {
      tournamentsHosted: 0,
      disputes: 0,
      earningsIcp: 0,
      record: "—",
    }
  );
}

export function potFrom(t: TournamentDetail) {
  if (t.prizePotIcp != null) return t.prizePotIcp;
  return t.entryFeeIcp * t.entrants.filter((e) => e.paid).length;
}

export function hostCutFrom(t: TournamentDetail) {
  return potFrom(t) * (t.hostFeePct / 100);
}

export function prizePoolFrom(t: TournamentDetail) {
  return potFrom(t) - hostCutFrom(t);
}

export function filledLabel(t: TournamentDetail) {
  return `${t.entrants.length}/${t.maxPlayers}`;
}

export function statusTone(
  s: TournamentStatus,
): "brand" | "live" | "prize" | "success" | "muted" | "danger" {
  switch (s) {
    case "open":
    case "checkin":
      return "brand";
    case "live":
      return "live";
    case "settled":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "muted";
  }
}

export function statusLabel(s: TournamentStatus) {
  switch (s) {
    case "draft":
      return "Draft";
    case "open":
      return "Registration open";
    case "checkin":
      return "Check-in";
    case "live":
      return "Live";
    case "settled":
      return "Settled";
    case "cancelled":
      return "Cancelled";
  }
}

export function isGroupPotTournament(t: Pick<TournamentDetail, "kind" | "format">): boolean {
  return t.kind === "group_pot" || t.format === "round_robin";
}

export function tournamentKindLabel(t: Pick<TournamentDetail, "kind" | "format">): string {
  return isGroupPotTournament(t) ? "Group pot" : "Bracket";
}

export function formatIcp(n: number, digits = 1) {
  return `${n.toFixed(digits)} ICP`;
}

export function formatWhen(iso: string | null) {
  if (!iso) return "TBD";
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function totalRounds(matches: BracketMatch[]) {
  if (matches.length === 0) return 0;
  return Math.max(...matches.map((m) => m.round)) + 1;
}

export function matchesByRound(matches: BracketMatch[]) {
  const map = new Map<number, BracketMatch[]>();
  for (const m of matches) {
    const list = map.get(m.round) ?? [];
    list.push(m);
    map.set(m.round, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.slot - b.slot);
  }
  return map;
}

export function roundLabel(round: number, total: number): string {
  const fromEnd = total - 1 - round;
  if (fromEnd === 0) return "Finals";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  if (fromEnd === 3) return "Round of 16";
  return `Round ${round + 1}`;
}

export function minBetableStart(from = new Date()) {
  const d = new Date(from);
  d.setHours(d.getHours() + 1);
  return d;
}

export function entrantStreamMap(entrants: TournamentEntrant[]) {
  const m = new Map<string, string>();
  for (const e of entrants) {
    if (e.streamUrl) m.set(e.username, e.streamUrl);
  }
  return m;
}

/** Default cover when canister has none */
export const DEFAULT_TOURNAMENT_COVER = ART.battle;

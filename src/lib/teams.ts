/**
 * Teams — roster, covers, win splits, match history.
 * Demo store until canister + media upload is wired.
 */

import { ART } from "@/lib/art";
import type { ConsoleId } from "@/lib/profile";
import { CONSOLES } from "@/lib/profile";

export type { ConsoleId };

export type TeamMemberRole = "captain" | "member";

export type TeamMember = {
  id: string;
  username: string;
  role: TeamMemberRole;
  /** Share of team winnings 0–100 */
  winSplitPct: number;
  earningsIcp: number;
  record?: string;
};

export type Team = {
  id: string;
  name: string;
  tag: string;
  /** Primary title the squad competes in */
  game: string;
  /** Optional extra titles (falls back to [game]) */
  games?: string[];
  console: ConsoleId;
  bio: string;
  coverUrl: string;
  avatarUrl: string;
  members: TeamMember[];
  wins: number;
  losses: number;
  winStreak: number;
  lossStreak: number;
  bestWinStreak: number;
  createdAt: string;
};

export type TeamMatch = {
  id: string;
  kind: "challenge" | "tournament";
  title: string;
  game: string;
  console: string;
  result: "W" | "L" | "ongoing";
  opponent: string;
  stake?: string;
  prize?: string;
  at: string;
  entryFee?: string;
  players?: string;
};

export const TEAM_COVER_OPTIONS = [
  { id: "team", label: "Team win", url: ART.teamWin },
  { id: "highfive", label: "High five", url: ART.teamHighfive },
  { id: "arena", label: "Arena", url: ART.hero },
  { id: "battle", label: "Battle", url: ART.battle },
  { id: "headsUp", label: "Heads-up", url: ART.headsUp },
  { id: "arcade", label: "Arcade", url: ART.arcade },
] as const;

export const TEAM_AVATAR_OPTIONS = [
  { id: "a1", label: "Squad", url: ART.teamWin },
  { id: "a2", label: "Friends", url: ART.arcadeFriends },
  { id: "a3", label: "Battle", url: ART.battle },
  { id: "a4", label: "Heads-up", url: ART.headsUp },
  { id: "a5", label: "Gear", url: ART.gear },
] as const;

export const DEMO_TEAMS: Team[] = [
  {
    id: "tm1",
    name: "Neon Apex",
    tag: "NEON",
    game: "Apex Legends",
    games: ["Apex Legends", "Fortnite"],
    console: "PC",
    bio: "Ranked grinders. Squad drops only. Host nights on Fridays.",
    coverUrl: ART.teamWin,
    avatarUrl: ART.arcadeFriends,
    wins: 34,
    losses: 12,
    winStreak: 5,
    lossStreak: 0,
    bestWinStreak: 11,
    createdAt: "2026-05-01T12:00:00",
    members: [
      {
        id: "m1",
        username: "you",
        role: "captain",
        winSplitPct: 40,
        earningsIcp: 18.4,
        record: "22–8",
      },
      {
        id: "m2",
        username: "frag_queen",
        role: "member",
        winSplitPct: 35,
        earningsIcp: 14.2,
        record: "48–21",
      },
      {
        id: "m3",
        username: "drop_shot",
        role: "member",
        winSplitPct: 25,
        earningsIcp: 9.1,
        record: "4–1",
      },
    ],
  },
  {
    id: "tm2",
    name: "Volt Block",
    tag: "VOLT",
    game: "Street Fighter 6",
    games: ["Street Fighter 6", "Tekken 8"],
    console: "PS5",
    bio: "FT5 specialists. Neutral first, highlight second.",
    coverUrl: ART.battle,
    avatarUrl: ART.headsUp,
    wins: 19,
    losses: 7,
    winStreak: 2,
    lossStreak: 0,
    bestWinStreak: 6,
    createdAt: "2026-06-12T18:00:00",
    members: [
      {
        id: "m1",
        username: "you",
        role: "captain",
        winSplitPct: 55,
        earningsIcp: 11.0,
        record: "14–4",
      },
      {
        id: "m4",
        username: "ryu_main",
        role: "member",
        winSplitPct: 45,
        earningsIcp: 8.6,
        record: "11–6",
      },
    ],
  },
];

/** Per-team match/tournament history for detail page */
export const DEMO_TEAM_MATCHES: Record<string, TeamMatch[]> = {
  tm1: [
    {
      id: "tm1-c1",
      kind: "challenge",
      title: "Squad 3v3 — ranked pot",
      game: "Apex Legends",
      console: "PC",
      result: "W",
      opponent: "Iron Legion",
      stake: "6 ICP",
      prize: "11.4 ICP",
      at: "2026-07-28T20:00:00",
    },
    {
      id: "tm1-t1",
      kind: "tournament",
      title: "Apex Ranked Rumble",
      game: "Apex Legends",
      console: "PC",
      result: "W",
      opponent: "Field",
      entryFee: "1.5 ICP",
      prize: "8 ICP",
      players: "12/20",
      at: "2026-07-25T22:00:00",
    },
    {
      id: "tm1-c2",
      kind: "challenge",
      title: "Customs money match",
      game: "Apex Legends",
      console: "PC",
      result: "L",
      opponent: "Void Runners",
      stake: "4 ICP",
      prize: "—",
      at: "2026-07-22T19:00:00",
    },
  ],
  tm2: [
    {
      id: "tm2-c1",
      kind: "challenge",
      title: "FT5 money match",
      game: "Street Fighter 6",
      console: "PS5",
      result: "W",
      opponent: "Ken Collective",
      stake: "2 ICP",
      prize: "3.8 ICP",
      at: "2026-07-29T18:00:00",
    },
    {
      id: "tm2-t1",
      kind: "tournament",
      title: "Friday Night Bracket",
      game: "Street Fighter 6",
      console: "PS5",
      result: "ongoing",
      opponent: "Bracket field",
      entryFee: "0.5 ICP",
      players: "24/32",
      at: "2026-07-30T20:00:00",
    },
  ],
};

export { CONSOLES };

export function getTeamById(id: string): Team | undefined {
  return DEMO_TEAMS.find((t) => t.id === id);
}

export function getTeamMatches(teamId: string): TeamMatch[] {
  return DEMO_TEAM_MATCHES[teamId] ?? [];
}

export function teamRecordLabel(t: Team) {
  return `${t.wins}–${t.losses}`;
}

export function totalSplit(members: TeamMember[]) {
  return members.reduce((s, m) => s + m.winSplitPct, 0);
}

export function teamEarningsTotal(t: Team) {
  return t.members.reduce((s, m) => s + m.earningsIcp, 0);
}

export function teamWinRate(t: Team) {
  const n = t.wins + t.losses;
  if (n === 0) return 0;
  return Math.round((t.wins / n) * 100);
}

/** Games this squad plays (primary + extras) */
export function teamGames(t: Team): string[] {
  const list = [
    ...(t.games ?? []),
    t.game,
  ]
    .map((g) => g.trim())
    .filter(Boolean);
  return [...new Set(list)];
}

export function isTeamCaptain(t: Team, username: string): boolean {
  const u = username.trim().toLowerCase();
  if (!u) return false;
  return t.members.some(
    (m) => m.role === "captain" && m.username.toLowerCase() === u,
  );
}

export function isTeamMember(t: Team, username: string): boolean {
  const u = username.trim().toLowerCase();
  if (!u) return false;
  return t.members.some((m) => m.username.toLowerCase() === u);
}

/**
 * Teams the user captains or belongs to.
 * Matches member username (profile gamertag / username).
 */
export function myTeams(username = "you"): Team[] {
  const u = username.trim().toLowerCase();
  if (!u) return [];
  return DEMO_TEAMS.filter((t) =>
    t.members.some((m) => m.username.toLowerCase() === u),
  );
}

/** All known teams (demo catalog + optional Supabase later) */
export function listAllTeams(): Team[] {
  return [...DEMO_TEAMS];
}

/**
 * Typeahead for opponent squads — name / tag match.
 * Excludes teams in `excludeIds`.
 */
export function searchTeams(
  query: string,
  opts?: { excludeIds?: string[]; limit?: number },
): Team[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const exclude = new Set((opts?.excludeIds ?? []).map(String));
  const limit = opts?.limit ?? 12;

  const scored = listAllTeams()
    .filter((t) => !exclude.has(t.id))
    .map((t) => {
      const name = t.name.toLowerCase();
      const tag = t.tag.toLowerCase();
      let score = 99;
      if (name === q || tag === q) score = 0;
      else if (name.startsWith(q) || tag.startsWith(q)) score = 1;
      else if (name.includes(q) || tag.includes(q)) score = 2;
      else score = 99;
      return { t, score };
    })
    .filter((x) => x.score < 99)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.t.name.localeCompare(b.t.name);
    });

  return scored.slice(0, limit).map((x) => x.t);
}

/** Async search: demo list + Supabase `gh_teams` when configured */
export async function searchTeamsAsync(
  query: string,
  opts?: { excludeIds?: string[]; limit?: number },
): Promise<Team[]> {
  const local = searchTeams(query, opts);
  const map = new Map(local.map((t) => [t.id, t]));
  const q = query.trim();
  if (q.length < 1) return local;

  try {
    const { getSupabase, isSupabaseConfigured } = await import(
      "@/lib/supabase/client"
    );
    const { GH_TABLES } = await import("@/lib/supabase/tables");
    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb
          .from(GH_TABLES.teams)
          .select("*")
          .or(`name.ilike.%${q}%,tag.ilike.%${q}%`)
          .limit(opts?.limit ?? 12);
        for (const row of data || []) {
          const id = String(row.id || "");
          if (!id || opts?.excludeIds?.includes(id)) continue;
          const membersRaw = Array.isArray(row.members) ? row.members : [];
          const members: TeamMember[] = membersRaw.map(
            (m: Record<string, unknown>, i: number) => ({
              id: String(m.id || `m-${i}`),
              username: String(m.username || m.principal || "member"),
              role: m.role === "captain" ? "captain" : "member",
              winSplitPct: Number(m.winSplitPct ?? m.win_split_pct ?? 0),
              earningsIcp: Number(m.earningsIcp ?? 0),
            }),
          );
          const game = String(row.game || "Esports");
          const games = Array.isArray(row.games)
            ? row.games.map(String)
            : game
              ? [game]
              : [];
          map.set(id, {
            id,
            name: String(row.name || id),
            tag: String(row.tag || "TEAM").toUpperCase().slice(0, 5),
            game,
            games,
            console: (String(row.console || "PC") as ConsoleId) || "PC",
            bio: String(row.bio || ""),
            coverUrl: String(row.cover_url || ART.teamWin),
            avatarUrl: String(row.avatar_url || ART.arcadeFriends),
            members,
            wins: Number(row.wins ?? 0),
            losses: Number(row.losses ?? 0),
            winStreak: 0,
            lossStreak: 0,
            bestWinStreak: 0,
            createdAt: String(row.created_at || new Date().toISOString()),
          });
        }
      }
    }
  } catch {
    /* ignore mirror miss */
  }

  const all = [...map.values()];
  const ql = q.toLowerCase();
  return all
    .filter(
      (t) =>
        t.name.toLowerCase().includes(ql) ||
        t.tag.toLowerCase().includes(ql),
    )
    .slice(0, opts?.limit ?? 12);
}

export function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** File → object URL for demo uploads (client only) */
export function fileToObjectUrl(file: File | null): string | null {
  if (!file || typeof window === "undefined") return null;
  return URL.createObjectURL(file);
}

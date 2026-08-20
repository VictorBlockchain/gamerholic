/**
 * Gamer profile model.
 * Local draft meta + II principal; history comes from canisters / Supabase (no mock lists).
 */

import { ART } from "@/lib/art";
import { FALLBACK_GAMES } from "@/lib/chat/demo-data";

/** Preset game chip list for profile edit & moderator coverage */
export const DEMO_GAMES: readonly string[] = [...FALLBACK_GAMES];

/** Trim + collapse whitespace for custom game titles */
export function normalizeGameLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function gameKey(g: string): string {
  return normalizeGameLabel(g).toLowerCase();
}

/** Catalog presets first, then any selected custom titles not already listed */
export function mergeGameOptions(
  selected: readonly string[],
  catalog: readonly string[] = DEMO_GAMES,
): string[] {
  const seen = new Set(catalog.map(gameKey));
  const custom = selected.filter((g) => {
    const label = normalizeGameLabel(g);
    if (!label) return false;
    const k = gameKey(label);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return [...catalog, ...custom.map(normalizeGameLabel)];
}

/**
 * Toggle a game in the selection (case-insensitive match).
 * Uses catalog casing when the title matches a preset.
 */
export function toggleGameSelection(
  selected: readonly string[],
  game: string,
  catalog: readonly string[] = DEMO_GAMES,
): string[] {
  const label = normalizeGameLabel(game);
  if (!label) return [...selected];
  const k = gameKey(label);
  const catalogMatch = catalog.find((c) => gameKey(c) === k);
  const canonical = catalogMatch ?? label;
  const has = selected.some((s) => gameKey(s) === k);
  if (has) return selected.filter((s) => gameKey(s) !== k);
  return [...selected, canonical];
}

/**
 * Add a custom (or catalog) game if not already selected.
 * Returns { games, added, reason? }.
 */
export function addCustomGame(
  selected: readonly string[],
  raw: string,
  catalog: readonly string[] = DEMO_GAMES,
): { games: string[]; added: boolean; reason?: string } {
  const label = normalizeGameLabel(raw);
  if (!label) {
    return { games: [...selected], added: false, reason: "empty" };
  }
  if (label.length > 48) {
    return { games: [...selected], added: false, reason: "too_long" };
  }
  const k = gameKey(label);
  if (selected.some((s) => gameKey(s) === k)) {
    return { games: [...selected], added: false, reason: "duplicate" };
  }
  const catalogMatch = catalog.find((c) => gameKey(c) === k);
  return {
    games: [...selected, catalogMatch ?? label],
    added: true,
  };
}

export type ConsoleId =
  | "PC"
  | "PS5"
  | "Xbox"
  | "Switch"
  | "Multi";

/**
 * Platform role on Supabase `gh_profiles.role` (not on-chain).
 * - user — default
 * - moderator — console access (disputes UI, etc.)
 * - admin — shop, fees, role assignment + all moderator powers
 */
export type PlatformRole = "user" | "moderator" | "admin";

export const PLATFORM_ROLES: readonly PlatformRole[] = [
  "user",
  "moderator",
  "admin",
] as const;

export function parsePlatformRole(raw: unknown): PlatformRole {
  const s = String(raw || "")
    .trim()
    .toLowerCase();
  if (s === "admin" || s === "moderator" || s === "user") return s;
  return "user";
}

export function isPlatformAdmin(role?: PlatformRole | string | null): boolean {
  return parsePlatformRole(role) === "admin";
}

/** Admin or moderator (not plain user). */
export function isPlatformModerator(
  role?: PlatformRole | string | null,
): boolean {
  const r = parsePlatformRole(role);
  return r === "admin" || r === "moderator";
}

export function platformRoleLabel(role?: PlatformRole | string | null): string {
  switch (parsePlatformRole(role)) {
    case "admin":
      return "Admin";
    case "moderator":
      return "Moderator";
    default:
      return "User";
  }
}

export type GamerProfile = {
  username: string;
  gamertag: string;
  console: ConsoleId;
  games: string[];
  bio: string;
  /** Dexsta / Afta XFT token id used as avatar when set */
  dexstaXftId: string;
  /** Dexsta XFT contract principal for the avatar token */
  dexstaXftContract: string;
  /**
   * Linked Afta Cash II principal (from Connect Afta — not GH login principal).
   * Used to load owned XFTs for avatar picker.
   */
  aftaPrincipal: string;
  /**
   * Linked Betable II principal (from Connect Betable — may differ from GH).
   * Required to host/join betable tournaments & challenges.
   */
  betablePrincipal: string;
  /** Betable display name (may differ from GH username) — Esports outcome label */
  betableUsername: string;
  /** Betable avatar URL — Esports outcome image */
  betableAvatarUrl: string;
  /** Resolved avatar image URL (media cover or HTTPS) */
  avatarUrl: string;
  /** True when avatar XFT is a game asset (type-8 inventory; qty 1+) */
  avatarIsGameAsset: boolean;
  /** Cover image path — recommended 1600×600 */
  coverUrl: string;
  principal: string;
  level: number;
  xpProgress: number; // 0–100
  /**
   * User confirmed they are 18+ and accept platform terms.
   * Required once on profile create/edit; then treated as done.
   */
  acceptedOver18AndTerms?: boolean;
  /** ISO timestamp when terms / age were accepted */
  termsAcceptedAt?: string;
  /**
   * Supabase platform role (`gh_profiles.role`).
   * Independent of on-chain AdminMod / setAdmin; console ORs both.
   */
  role?: PlatformRole;
};

/** Profile banner presets — octopus mascot · 1600×600 */
export const COVER_OPTIONS = [
  {
    id: "gamerholic-neon",
    label: "Gamerholic neon",
    url: "/art/profile-covers/gamerholic-neon.jpg",
  },
  {
    id: "gamer-cyan",
    label: "Gamer cyan",
    url: "/art/profile-covers/gamer-cyan.jpg",
  },
  {
    id: "gamerholic-prize",
    label: "Gamerholic prize",
    url: "/art/profile-covers/gamerholic-prize.jpg",
  },
  {
    id: "gamer-violet",
    label: "Gamer violet",
    url: "/art/profile-covers/gamer-violet.jpg",
  },
  {
    id: "gamerholic-volt",
    label: "Gamerholic volt",
    url: "/art/profile-covers/gamerholic-volt.jpg",
  },
  { id: "arena", label: "Arena", url: ART.hero },
  { id: "headsUp", label: "Heads-up", url: ART.headsUp },
] as const;

export const PROFILE_COVER_SIZE = {
  width: 1600,
  height: 600,
  label: "1600 × 600",
} as const;

/**
 * Gamer-card style avatar presets (square crop).
 * Paths under /public — no remote CDN required.
 */
export const AVATAR_OPTIONS = [
  {
    id: "neon-fang",
    label: "Neon Fang",
    url: "/art/battle/neon-fang.jpg",
  },
  {
    id: "iron-chorus",
    label: "Iron Chorus",
    url: "/art/battle/iron-chorus.jpg",
  },
  {
    id: "heads-up",
    label: "Heads-up",
    url: "/art/chibi-heads-up.jpg",
  },
  {
    id: "arcade-crew",
    label: "Arcade crew",
    url: "/art/chibi-arcade-friends.jpg",
  },
  {
    id: "squad-win",
    label: "Squad win",
    url: "/art/chibi-team-win.jpg",
  },
  {
    id: "high-five",
    label: "High five",
    url: "/art/chibi-team-highfive.jpg",
  },
  {
    id: "gear",
    label: "Gear",
    url: "/art/gear-icp.jpg",
  },
  {
    id: "volt-card",
    label: "Volt card",
    url: "/art/profile-covers/gamerholic-volt.jpg",
  },
  {
    id: "prize-card",
    label: "Prize card",
    url: "/art/profile-covers/gamerholic-prize.jpg",
  },
  {
    id: "cyan-card",
    label: "Cyan card",
    url: "/art/profile-covers/gamer-cyan.jpg",
  },
  {
    id: "brand-mark",
    label: "Power G",
    url: "/brand/gamerholic-mark-128.jpg",
  },
] as const;

export const PROFILE_AVATAR_SIZE = {
  width: 512,
  height: 512,
  label: "512 × 512",
} as const;

export function isPresetAvatar(url: string | null | undefined): boolean {
  if (!url) return false;
  return AVATAR_OPTIONS.some((a) => a.url === url);
}

export const CONSOLES: ConsoleId[] = [
  "PC",
  "PS5",
  "Xbox",
  "Switch",
  "Multi",
];

/**
 * Popular platforms for challenges / host forms (dropdown labels).
 * Broader than profile ConsoleId — free-text stored as string on-chain.
 */
export const CHALLENGE_CONSOLES = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
  "Nintendo Switch 2",
  "Mobile",
  "Cross-play",
] as const;

export type ChallengeConsole = (typeof CHALLENGE_CONSOLES)[number];

/** Map profile ConsoleId → challenge dropdown value */
export function profileConsoleToChallenge(console?: string): ChallengeConsole {
  const c = (console || "PC").toLowerCase();
  if (c === "ps5" || c.includes("playstation 5")) return "PlayStation 5";
  if (c.includes("playstation 4") || c === "ps4") return "PlayStation 4";
  if (c === "xbox" || c.includes("series")) return "Xbox Series X|S";
  if (c.includes("xbox one")) return "Xbox One";
  if (c === "switch" || c.includes("nintendo switch 2")) {
    return c.includes("2") ? "Nintendo Switch 2" : "Nintendo Switch";
  }
  if (c.includes("mobile") || c === "ios" || c === "android") return "Mobile";
  if (c === "multi" || c.includes("cross")) return "Cross-play";
  if (c === "pc") return "PC";
  const hit = CHALLENGE_CONSOLES.find(
    (x) => x.toLowerCase() === (console || "").toLowerCase(),
  );
  return hit ?? "PC";
}

/** Empty shell for logged-out UI only — not a demo identity */
export const DEFAULT_PROFILE: GamerProfile = {
  username: "",
  gamertag: "",
  console: "PC",
  games: [],
  bio: "",
  dexstaXftId: "",
  dexstaXftContract: "",
  aftaPrincipal: "",
  betablePrincipal: "",
  betableUsername: "",
  betableAvatarUrl: "",
  avatarUrl: "",
  avatarIsGameAsset: false,
  coverUrl: COVER_OPTIONS[0].url,
  principal: "",
  level: 1,
  xpProgress: 0,
  acceptedOver18AndTerms: false,
  termsAcceptedAt: undefined,
  role: "user",
};

/** Shorten II principal for UI (cover, chips) — full value stays in data. */
export function shortPrincipal(principal: string, head = 5, tail = 4): string {
  const p = (principal || "").trim();
  if (!p) return "";
  if (p.length <= head + tail + 1) return p;
  return `${p.slice(0, head)}…${p.slice(-tail)}`;
}

export function emptyProfileForPrincipal(principal: string): GamerProfile {
  return {
    ...DEFAULT_PROFILE,
    principal,
    // Force user to set identity before challenges
    username: "",
    gamertag: "",
    coverUrl: COVER_OPTIONS[0].url,
  };
}

/** Max length for public @username (header chip + profile) */
export const USERNAME_MAX_LENGTH = 13;

/** Normalize + enforce username max length */
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/\s+/g, "").slice(0, USERNAME_MAX_LENGTH);
}

/** Auto shell used before first save — not a finished identity */
export function isPlaceholderIdentity(
  value: string,
  principal: string,
): boolean {
  const v = (value || "").trim();
  if (!v) return true;
  const p = (principal || "").trim();
  if (p && (v === p || v === shortPrincipal(p))) return true;
  return false;
}

export type ProfileMissingField =
  | "username"
  | "gamertag"
  | "game"
  | "console"
  | "avatar";

/**
 * Challenge send/accept requires a complete gamer card identity.
 */
export function getProfileCompleteness(p: GamerProfile | null | undefined): {
  ok: boolean;
  missing: ProfileMissingField[];
  message: string;
} {
  const missing: ProfileMissingField[] = [];
  if (!p) {
    return {
      ok: false,
      missing: ["username", "gamertag", "game", "console", "avatar"],
      message: "Complete your profile before challenges.",
    };
  }
  if (isPlaceholderIdentity(p.username, p.principal)) missing.push("username");
  else if ((p.username || "").trim().length > USERNAME_MAX_LENGTH) {
    missing.push("username");
  }
  if (isPlaceholderIdentity(p.gamertag, p.principal)) missing.push("gamertag");
  if (!p.games?.length) missing.push("game");
  if (!p.console) missing.push("console");
  if (!resolveProfileAvatarUrl(p)) missing.push("avatar");

  const labels: Record<ProfileMissingField, string> = {
    username: "username",
    gamertag: "gamertag",
    game: "at least one game",
    console: "console",
    avatar: "avatar",
  };
  let message =
    missing.length === 0
      ? ""
      : `Finish your profile first: add ${missing.map((m) => labels[m]).join(", ")}.`;
  if (
    p &&
    (p.username || "").trim().length > USERNAME_MAX_LENGTH &&
    !isPlaceholderIdentity(p.username, p.principal)
  ) {
    message = `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`;
  }

  return { ok: missing.length === 0, missing, message };
}

export function isProfileComplete(
  p: GamerProfile | null | undefined,
): boolean {
  return getProfileCompleteness(p).ok;
}

export type MatchResult = "W" | "L" | "D" | "void";

export type HeadsUpHistoryItem = {
  id: string;
  title: string;
  game: string;
  console?: string;
  opponent: string;
  opponentRecord?: string;
  result: MatchResult;
  stake: string;
  pot: string;
  at: string;
  role: "host" | "challenger";
  betable?: boolean;
  marketId?: string;
};

export type TournamentHistoryItem = {
  id: string;
  title: string;
  game: string;
  console?: string;
  placement: string;
  prize: string;
  entryFee?: string;
  players?: string;
  host?: string;
  at: string;
  role: "player" | "host";
  betable?: boolean;
  marketId?: string;
};

export type BetableHistoryItem = {
  id: string;
  marketTitle: string;
  game: string;
  console?: string;
  /** Linked event title for match card */
  eventTitle: string;
  kind: "tournament" | "challenge" | "room";
  side: string;
  odds?: string;
  stake: string;
  pnl: string;
  volume?: string;
  result: "won" | "lost" | "open" | "push";
  at: string;
  /** Optional participants for VS display */
  sideA?: string;
  sideB?: string;
};

export type MonitorHistoryItem = {
  id: string;
  title: string;
  game: string;
  duty: string;
  fee: string;
  status: "completed" | "disputed" | "pending";
  at: string;
};

export type EarningItem = {
  id: string;
  source: "host" | "arcade" | "monitor" | "betable" | "challenge";
  label: string;
  amount: string;
  at: string;
};

/** @deprecated Empty — history loads from canisters / Supabase */
export const DEMO_HEADSUP_HISTORY: HeadsUpHistoryItem[] = [];
export const DEMO_TOURNAMENT_HISTORY: TournamentHistoryItem[] = [];
export const DEMO_BETABLE_HISTORY: BetableHistoryItem[] = [];
export const DEMO_MONITOR_HISTORY: MonitorHistoryItem[] = [];
export const DEMO_EARNINGS: EarningItem[] = [];
export const DEMO_EARNINGS_SUMMARY = {
  host: "0 ICP",
  arcade: "0 ICP",
  monitor: "0 ICP",
  betable: "0 ICP",
  challenge: "0 ICP",
  total: "0 ICP",
};

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

/**
 * Resolve profile avatar URL.
 * Prefer stored avatarUrl (from selected media/game-asset XFT); fall back to
 * placeholder art hashed from dexstaXftId when no image was resolved.
 */
export function resolveProfileAvatarUrl(p: {
  avatarUrl?: string;
  dexstaXftId?: string;
}): string | undefined {
  if (p.avatarUrl?.trim()) return p.avatarUrl.trim();
  if (p.dexstaXftId?.trim()) return xftAvatarUrl(p.dexstaXftId);
  return undefined;
}

/** Placeholder art for Dexsta XFT avatars by id hash (offline / unresolved) */
export function xftAvatarUrl(xftId: string): string {
  if (!xftId.trim()) return "";
  const options = [
    ART.battle,
    ART.headsUp,
    ART.arcadeFriends,
    ART.teamWin,
    ART.gear,
  ];
  let h = 0;
  for (let i = 0; i < xftId.length; i++) h = (h + xftId.charCodeAt(i) * (i + 1)) % options.length;
  return options[h] ?? ART.battle;
}

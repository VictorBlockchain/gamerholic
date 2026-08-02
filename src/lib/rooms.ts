/**
 * Esports room domain types + helpers.
 * Data is loaded from canister (listRooms/getRoomInfo) via room-service — no DEMO catalog.
 */

export type RoomStatus = "open" | "live" | "closed";

export type RoomMember = {
  id: string;
  username: string;
  avatarUrl?: string;
  principal?: string;
  status: "online" | "away" | "offline";
  game?: string;
  games?: string[];
  record?: string;
  role?: "host" | "mod" | "member";
  roomWins?: number;
  roomLosses?: number;
  roomEarningsIcp?: number;
};

export type RoomGroupPot = {
  id: string;
  title: string;
  game: string;
  console: string;
  buyInIcp: number;
  potIcp: number;
  hostTakePct: number;
  status: "open" | "live" | "settled" | "cancelled";
  players: string;
  maxPlayers: number;
  /** Seated players (usernames / addresses) — no mock fill */
  participants?: string[];
  /** Game host who created the table (not necessarily room host) */
  creator?: string;
  startsAt: string;
  betable?: boolean;
  marketId?: string;
  winner?: string;
  /** Winner payout (e8s→ICP) after report score */
  payoutIcp?: number;
};

export type RoomLeaderboardRow = {
  rank: number;
  username: string;
  userId: string;
  wins: number;
  losses: number;
  earningsIcp: number;
  streak: number;
};

export type RoomMemberMarket = {
  id: string;
  title: string;
  kind: "tournament" | "challenge";
  memberUsername: string;
  game: string;
  volumeIcp?: number;
  status: "active" | "closed" | "resolved";
  eventId: string;
};

export type EsportsRoom = {
  id: string;
  name: string;
  topic: string;
  coverUrl: string;
  avatarUrl: string;
  game: string;
  games: string[];
  console?: string;
  status: RoomStatus;
  live: boolean;
  membersCount: number;
  maxMembers: number;
  host: {
    id: string;
    username: string;
    avatarUrl?: string;
    record: string;
    wins: number;
    losses: number;
    winStreak: number;
    bestWinStreak: number;
    earningsIcp: number;
    headsUpRecord: string;
    tournamentRecord: string;
  };
  creatorId: string;
  totalWinningsIcp: number;
  totalPotsSettled: number;
  createdAt: string;
  online: RoomMember[];
  activePots: RoomGroupPot[];
  pastPots: RoomGroupPot[];
  leaderboard: RoomLeaderboardRow[];
  memberMarkets: RoomMemberMarket[];
};

export function formatIcp(n: number): string {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} ICP`;
}

/** Wide banner presets for group pages (hero cover). */
export const GROUP_COVER_PRESETS = [
  {
    id: "host-booth",
    label: "Host booth",
    url: "/art/host-booth.jpg",
  },
  {
    id: "hero-arena",
    label: "Arena",
    url: "/art/hero-arena.jpg",
  },
  {
    id: "neon",
    label: "Neon",
    url: "/art/profile-covers/gamerholic-neon.jpg",
  },
  {
    id: "cyan",
    label: "Cyan",
    url: "/art/profile-covers/gamer-cyan.jpg",
  },
  {
    id: "prize",
    label: "Prize",
    url: "/art/profile-covers/gamerholic-prize.jpg",
  },
  {
    id: "violet",
    label: "Violet",
    url: "/art/profile-covers/gamer-violet.jpg",
  },
  {
    id: "volt",
    label: "Volt",
    url: "/art/profile-covers/gamerholic-volt.jpg",
  },
  {
    id: "arcade-neon",
    label: "Arcade neon",
    url: "/art/arcade-covers/neon-cabinet.jpg",
  },
  {
    id: "volt-arena",
    label: "Volt arena",
    url: "/art/arcade-covers/volt-arena.jpg",
  },
  {
    id: "cyan-live",
    label: "Cyan live",
    url: "/art/arcade-covers/cyan-live.jpg",
  },
  {
    id: "prize-crown",
    label: "Prize crown",
    url: "/art/arcade-covers/prize-crown.jpg",
  },
  {
    id: "xft-battle",
    label: "XFT battle",
    url: "/art/xft-battle.jpg",
  },
] as const;

/** Square group logo / profile image presets. */
export const GROUP_AVATAR_PRESETS = [
  {
    id: "brand",
    label: "Power G",
    url: "/brand/gamerholic-mark-128.jpg",
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
    id: "gear",
    label: "Gear",
    url: "/art/gear-icp.jpg",
  },
  {
    id: "cabinet",
    label: "Cabinet",
    url: "/art/arcade-cabinet.jpg",
  },
  {
    id: "volt-card",
    label: "Volt card",
    url: "/art/profile-covers/gamerholic-volt.jpg",
  },
] as const;

export const GROUP_COVER_DEFAULT = GROUP_COVER_PRESETS[0].url;
export const GROUP_AVATAR_DEFAULT = GROUP_AVATAR_PRESETS[0].url;

/**
 * Canister `imageUrl` is a single text field — pack cover + avatar when both set.
 * Format: `cover||avatar` (paths never contain `||`).
 */
export function encodeRoomImages(coverUrl: string, avatarUrl: string): string {
  const cover = (coverUrl || "").trim();
  const avatar = (avatarUrl || "").trim();
  if (!cover && !avatar) return "";
  if (!avatar || avatar === cover) return cover;
  if (!cover) return `||${avatar}`;
  return `${cover}||${avatar}`;
}

export function decodeRoomImages(imageUrl: string | null | undefined): {
  coverUrl: string;
  avatarUrl: string;
} {
  const raw = String(imageUrl || "").trim();
  if (!raw) return { coverUrl: "", avatarUrl: "" };
  // Legacy / accidental JSON
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw) as { cover?: string; avatar?: string; c?: string; a?: string };
      const cover = String(j.cover || j.c || "").trim();
      const avatar = String(j.avatar || j.a || cover).trim();
      return { coverUrl: cover, avatarUrl: avatar || cover };
    } catch {
      /* fall through */
    }
  }
  if (raw.includes("||")) {
    const [c, a] = raw.split("||");
    const cover = (c || "").trim();
    const avatar = (a || "").trim();
    return {
      coverUrl: cover || avatar,
      avatarUrl: avatar || cover,
    };
  }
  return { coverUrl: raw, avatarUrl: raw };
}

export function potStatusTone(
  s: RoomGroupPot["status"],
): "live" | "success" | "prize" | "muted" {
  if (s === "live") return "live";
  if (s === "open") return "prize";
  if (s === "settled") return "success";
  return "muted";
}

export function roomToChatRoomSummary(r: EsportsRoom) {
  return {
    id: r.id,
    name: r.name,
    topic: r.topic,
    members: r.membersCount,
    live: r.live,
    game: r.game,
  };
}

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
  startsAt: string;
  betable?: boolean;
  marketId?: string;
  winner?: string;
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

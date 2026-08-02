/**
 * Room service — canister SoT + Supabase mirror for discovery/Realtime.
 */

import type { Identity } from "@dfinity/agent";
import {
  createBackendActor,
  e8sToIcp,
  icpToE8s,
  isCanisterConfigured,
  unwrapOpt,
} from "./canisters";
import {
  decodeRoomImages,
  encodeRoomImages,
  type EsportsRoom,
  type RoomGroupPot,
  type RoomLeaderboardRow,
  type RoomMember,
} from "@/lib/rooms";
import { getSupabase } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";

export type RoomInfoCanister = {
  id: string;
  name: string;
  creator: string;
  description: string;
  gameTypes: string[];
  console: string;
  rules: string;
  imageUrl: string;
  members: string[];
  memberCount: bigint;
  createdAt: bigint;
  isActive: boolean;
};

export type RoomChallengeCanister = {
  id: string;
  roomId: string;
  creator: string;
  roomCreator: string;
  gameType: string;
  console: string;
  maxPlayers: bigint;
  entryFee: bigint;
  payToken: string;
  rules: string;
  participants: string[];
  participantCount: bigint;
  status: bigint;
  startedAt: bigint;
  completedAt: bigint;
  winner: string;
  prizePool: bigint;
  createdAt: bigint;
  payoutTxId: string;
  payoutAmount: bigint;
  platformFeeAmount: bigint;
  roomHostFeeAmount: bigint;
  treasuryAmount: bigint;
  payoutTimestamp: bigint;
};

function nsToIso(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  if (!Number.isFinite(ms) || ms <= 0) return new Date().toISOString();
  return new Date(ms).toISOString();
}

function potStatus(n: number): RoomGroupPot["status"] {
  // Align with challenge-ish nats where possible
  if (n === 2) return "live";
  if (n === 3 || n === 4) return "settled";
  if (n === 0 || n === 6) return "cancelled";
  return "open";
}

function mapRoomChallenge(c: RoomChallengeCanister): RoomGroupPot {
  const participants = (c.participants || []).map(String).filter(Boolean);
  const winner = String(c.winner || "").trim();
  return {
    id: c.id,
    title: `${c.gameType} table`,
    game: c.gameType,
    console: c.console || "PC",
    buyInIcp: e8sToIcp(c.entryFee),
    potIcp: e8sToIcp(c.prizePool),
    hostTakePct: 0,
    status: potStatus(Number(c.status)),
    players: `${Number(c.participantCount)}/${Number(c.maxPlayers)}`,
    maxPlayers: Number(c.maxPlayers),
    participants,
    creator: String(c.creator || "").trim() || undefined,
    startsAt: nsToIso(c.startedAt || c.createdAt),
    winner: winner || undefined,
    payoutIcp: e8sToIcp(c.payoutAmount || BigInt(0)),
  };
}

function mapMember(addr: string, creator: string): RoomMember {
  return {
    id: addr,
    username: addr,
    status: "offline",
    role: addr === creator ? "host" : "member",
  };
}

export function mapRoomInfoToEsports(
  r: RoomInfoCanister,
  extras?: {
    challenges?: RoomChallengeCanister[];
    leaderboard?: RoomLeaderboardRow[];
    presence?: Map<string, { status: string; game?: string }>;
    hostStats?: EsportsRoom["host"];
  },
): EsportsRoom {
  const games = r.gameTypes?.length ? r.gameTypes : ["Esports"];
  const challenges = extras?.challenges ?? [];
  const activePots = challenges
    .filter((c) => {
      const s = Number(c.status);
      return s === 1 || s === 2;
    })
    .map(mapRoomChallenge);
  const pastPots = challenges
    .filter((c) => {
      const s = Number(c.status);
      return s === 3 || s === 4 || s === 0 || s === 6;
    })
    .map(mapRoomChallenge);

  const presence = extras?.presence;
  /** Group members only — presence overlaid when known */
  const members: RoomMember[] = (r.members || []).map((m) => {
    const p = presence?.get(m);
    const base = mapMember(m, r.creator);
    return {
      ...base,
      status: (p?.status as RoomMember["status"]) || "offline",
      game: p?.game,
    };
  });
  // Online-first for roster UX
  members.sort((a, b) => {
    const rank = (s: RoomMember["status"]) =>
      s === "online" ? 0 : s === "away" ? 1 : 2;
    return rank(a.status) - rank(b.status) || a.username.localeCompare(b.username);
  });

  const hostMember = members.find((m) => m.role === "host");
  const host = extras?.hostStats ?? {
    id: r.creator,
    username: r.creator,
    record: "0–0",
    wins: 0,
    losses: 0,
    winStreak: 0,
    bestWinStreak: 0,
    earningsIcp: 0,
    headsUpRecord: "0–0",
    tournamentRecord: "0–0",
  };

  const totalWinnings = pastPots
    .filter((p) => p.status === "settled")
    .reduce((s, p) => s + p.potIcp, 0);

  /** Room-scoped board from settled tables (not global room leaderboard) */
  const leaderboard =
    extras?.leaderboard?.length
      ? extras.leaderboard
      : leaderboardFromRoomChallenges(challenges);

  const images = decodeRoomImages(r.imageUrl);

  return {
    id: r.id,
    name: r.name,
    topic: r.description || r.rules || "",
    coverUrl: images.coverUrl,
    avatarUrl: images.avatarUrl,
    game: games[0] || "Esports",
    games,
    console: r.console || undefined,
    status: r.isActive ? "open" : "closed",
    live: activePots.some((p) => p.status === "live"),
    membersCount: Number(r.memberCount) || (r.members?.length ?? 0),
    maxMembers: Math.max(64, Number(r.memberCount) + 16),
    host,
    creatorId: r.creator,
    totalWinningsIcp: totalWinnings,
    totalPotsSettled: pastPots.filter((p) => p.status === "settled").length,
    createdAt: nsToIso(r.createdAt),
    online: members.length ? members : hostMember ? [hostMember] : [],
    activePots,
    pastPots,
    leaderboard,
    memberMarkets: [],
  };
}

/** Build per-room wins / earnings from settled group games */
function leaderboardFromRoomChallenges(
  challenges: RoomChallengeCanister[],
): RoomLeaderboardRow[] {
  type Acc = {
    wins: number;
    losses: number;
    earningsIcp: number;
    games: number;
  };
  const map = new Map<string, Acc>();
  const bump = (player: string, patch: Partial<Acc>) => {
    const cur = map.get(player) ?? {
      wins: 0,
      losses: 0,
      earningsIcp: 0,
      games: 0,
    };
    map.set(player, {
      wins: cur.wins + (patch.wins ?? 0),
      losses: cur.losses + (patch.losses ?? 0),
      earningsIcp: cur.earningsIcp + (patch.earningsIcp ?? 0),
      games: cur.games + (patch.games ?? 0),
    });
  };
  for (const c of challenges) {
    const s = Number(c.status);
    // settled / completed
    if (s !== 3 && s !== 4) continue;
    const potIcp = e8sToIcp(c.prizePool || c.payoutAmount || BigInt(0));
    const winner = String(c.winner || "").trim();
    const parts = c.participants || [];
    for (const p of parts) {
      const name = String(p);
      if (!name) continue;
      if (winner && name === winner) {
        bump(name, { wins: 1, games: 1, earningsIcp: potIcp });
      } else {
        bump(name, { losses: 1, games: 1 });
      }
    }
    // Winner not in participants list (edge) still counts
    if (winner && !parts.map(String).includes(winner)) {
      bump(winner, { wins: 1, games: 1, earningsIcp: potIcp });
    }
  }
  return [...map.entries()]
    .map(([username, a]) => ({
      username,
      userId: username,
      wins: a.wins,
      losses: a.losses,
      earningsIcp: a.earningsIcp,
      streak: 0,
      rank: 0,
    }))
    .sort(
      (a, b) =>
        b.wins - a.wins ||
        b.earningsIcp - a.earningsIcp ||
        a.username.localeCompare(b.username),
    )
    .map((row, i) => ({ ...row, rank: i + 1 }))
    .slice(0, 40);
}

async function requireActor(identity?: Identity | null): Promise<any> {
  if (!isCanisterConfigured()) {
    throw new Error("Canister not configured");
  }
  const actor = await createBackendActor(identity);
  if (!actor) throw new Error("No actor");
  return actor as any;
}

export async function listRoomsFromCanister(
  identity?: Identity | null,
): Promise<EsportsRoom[]> {
  try {
    const actor = await requireActor(identity);
    const rows = (await actor.listRooms()) as RoomInfoCanister[];
    return (rows || []).map((r) => mapRoomInfoToEsports(r));
  } catch {
    return [];
  }
}

export async function loadRoom(
  id: string,
  identity?: Identity | null,
): Promise<EsportsRoom | null> {
  try {
    const actor = await requireActor(identity);
    const opt = (await actor.getRoomInfo(id)) as [] | [RoomInfoCanister];
    const info = unwrapOpt(opt);
    if (!info) return null;

    const [challenges, presenceMap, hostStats] = await Promise.all([
      (actor.getRoomChallenges(id) as Promise<RoomChallengeCanister[]>).catch(
        () => [] as RoomChallengeCanister[],
      ),
      loadPresenceMap(),
      loadHostStats(info.creator, identity),
    ]);

    // Leaderboard is derived from this room's challenges (group games only)
    const room = mapRoomInfoToEsports(info, {
      challenges,
      presence: presenceMap,
      hostStats: hostStats ?? undefined,
      leaderboard: leaderboardFromRoomChallenges(challenges),
    });

    // Member markets from linked tourneys/challenges of room members
    room.memberMarkets = await loadMemberMarkets(info.members || []);

    // Do not mirror on read — Realtime + detail reload would loop.
    return room;
  } catch {
    return null;
  }
}

async function loadHostStats(
  creator: string,
  identity?: Identity | null,
): Promise<EsportsRoom["host"] | null> {
  try {
    const actor = await requireActor(identity);
    const [gamerOpt, statsOpt, earnOpt] = await Promise.all([
      actor.getGamer(creator) as Promise<
        [] | [{ wallet: string; username: string; avatarUrl: string }]
      >,
      actor.getGamerStats(creator) as Promise<
        | []
        | [
            {
              wins: bigint;
              losses: bigint;
              currentWinStreak: bigint;
              longestWinStreak: bigint;
            },
          ]
      >,
      actor.getGamerEarnings(creator) as Promise<
        | []
        | [
            {
              totalHeadsUpEarnings: bigint;
              totalTournamentEarnings: bigint;
              tournamentWins: bigint;
              tournamentLosses: bigint;
            },
          ]
      >,
    ]);
    const g = unwrapOpt(gamerOpt);
    const s = unwrapOpt(statsOpt);
    const e = unwrapOpt(earnOpt);
    const wins = Number(s?.wins ?? 0);
    const losses = Number(s?.losses ?? 0);
    const tWins = Number(e?.tournamentWins ?? 0);
    const tLosses = Number(e?.tournamentLosses ?? 0);
    const huW = Math.max(0, wins - tWins);
    const huL = Math.max(0, losses - tLosses);
    const earn =
      e8sToIcp(e?.totalHeadsUpEarnings ?? BigInt(0)) +
      e8sToIcp(e?.totalTournamentEarnings ?? BigInt(0));
    return {
      id: creator,
      username: g?.username || creator,
      avatarUrl: g?.avatarUrl || undefined,
      record: `${wins}–${losses}`,
      wins,
      losses,
      winStreak: Number(s?.currentWinStreak ?? 0),
      bestWinStreak: Number(s?.longestWinStreak ?? 0),
      earningsIcp: earn,
      headsUpRecord: `${huW}–${huL}`,
      tournamentRecord: `${tWins}–${tLosses}`,
    };
  } catch {
    return null;
  }
}

async function loadPresenceMap(): Promise<
  Map<string, { status: string; game?: string }>
> {
  const map = new Map<string, { status: string; game?: string }>();
  const sb = getSupabase();
  if (!sb) return map;
  const cutoff = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data } = await sb
    .from(GH_TABLES.presence)
    .select("principal,username,status,game,updated_at")
    .gte("updated_at", cutoff);
  for (const row of data || []) {
    const key = String(row.principal || row.username || "");
    if (!key) continue;
    map.set(key, {
      status: String(row.status || "online"),
      game: row.game ? String(row.game) : undefined,
    });
    if (row.username) {
      map.set(String(row.username), {
        status: String(row.status || "online"),
        game: row.game ? String(row.game) : undefined,
      });
    }
  }
  return map;
}

async function loadMemberMarkets(members: string[]) {
  const sb = getSupabase();
  if (!sb || members.length === 0) return [];
  // Markets linked to challenges/tournaments; filter client-side by host in members set
  const { data: markets } = await sb
    .from(GH_TABLES.markets)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(40);
  if (!markets?.length) return [];
  const set = new Set(members.map((m) => m.toLowerCase()));
  // Also load tournament hosts
  const { data: tourneys } = await sb
    .from(GH_TABLES.tournaments)
    .select("id,host_username,market_id,title,game,status")
    .not("market_id", "is", null)
    .limit(40);
  const out: EsportsRoom["memberMarkets"] = [];
  for (const t of tourneys || []) {
    const host = String(t.host_username || "").toLowerCase();
    if (!set.has(host)) continue;
    if (!t.market_id) continue;
    out.push({
      id: String(t.market_id),
      title: String(t.title || "Tournament market"),
      kind: "tournament",
      memberUsername: String(t.host_username),
      game: String(t.game || ""),
      status:
        t.status === "live"
          ? "active"
          : t.status === "settled"
            ? "resolved"
            : "active",
      eventId: String(t.id),
    });
  }
  for (const m of markets || []) {
    if (out.some((x) => x.id === m.id)) continue;
    out.push({
      id: String(m.id),
      title: String(m.title || m.id),
      kind: m.kind === "tournament" ? "tournament" : "challenge",
      memberUsername: "—",
      game: String(m.game || ""),
      volumeIcp: m.volume_e8s != null ? Number(m.volume_e8s) / 1e8 : undefined,
      status:
        m.status === "resolved"
          ? "resolved"
          : m.status === "closed"
            ? "closed"
            : "active",
      eventId: String(m.challenge_id || m.tournament_id || m.id),
    });
  }
  return out.slice(0, 24);
}

export async function createRoomOnChain(
  input: {
    creator: string;
    name: string;
    description: string;
    gameTypes: string[];
    console: string;
    rules?: string;
    imageUrl?: string;
    coverUrl?: string;
    avatarUrl?: string;
  },
  identity?: Identity | null,
): Promise<string> {
  const actor = await requireActor(identity);
  const packed =
    input.coverUrl != null || input.avatarUrl != null
      ? encodeRoomImages(input.coverUrl ?? "", input.avatarUrl ?? "")
      : input.imageUrl ?? "";
  const id = (await actor.createRoom(
    input.creator,
    input.name,
    input.description,
    input.gameTypes,
    input.console,
    input.rules ?? "",
    packed,
  )) as string;
  const room = await loadRoom(id, identity);
  if (room) await mirrorRoom(room);
  return id;
}

/**
 * Create a group game (table / free-for-all) inside an existing room community.
 * Max seats + entry fee apply here — not on room create.
 */
export async function createRoomGameOnChain(
  input: {
    creator: string;
    roomId: string;
    gameType: string;
    console: string;
    maxPlayers: number;
    entryFeeIcp: number;
    rules?: string;
  },
  identity?: Identity | null,
): Promise<string> {
  const actor = await requireActor(identity);
  const seats = Math.min(8, Math.max(2, Math.floor(input.maxPlayers) || 2));
  const id = (await actor.createRoomChallenge(
    input.creator,
    input.roomId,
    input.gameType,
    input.console || "PC",
    BigInt(seats),
    icpToE8s(input.entryFeeIcp),
    input.rules ?? "",
  )) as string;
  if (String(id).startsWith("Error:")) {
    throw new Error(String(id));
  }
  await loadRoom(input.roomId, identity);
  return id;
}

export async function updateRoomOnChain(
  roomId: string,
  who: string,
  patch: {
    name: string;
    description: string;
    gameTypes: string[];
    console: string;
    rules?: string;
    imageUrl?: string;
    coverUrl?: string;
    avatarUrl?: string;
  },
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  const packed =
    patch.coverUrl != null || patch.avatarUrl != null
      ? encodeRoomImages(patch.coverUrl ?? "", patch.avatarUrl ?? "")
      : patch.imageUrl ?? "";
  const ok = (await actor.updateRoom(
    roomId,
    who,
    patch.name,
    patch.description,
    patch.gameTypes,
    patch.console,
    patch.rules ?? "",
    packed,
  )) as boolean;
  if (ok) await loadRoom(roomId, identity);
  return ok;
}

export async function joinRoomOnChain(
  roomId: string,
  user: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  return (await actor.joinRoom(roomId, user)) as boolean;
}

/** Leave a community group (room host / creator cannot leave). */
export async function leaveRoomOnChain(
  roomId: string,
  user: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  return (await actor.leaveRoom(roomId, user)) as boolean;
}

/** Sit at an open group game table inside a room. Debits buy-in to room escrow. */
export async function joinRoomGameOnChain(
  user: string,
  challengeId: string,
  identity?: Identity | null,
  opts?: { roomId?: string; entryFeeIcp?: number },
): Promise<boolean> {
  const actor = await requireActor(identity);
  const fee = opts?.entryFeeIcp ?? 0;
  const roomId = opts?.roomId;
  if (fee > 0 && roomId) {
    const { debitRoomGameEntry } = await import("./settlement-service");
    const funded = await debitRoomGameEntry(
      roomId,
      challengeId,
      fee,
      identity,
    );
    if (!funded) {
      throw new Error(
        "ICP debit failed — deposit buy-in to your play subaccount first",
      );
    }
  }
  return (await actor.joinRoomChallenge(user, challengeId)) as boolean;
}

/** Game host starts the FFA once every seat is filled. */
export async function startRoomGameOnChain(
  gameHost: string,
  challengeId: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  return (await actor.startRoomChallenge(gameHost, challengeId)) as boolean;
}

/**
 * Game host reports the single FFA winner (no dispute flow).
 * Settles the table on-chain (status → settled).
 * Does not transfer ICP — claimRoomGamePrize does native distribute.
 */
export async function reportRoomGameWinnerOnChain(
  reporter: string,
  challengeId: string,
  winner: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  return (await actor.recordRoomChallengeWinner(
    reporter,
    challengeId,
    winner,
  )) as boolean;
}

/**
 * After report score: pay winner + room host (+ optional mod) play subaccounts,
 * platform wallet, community vault from room escrow.
 */
export async function claimRoomGamePrize(opts: {
  roomId: string;
  challengeId: string;
  winnerPrincipal: string;
  /** Room host principal (play sub receives host cut) */
  hostPrincipal: string;
  moderatorPrincipal?: string | null;
  identity?: Identity | null;
}): Promise<{ ok: boolean; err: string }> {
  const { distributeRoomGamePrize } = await import("./settlement-service");
  const r = await distributeRoomGamePrize({
    roomId: opts.roomId,
    challengeId: opts.challengeId,
    winnerPrincipal: opts.winnerPrincipal,
    hostPrincipal: opts.hostPrincipal,
    moderatorPrincipal: opts.moderatorPrincipal,
    identity: opts.identity,
  });
  return { ok: r.ok, err: r.err };
}

/** True if `who` is a room member (username or principal match). */
export function isRoomMember(room: EsportsRoom, who: string): boolean {
  if (!who) return false;
  const q = who.toLowerCase();
  if (room.creatorId?.toLowerCase() === q) return true;
  if (room.host?.username?.toLowerCase() === q) return true;
  if (room.host?.id?.toLowerCase() === q) return true;
  return room.online.some(
    (m) =>
      m.username.toLowerCase() === q ||
      m.id.toLowerCase() === q ||
      (m.principal && m.principal.toLowerCase() === q),
  );
}

export async function mirrorRoom(room: EsportsRoom): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.rpc("upsert_gh_room_mirror", {
    p: {
      id: room.id,
      name: room.name,
      description: room.topic,
      creator: room.creatorId,
      game: room.game,
      games: room.games,
      console: room.console ?? null,
      image_url: room.avatarUrl || room.coverUrl || null,
      cover_url: room.coverUrl || null,
      member_count: room.membersCount,
      members: room.online.map((m) => m.username),
      is_active: room.status !== "closed",
      total_winnings_e8s: Math.round(room.totalWinningsIcp * 1e8),
      metadata: {},
    },
  });
  if (error) {
    // Fallback direct upsert if RPC missing
    await sb.from(GH_TABLES.rooms).upsert(
      {
        id: room.id,
        name: room.name,
        description: room.topic,
        creator: room.creatorId,
        game: room.game,
        games: room.games,
        console: room.console ?? null,
        image_url: room.avatarUrl || null,
        cover_url: room.coverUrl || null,
        member_count: room.membersCount,
        members: room.online.map((m) => m.username),
        is_active: room.status !== "closed",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    return false;
  }
  return true;
}

export async function listRoomsFromMirror(): Promise<EsportsRoom[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from(GH_TABLES.rooms)
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (!data?.length) return [];
  return data.map((row) =>
    mapRoomInfoToEsports({
      id: String(row.id),
      name: String(row.name || row.id),
      creator: String(row.creator || ""),
      description: String(row.description || ""),
      gameTypes: Array.isArray(row.games) ? row.games : [String(row.game || "Esports")],
      console: String(row.console || "PC"),
      rules: "",
      imageUrl: String(row.cover_url || row.image_url || ""),
      members: Array.isArray(row.members) ? row.members.map(String) : [],
      memberCount: BigInt(row.member_count ?? 0),
      createdAt: BigInt(0),
      isActive: Boolean(row.is_active),
    }),
  );
}

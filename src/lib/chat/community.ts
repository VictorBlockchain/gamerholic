/**
 * Community chatrooms — global lounge + game channels + user-created rooms.
 * Supabase `gh_community_rooms` when configured; local fallback otherwise.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";
import { FALLBACK_GAMES } from "@/lib/chat/demo-data";

export type CommunityRoomKind =
  | "global"
  | "game"
  | "lfg"
  | "watch"
  | "community";

export type CommunityRoom = {
  id: string;
  name: string;
  slug: string;
  topic: string;
  kind: CommunityRoomKind;
  game?: string;
  creator?: string;
  memberCount: number;
  createdAt: string;
};

export const GLOBAL_ROOM_ID = "global";
export const GLOBAL_THREAD_ID = "community:global";

export function communityThreadId(roomId: string): string {
  return `community:${roomId}`;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function seedRooms(): CommunityRoom[] {
  const now = new Date().toISOString();
  const global: CommunityRoom = {
    id: GLOBAL_ROOM_ID,
    name: "Gamerholic Lounge",
    slug: "global",
    topic: "Global community chat — everyone welcome",
    kind: "global",
    memberCount: 0,
    createdAt: now,
  };
  const lfg: CommunityRoom = {
    id: "lfg",
    name: "LFG / Looking for group",
    slug: "lfg",
    topic: "Find duo, squad, or team — post your rank & mic status",
    kind: "lfg",
    memberCount: 0,
    createdAt: now,
  };
  const watch: CommunityRoom = {
    id: "watch",
    name: "Watch party",
    slug: "watch",
    topic: "Live brackets, streams, and spoilers (use spoiler tags!)",
    kind: "watch",
    memberCount: 0,
    createdAt: now,
  };
  const games: CommunityRoom[] = FALLBACK_GAMES.slice(0, 8).map((g) => {
    const slug = slugify(g);
    return {
      id: `game-${slug}`,
      name: g,
      slug: `game-${slug}`,
      topic: `${g} general · strats · challenges`,
      kind: "game" as const,
      game: g,
      memberCount: 0,
      createdAt: now,
    };
  });
  return [global, lfg, watch, ...games];
}

let localRooms: CommunityRoom[] | null = null;

function getLocalRooms(): CommunityRoom[] {
  if (!localRooms) localRooms = seedRooms();
  return localRooms;
}

function rowToRoom(row: Record<string, unknown>): CommunityRoom {
  const kind = String(row.kind || "community") as CommunityRoomKind;
  return {
    id: String(row.id),
    name: String(row.name || row.id),
    slug: String(row.slug || row.id),
    topic: String(row.topic || ""),
    kind: ["global", "game", "lfg", "watch", "community"].includes(kind)
      ? kind
      : "community",
    game: row.game ? String(row.game) : undefined,
    creator: row.creator ? String(row.creator) : undefined,
    memberCount: Number(row.member_count ?? 0),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

/** List community rooms (seed + user-created). */
export async function listCommunityRooms(): Promise<CommunityRoom[]> {
  if (!isSupabaseConfigured()) {
    return getLocalRooms();
  }
  const sb = getSupabase();
  if (!sb) return getLocalRooms();

  try {
    const { data, error } = await sb
      .from(GH_TABLES.communityRooms)
      .select("*")
      .order("kind", { ascending: true })
      .order("name", { ascending: true });
    if (error || !data?.length) {
      // Table missing or empty — seed client-side + try RPC seed later
      return getLocalRooms();
    }
    const rows = (data as Record<string, unknown>[]).map(rowToRoom);
    // Ensure global always present
    if (!rows.some((r) => r.id === GLOBAL_ROOM_ID)) {
      return [getLocalRooms()[0], ...rows];
    }
    return rows;
  } catch {
    return getLocalRooms();
  }
}

export async function createCommunityRoom(input: {
  name: string;
  topic?: string;
  game?: string;
  kind?: CommunityRoomKind;
  creator: string;
}): Promise<{ ok: true; room: CommunityRoom } | { ok: false; error: string }> {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 3) {
    return { ok: false, error: "Name must be at least 3 characters" };
  }
  if (name.length > 40) {
    return { ok: false, error: "Name must be 40 characters or fewer" };
  }
  const slug = slugify(name);
  if (!slug) return { ok: false, error: "Invalid name" };

  const room: CommunityRoom = {
    id: `comm-${slug}-${Date.now().toString(36).slice(-4)}`,
    name,
    slug,
    topic: (input.topic || "").trim().slice(0, 160) || `${name} community chat`,
    kind: input.kind || (input.game ? "game" : "community"),
    game: input.game?.trim() || undefined,
    creator: input.creator,
    memberCount: 1,
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    const list = getLocalRooms();
    if (list.some((r) => r.slug === slug || r.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: "That chatroom name is already taken" };
    }
    list.push(room);
    return { ok: true, room };
  }

  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Chat backend unavailable" };

  const payload = {
    id: room.id,
    name: room.name,
    slug: room.slug,
    topic: room.topic,
    kind: room.kind,
    game: room.game || null,
    creator: room.creator,
    member_count: 1,
  };

  const { data, error } = await sb.rpc("upsert_gh_community_room", {
    p: payload,
  });
  if (error) {
    // unique violation
    if (
      error.message?.toLowerCase().includes("unique") ||
      error.message?.toLowerCase().includes("duplicate") ||
      error.code === "23505"
    ) {
      return { ok: false, error: "That chatroom name is already taken" };
    }
    // Fallback table insert
    const { error: insErr } = await sb.from(GH_TABLES.communityRooms).insert(payload);
    if (insErr) {
      if (
        insErr.message?.toLowerCase().includes("unique") ||
        insErr.code === "23505"
      ) {
        return { ok: false, error: "That chatroom name is already taken" };
      }
      console.warn("[community] create", error.message, insErr.message);
      return {
        ok: false,
        error:
          "Could not create room — apply community SQL migration if missing",
      };
    }
    return { ok: true, room };
  }

  const row = data as { ok?: boolean; error?: string; id?: string } | null;
  if (row && row.ok === false) {
    return { ok: false, error: String(row.error || "Create failed") };
  }
  return { ok: true, room };
}

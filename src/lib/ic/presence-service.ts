/**
 * Presence heartbeat → Supabase `gh_presence` for online list + room overlays.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";
import type { ChatUser } from "@/lib/chat/types";

const HEARTBEAT_MS = 45_000;
const ONLINE_WINDOW_MS = 5 * 60_000;

export async function heartbeatPresence(input: {
  principal: string;
  username: string;
  status?: "online" | "away" | "offline";
  game?: string;
}): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from(GH_TABLES.presence).upsert(
    {
      principal: input.principal,
      username: input.username,
      status: input.status ?? "online",
      game: input.game ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "principal" },
  );
  if (error) {
    console.warn("[presence] heartbeat", error.message);
    return false;
  }
  return true;
}

export async function listOnlineUsers(limit = 40): Promise<ChatUser[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const { data, error } = await sb
    .from(GH_TABLES.presence)
    .select("principal,username,status,game,updated_at")
    .gte("updated_at", cutoff)
    .neq("status", "offline")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.principal || row.username),
    username: String(row.username || row.principal || "player"),
    status: (row.status === "away" ? "away" : "online") as ChatUser["status"],
    game: row.game ? String(row.game) : undefined,
    principal: row.principal ? String(row.principal) : undefined,
  }));
}

/** Start interval heartbeat; returns cleanup. */
export function startPresenceHeartbeat(
  getUser: () => {
    principal: string;
    username: string;
    game?: string;
  } | null,
): () => void {
  if (!isSupabaseConfigured()) return () => undefined;
  let timer: ReturnType<typeof setInterval> | null = null;
  const tick = () => {
    const u = getUser();
    if (!u?.principal) return;
    void heartbeatPresence({
      principal: u.principal,
      username: u.username,
      game: u.game,
      status: "online",
    });
  };
  tick();
  timer = setInterval(tick, HEARTBEAT_MS);
  return () => {
    if (timer) clearInterval(timer);
  };
}

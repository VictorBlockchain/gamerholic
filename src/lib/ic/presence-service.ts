/**
 * Presence heartbeat → Supabase `gh_presence` for online list + room overlays.
 *
 * Direct table upsert is blocked by RLS (select-only). Heartbeats use
 * security-definer RPC `upsert_gh_presence`.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";
import type { ChatUser } from "@/lib/chat/types";

const HEARTBEAT_MS = 30_000;
/** Consider online if heartbeated within this window */
const ONLINE_WINDOW_MS = 3 * 60_000;

export async function heartbeatPresence(input: {
  principal: string;
  username: string;
  status?: "online" | "away" | "offline";
  game?: string;
}): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const payload = {
    principal: input.principal,
    username: input.username,
    status: input.status ?? "online",
    game: input.game ?? null,
  };

  // Prefer RPC (bypasses RLS) — required on production Supabase
  const { data, error } = await sb.rpc("upsert_gh_presence", { p: payload });
  if (!error) {
    const row = data as { ok?: boolean } | null;
    return row?.ok !== false;
  }

  // Fallback table upsert (works only if RLS allows write)
  const { error: upErr } = await sb.from(GH_TABLES.presence).upsert(
    {
      ...payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "principal" },
  );
  if (upErr) {
    console.warn(
      "[presence] heartbeat failed — apply supabase/migrations/fix_presence_upsert_rpc.sql",
      error.message,
      upErr.message,
    );
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
  if (error) {
    console.warn("[presence] listOnlineUsers", error.message);
    return [];
  }
  if (!data?.length) return [];

  // Enrich with profile games / avatars when available
  const principals = data
    .map((r) => String(r.principal || ""))
    .filter(Boolean);
  let profileByPrincipal = new Map<
    string,
    { avatar_url?: string | null; games?: string[] | null; username?: string | null }
  >();
  if (principals.length) {
    const { data: profiles } = await sb
      .from(GH_TABLES.profiles)
      .select("principal,username,avatar_url,games")
      .in("principal", principals);
    if (profiles) {
      profileByPrincipal = new Map(
        profiles.map((p) => [
          String(p.principal),
          {
            avatar_url: p.avatar_url as string | null | undefined,
            games: p.games as string[] | null | undefined,
            username: p.username as string | null | undefined,
          },
        ]),
      );
    }
  }

  return data.map((row) => {
    const principal = row.principal ? String(row.principal) : undefined;
    const prof = principal ? profileByPrincipal.get(principal) : undefined;
    const games = Array.isArray(prof?.games)
      ? prof!.games!.map(String).filter(Boolean)
      : undefined;
    return {
      id: String(principal || row.username),
      username: String(
        row.username || prof?.username || principal || "player",
      ),
      status: (row.status === "away" ? "away" : "online") as ChatUser["status"],
      game: row.game ? String(row.game) : games?.[0],
      games,
      avatarUrl: prof?.avatar_url ? String(prof.avatar_url) : undefined,
      principal,
    } satisfies ChatUser;
  });
}

/**
 * Start interval heartbeat while the user is signed in.
 * Marks offline once on cleanup (best-effort).
 */
export function startPresenceHeartbeat(
  getUser: () => {
    principal: string;
    username: string;
    game?: string;
  } | null,
): () => void {
  if (!isSupabaseConfigured()) return () => undefined;
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastPrincipal: string | null = null;
  let lastUsername: string | null = null;

  const tick = () => {
    const u = getUser();
    if (!u?.principal) return;
    lastPrincipal = u.principal;
    lastUsername = u.username;
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
    if (lastPrincipal) {
      void heartbeatPresence({
        principal: lastPrincipal,
        username: lastUsername || lastPrincipal,
        status: "offline",
      });
    }
  };
}

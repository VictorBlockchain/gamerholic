/**
 * Gamer profile read/write via Supabase `gh_profiles` (keyed by II principal).
 * Production source of truth for username/cover/avatar — not localStorage.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";
import {
  COVER_OPTIONS,
  emptyProfileForPrincipal,
  type ConsoleId,
  type GamerProfile,
} from "@/lib/profile";

type GhProfileRow = {
  principal: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  console: string | null;
  games: string[] | null;
  metadata: Record<string, unknown> | null;
  updated_at?: string;
};

function metaStr(m: Record<string, unknown> | null | undefined, key: string): string {
  const v = m?.[key];
  return typeof v === "string" ? v : "";
}

function metaBool(m: Record<string, unknown> | null | undefined, key: string): boolean {
  return Boolean(m?.[key]);
}

function metaNum(m: Record<string, unknown> | null | undefined, key: string, fallback: number): number {
  const v = m?.[key];
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function rowToGamerProfile(row: GhProfileRow): GamerProfile {
  const meta = row.metadata || {};
  const principal = String(row.principal || "");
  const base = emptyProfileForPrincipal(principal);
  const consoleRaw = String(row.console || meta.console || "PC");
  const consoleOk = (["PC", "PS5", "Xbox", "Switch", "Multi"] as ConsoleId[]).includes(
    consoleRaw as ConsoleId,
  )
    ? (consoleRaw as ConsoleId)
    : "PC";

  return {
    ...base,
    principal,
    username: String(row.username || base.username || ""),
    gamertag: metaStr(meta, "gamertag") || String(row.username || base.gamertag || ""),
    console: consoleOk,
    games: Array.isArray(row.games) ? row.games.map(String) : [],
    bio: String(row.bio || ""),
    avatarUrl: String(row.avatar_url || metaStr(meta, "avatarUrl") || ""),
    coverUrl:
      metaStr(meta, "coverUrl") || COVER_OPTIONS[0]?.url || base.coverUrl,
    dexstaXftId: metaStr(meta, "dexstaXftId"),
    dexstaXftContract: metaStr(meta, "dexstaXftContract"),
    avatarIsGameAsset: metaBool(meta, "avatarIsGameAsset"),
    level: Math.max(1, Math.floor(metaNum(meta, "level", 1))),
    xpProgress: Math.min(100, Math.max(0, metaNum(meta, "xpProgress", 0))),
  };
}

/**
 * Load profile for principal. Returns empty shell if missing (first login).
 */
export async function fetchProfileByPrincipal(
  principal: string,
): Promise<GamerProfile> {
  if (!principal || principal === "2vxsx-fae") {
    return emptyProfileForPrincipal(principal || "");
  }
  if (!isSupabaseConfigured()) {
    return emptyProfileForPrincipal(principal);
  }
  const sb = getSupabase();
  if (!sb) return emptyProfileForPrincipal(principal);

  const { data, error } = await sb
    .from(GH_TABLES.profiles)
    .select("*")
    .eq("principal", principal)
    .maybeSingle();

  if (error) {
    console.warn("[profile] fetch", error.message);
    return emptyProfileForPrincipal(principal);
  }
  if (!data) return emptyProfileForPrincipal(principal);
  return rowToGamerProfile(data as GhProfileRow);
}

/**
 * Upsert profile to Supabase (SECURITY DEFINER RPC when available, else table upsert).
 */
export async function saveProfileToSupabase(
  profile: GamerProfile,
): Promise<{ ok: boolean; error?: string }> {
  if (!profile.principal || profile.principal === "2vxsx-fae") {
    return { ok: false, error: "Invalid principal" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase not configured" };
  }
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase client unavailable" };

  const payload = {
    principal: profile.principal,
    username: profile.username || null,
    avatar_url: profile.avatarUrl || null,
    bio: profile.bio || null,
    console: profile.console || null,
    games: profile.games || [],
    metadata: {
      gamertag: profile.gamertag,
      coverUrl: profile.coverUrl,
      dexstaXftId: profile.dexstaXftId,
      dexstaXftContract: profile.dexstaXftContract,
      avatarIsGameAsset: profile.avatarIsGameAsset,
      level: profile.level,
      xpProgress: profile.xpProgress,
    },
    updated_at: new Date().toISOString(),
  };

  // Prefer RPC (works with RLS for anon publish path)
  const { error: rpcErr } = await sb.rpc("upsert_gh_profile", { p: payload });
  if (!rpcErr) return { ok: true };

  const { error } = await sb.from(GH_TABLES.profiles).upsert(payload, {
    onConflict: "principal",
  });
  if (error) {
    console.warn("[profile] save", rpcErr?.message, error.message);
    return { ok: false, error: error.message || rpcErr?.message };
  }
  return { ok: true };
}

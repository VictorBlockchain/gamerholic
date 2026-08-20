/**
 * Gamer profile read/write via Supabase `gh_profiles` (keyed by II principal).
 * Production source of truth for username/cover/avatar — not localStorage.
 * Platform roles (admin / moderator) live on `gh_profiles.role`.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";
import {
  COVER_OPTIONS,
  emptyProfileForPrincipal,
  parsePlatformRole,
  type ConsoleId,
  type GamerProfile,
  type PlatformRole,
} from "@/lib/profile";

type GhProfileRow = {
  principal: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  console: string | null;
  games: string[] | null;
  metadata: Record<string, unknown> | null;
  role?: string | null;
  updated_at?: string;
};

export type PlatformProfileRoleRow = {
  principal: string;
  username: string;
  role: PlatformRole;
  avatarUrl: string;
  updatedAt: string;
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
    aftaPrincipal: metaStr(meta, "aftaPrincipal"),
    betablePrincipal: metaStr(meta, "betablePrincipal"),
    betableUsername: metaStr(meta, "betableUsername"),
    betableAvatarUrl: metaStr(meta, "betableAvatarUrl"),
    avatarIsGameAsset: metaBool(meta, "avatarIsGameAsset"),
    level: Math.max(1, Math.floor(metaNum(meta, "level", 1))),
    xpProgress: Math.min(100, Math.max(0, metaNum(meta, "xpProgress", 0))),
    acceptedOver18AndTerms: metaBool(meta, "acceptedOver18AndTerms"),
    termsAcceptedAt: metaStr(meta, "termsAcceptedAt") || undefined,
    role: parsePlatformRole(row.role),
  };
}

/**
 * Resolve avatar URLs for usernames (challenge cards / VS seats).
 * Keys are lowercase usernames → avatar_url.
 */
export async function fetchAvatarMapByUsernames(
  usernames: string[],
): Promise<Record<string, string>> {
  const names = [
    ...new Set(
      usernames
        .map((u) => u.trim())
        .filter((u) => u.length > 0),
    ),
  ];
  if (!names.length || !isSupabaseConfigured()) return {};
  const sb = getSupabase();
  if (!sb) return {};
  try {
    const { data, error } = await sb
      .from(GH_TABLES.profiles)
      .select("username, avatar_url")
      .in("username", names);
    if (error || !data) return {};
    const out: Record<string, string> = {};
    for (const row of data as { username?: string; avatar_url?: string }[]) {
      const u = String(row.username || "").trim();
      const a = String(row.avatar_url || "").trim();
      if (u && a) out[u.toLowerCase()] = a;
    }
    // Case-insensitive fill for query variants
    for (const n of names) {
      const hit = out[n.toLowerCase()];
      if (hit) out[n.toLowerCase()] = hit;
    }
    return out;
  } catch {
    return {};
  }
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

  // Never send `role` — clients cannot self-elevate (RPC strips it too).
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
      aftaPrincipal: profile.aftaPrincipal || "",
      betablePrincipal: profile.betablePrincipal || "",
      betableUsername: profile.betableUsername || "",
      betableAvatarUrl: profile.betableAvatarUrl || "",
      avatarIsGameAsset: profile.avatarIsGameAsset,
      level: profile.level,
      xpProgress: profile.xpProgress,
      acceptedOver18AndTerms: Boolean(profile.acceptedOver18AndTerms),
      termsAcceptedAt: profile.termsAcceptedAt || null,
    },
    updated_at: new Date().toISOString(),
  };

  // Prefer RPC (SECURITY DEFINER — works with RLS; table has select-only policy)
  try {
    const { data, error: rpcErr } = await sb.rpc("upsert_gh_profile", {
      p: payload,
    });
    if (!rpcErr) {
      const body = (data || {}) as { ok?: boolean; error?: string };
      // RPC may return HTTP 200 with { ok: false, error: "…" }
      if (body && body.ok === false) {
        return {
          ok: false,
          error: body.error || "upsert_gh_profile rejected",
        };
      }
      return { ok: true };
    }

    // Direct table upsert usually fails under RLS (no insert policy) — try anyway
    const { error } = await sb.from(GH_TABLES.profiles).upsert(payload, {
      onConflict: "principal",
    });
    if (error) {
      console.warn("[profile] save", rpcErr.message, error.message);
      const msg = error.message || rpcErr.message;
      // Username unique violation
      if (/unique|duplicate|gh_profiles_username/i.test(msg)) {
        return {
          ok: false,
          error: "That username is already taken. Pick another.",
        };
      }
      return {
        ok: false,
        error:
          msg ||
          "Profile save failed (is upsert_gh_profile installed on Supabase?)",
      };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[profile] save exception", msg);
    return { ok: false, error: msg };
  }
}

/**
 * List profiles for role management UI.
 * Prefers list_gh_profiles_for_roles RPC; falls back to table select.
 */
export async function listProfilesForRoles(
  limit = 100,
): Promise<PlatformProfileRoleRow[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data: rpcData, error: rpcErr } = await sb.rpc(
      "list_gh_profiles_for_roles",
      { p_limit: limit },
    );
    if (!rpcErr && Array.isArray(rpcData)) {
      return (rpcData as {
        principal?: string;
        username?: string | null;
        role?: string | null;
        avatar_url?: string | null;
        updated_at?: string | null;
      }[]).map((r) => ({
        principal: String(r.principal || ""),
        username: String(r.username || ""),
        role: parsePlatformRole(r.role),
        avatarUrl: String(r.avatar_url || ""),
        updatedAt: String(r.updated_at || ""),
      }));
    }
  } catch {
    /* fall through */
  }

  const { data, error } = await sb
    .from(GH_TABLES.profiles)
    .select("principal, username, role, avatar_url, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error || !data) {
    console.warn("[profile] list roles", error?.message);
    return [];
  }
  return (data as GhProfileRow[]).map((r) => ({
    principal: String(r.principal || ""),
    username: String(r.username || ""),
    role: parsePlatformRole(r.role),
    avatarUrl: String(r.avatar_url || ""),
    updatedAt: String(r.updated_at || ""),
  }));
}

/**
 * Assign platform role (admin / moderator / user).
 * Caller must already be admin, or bootstrap (no admins + self → admin).
 */
export async function setPlatformRole(opts: {
  callerPrincipal: string;
  targetPrincipal: string;
  role: PlatformRole;
}): Promise<{ ok: boolean; error?: string; role?: PlatformRole }> {
  const caller = String(opts.callerPrincipal || "").trim();
  const target = String(opts.targetPrincipal || "").trim();
  const role = parsePlatformRole(opts.role);
  if (!caller || !target) {
    return { ok: false, error: "caller and target required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase not configured" };
  }
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase client unavailable" };

  const { data, error } = await sb.rpc("admin_set_gh_profile_role", {
    p_caller: caller,
    p_target: target,
    p_role: role,
  });

  if (error) {
    console.warn("[profile] set role", error.message);
    return { ok: false, error: error.message };
  }

  const body = (data || {}) as {
    ok?: boolean;
    error?: string;
    role?: string;
    hint?: string;
  };
  if (!body.ok) {
    return {
      ok: false,
      error: body.error || body.hint || "Role update failed",
    };
  }
  return { ok: true, role: parsePlatformRole(body.role || role) };
}

/** Resolve principal by exact username (case-sensitive match preferred). */
export async function findPrincipalByUsername(
  username: string,
): Promise<string | null> {
  const u = String(username || "").trim();
  if (!u || !isSupabaseConfigured()) return null;
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from(GH_TABLES.profiles)
    .select("principal, username")
    .ilike("username", u)
    .limit(5);
  if (error || !data?.length) return null;
  const exact = (data as { principal: string; username: string | null }[]).find(
    (r) => String(r.username || "").toLowerCase() === u.toLowerCase(),
  );
  return exact?.principal || (data[0] as { principal: string }).principal || null;
}

/**
 * Load public profile by username (or raw principal text).
 * Returns null when no row matches.
 */
export async function fetchProfileByUsername(
  usernameOrPrincipal: string,
): Promise<GamerProfile | null> {
  const raw = String(usernameOrPrincipal || "").trim();
  if (!raw) return null;
  // Principal-shaped ids (contain dashes, long)
  if (raw.includes("-") && raw.length > 20) {
    return fetchProfileByPrincipal(raw);
  }
  const principal = await findPrincipalByUsername(raw);
  if (!principal) return null;
  return fetchProfileByPrincipal(principal);
}

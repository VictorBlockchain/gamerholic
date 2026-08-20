/**
 * Arcade cabinet comments (testing/live · bug/feedback) + 5★ ratings + testers.
 * Prefers Supabase; falls back to localStorage when SB is offline.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  ArcadeComment,
  ArcadeCommentChannel,
  ArcadeCommentKind,
  ArcadeRating,
  ArcadeRatingSummary,
  ArcadeTester,
} from "./types";

const COMMENTS_KEY = "gh_arcade_comments_v1";
const RATINGS_KEY = "gh_arcade_ratings_v1";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function readLocalComments(): ArcadeComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArcadeComment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalComments(rows: ArcadeComment[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(rows.slice(-500)));
  } catch {
    /* quota */
  }
}

function readLocalRatings(): ArcadeRating[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RATINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArcadeRating[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalRatings(rows: ArcadeRating[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATINGS_KEY, JSON.stringify(rows.slice(-500)));
  } catch {
    /* */
  }
}

function rowToComment(row: Record<string, unknown>): ArcadeComment {
  const channel =
    row.channel === "live" || row.channel === "testing"
      ? row.channel
      : "testing";
  const kind =
    row.kind === "bug" || row.kind === "feedback" ? row.kind : "feedback";
  return {
    id: String(row.id),
    gameId: String(row.game_id ?? row.gameId ?? ""),
    channel,
    kind,
    body: String(row.body ?? ""),
    authorPrincipal: String(row.author_principal ?? row.authorPrincipal ?? ""),
    authorUsername: String(
      row.author_username ?? row.authorUsername ?? "player",
    ),
    resolved: Boolean(row.resolved),
    resolvedBy: row.resolved_by
      ? String(row.resolved_by)
      : row.resolvedBy
        ? String(row.resolvedBy)
        : undefined,
    resolvedAt: row.resolved_at
      ? String(row.resolved_at)
      : row.resolvedAt
        ? String(row.resolvedAt)
        : undefined,
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    updatedAt: row.updated_at
      ? String(row.updated_at)
      : row.updatedAt
        ? String(row.updatedAt)
        : undefined,
  };
}

function rowToRating(row: Record<string, unknown>): ArcadeRating {
  return {
    id: String(row.id),
    gameId: String(row.game_id ?? row.gameId ?? ""),
    principal: String(row.principal ?? ""),
    username: String(row.username ?? "player"),
    stars: Math.min(5, Math.max(1, Math.floor(Number(row.stars) || 1))),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export async function listArcadeComments(
  gameId: string,
  channel?: ArcadeCommentChannel,
): Promise<ArcadeComment[]> {
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase()!;
      let q = sb
        .from("gh_arcade_comments")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (channel) q = q.eq("channel", channel);
      const { data, error } = await q;
      if (!error && Array.isArray(data)) {
        return (data as Record<string, unknown>[]).map(rowToComment);
      }
    } catch (e) {
      console.warn("[arcade] listArcadeComments", e);
    }
  }
  return readLocalComments()
    .filter(
      (c) => c.gameId === gameId && (!channel || c.channel === channel),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addArcadeComment(input: {
  gameId: string;
  channel: ArcadeCommentChannel;
  kind: ArcadeCommentKind;
  body: string;
  principal: string;
  username: string;
}): Promise<{ ok: boolean; error?: string; comment?: ArcadeComment }> {
  const body = input.body.trim();
  if (body.length < 2) return { ok: false, error: "Write a short note first" };
  if (!input.principal.trim()) return { ok: false, error: "Sign in to comment" };

  const comment: ArcadeComment = {
    id: uid("cmt"),
    gameId: input.gameId,
    channel: input.channel,
    kind: input.kind,
    body,
    authorPrincipal: input.principal.trim(),
    authorUsername: input.username.trim() || "player",
    resolved: false,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase()!;
      const { data, error } = await sb.rpc("gh_arcade_add_comment", {
        p: {
          id: comment.id,
          game_id: comment.gameId,
          channel: comment.channel,
          kind: comment.kind,
          body: comment.body,
          author_principal: comment.authorPrincipal,
          author_username: comment.authorUsername,
        },
      });
      if (!error && data && (data as { ok?: boolean }).ok !== false) {
        return { ok: true, comment };
      }
      // table insert fallback
      const { error: insErr } = await sb.from("gh_arcade_comments").insert({
        id: comment.id,
        game_id: comment.gameId,
        channel: comment.channel,
        kind: comment.kind,
        body: comment.body,
        author_principal: comment.authorPrincipal,
        author_username: comment.authorUsername,
        resolved: false,
        created_at: comment.createdAt,
        updated_at: comment.createdAt,
      });
      if (!insErr) return { ok: true, comment };
      console.warn("[arcade] add comment", error?.message, insErr?.message);
    } catch (e) {
      console.warn("[arcade] addArcadeComment", e);
    }
  }

  const all = readLocalComments();
  all.unshift(comment);
  writeLocalComments(all);
  return { ok: true, comment };
}

export async function setArcadeCommentResolved(input: {
  commentId: string;
  creatorPrincipal: string;
  resolved: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const principal = input.creatorPrincipal.trim();
  if (!principal) return { ok: false, error: "Sign in required" };

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase()!;
      const { data, error } = await sb.rpc("gh_arcade_set_comment_resolved", {
        p: {
          id: input.commentId,
          creator_principal: principal,
          resolved: input.resolved,
        },
      });
      if (!error && data && (data as { ok?: boolean }).ok !== false) {
        const err = (data as { error?: string }).error;
        if (err) return { ok: false, error: err };
        return { ok: true };
      }
      // direct update fallback (may fail RLS)
      const { error: upErr } = await sb
        .from("gh_arcade_comments")
        .update({
          resolved: input.resolved,
          resolved_by: input.resolved ? principal : null,
          resolved_at: input.resolved ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.commentId)
        .eq("kind", "bug");
      if (!upErr) return { ok: true };
      return {
        ok: false,
        error:
          (data as { error?: string })?.error ||
          error?.message ||
          upErr?.message ||
          "Could not update bug",
      };
    } catch (e) {
      console.warn("[arcade] setCommentResolved", e);
    }
  }

  const all = readLocalComments();
  const idx = all.findIndex((c) => c.id === input.commentId);
  if (idx < 0) return { ok: false, error: "Comment not found" };
  if (all[idx].kind !== "bug") {
    return { ok: false, error: "Only bugs can be resolved" };
  }
  all[idx] = {
    ...all[idx],
    resolved: input.resolved,
    resolvedBy: input.resolved ? principal : undefined,
    resolvedAt: input.resolved ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };
  writeLocalComments(all);
  return { ok: true };
}

export async function listArcadeRatings(
  gameId: string,
): Promise<ArcadeRating[]> {
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase()!;
      const { data, error } = await sb
        .from("gh_arcade_ratings")
        .select("*")
        .eq("game_id", gameId)
        .order("updated_at", { ascending: false })
        .limit(500);
      if (!error && Array.isArray(data)) {
        return (data as Record<string, unknown>[]).map(rowToRating);
      }
    } catch (e) {
      console.warn("[arcade] listArcadeRatings", e);
    }
  }
  return readLocalRatings().filter((r) => r.gameId === gameId);
}

export async function getArcadeRatingSummary(
  gameId: string,
  myPrincipal?: string,
): Promise<ArcadeRatingSummary> {
  const rows = await listArcadeRatings(gameId);
  if (rows.length === 0) {
    return { average: 0, count: 0, mine: 0 };
  }
  const sum = rows.reduce((a, r) => a + r.stars, 0);
  const mine =
    myPrincipal && myPrincipal.trim()
      ? rows.find((r) => r.principal === myPrincipal.trim())?.stars ?? 0
      : 0;
  return {
    average: Math.round((sum / rows.length) * 10) / 10,
    count: rows.length,
    mine,
  };
}

export async function upsertArcadeRating(input: {
  gameId: string;
  principal: string;
  username: string;
  stars: number;
}): Promise<{ ok: boolean; error?: string }> {
  const principal = input.principal.trim();
  const stars = Math.min(5, Math.max(1, Math.floor(input.stars)));
  if (!principal) return { ok: false, error: "Sign in to rate" };
  if (stars < 1 || stars > 5) return { ok: false, error: "Pick 1–5 stars" };

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase()!;
      const { data, error } = await sb.rpc("gh_arcade_upsert_rating", {
        p: {
          game_id: input.gameId,
          principal,
          username: input.username || "player",
          stars,
        },
      });
      if (!error && data && (data as { ok?: boolean }).ok !== false) {
        const err = (data as { error?: string }).error;
        if (err) return { ok: false, error: err };
        return { ok: true };
      }
      const id = `rt_${input.gameId}_${principal}`.slice(0, 80);
      const { error: upErr } = await sb.from("gh_arcade_ratings").upsert(
        {
          id,
          game_id: input.gameId,
          principal,
          username: input.username || "player",
          stars,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "game_id,principal" },
      );
      if (!upErr) return { ok: true };
      return {
        ok: false,
        error: error?.message || upErr?.message || "Rating save failed",
      };
    } catch (e) {
      console.warn("[arcade] upsertRating", e);
    }
  }

  const all = readLocalRatings();
  const idx = all.findIndex(
    (r) => r.gameId === input.gameId && r.principal === principal,
  );
  const now = new Date().toISOString();
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      stars,
      username: input.username || all[idx].username,
      updatedAt: now,
    };
  } else {
    all.push({
      id: uid("rt"),
      gameId: input.gameId,
      principal,
      username: input.username || "player",
      stars,
      createdAt: now,
      updatedAt: now,
    });
  }
  writeLocalRatings(all);
  return { ok: true };
}

/**
 * Distinct testers from paid scores + sessions + ratings.
 */
export async function listArcadeTesters(
  gameId: string,
): Promise<ArcadeTester[]> {
  const map = new Map<string, ArcadeTester>();

  const bump = (principal: string, username: string, at: string) => {
    const p = (principal || "").trim();
    if (!p) return;
    const prev = map.get(p);
    if (!prev) {
      map.set(p, {
        principal: p,
        username: username || "player",
        plays: 1,
        lastAt: at,
      });
      return;
    }
    prev.plays += 1;
    if (at > prev.lastAt) {
      prev.lastAt = at;
      if (username) prev.username = username;
    }
  };

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase()!;
      const [scores, sessions, ratings] = await Promise.all([
        sb
          .from("gh_arcade_scores")
          .select("principal,username,at")
          .eq("game_id", gameId)
          .limit(500),
        sb
          .from("gh_arcade_sessions")
          .select("player_principal,username,updated_at,created_at")
          .eq("game_id", gameId)
          .limit(500),
        sb
          .from("gh_arcade_ratings")
          .select("principal,username,updated_at,created_at")
          .eq("game_id", gameId)
          .limit(500),
      ]);
      for (const row of scores.data || []) {
        const r = row as Record<string, unknown>;
        bump(
          String(r.principal || ""),
          String(r.username || ""),
          String(r.at || ""),
        );
      }
      for (const row of sessions.data || []) {
        const r = row as Record<string, unknown>;
        bump(
          String(r.player_principal || ""),
          String(r.username || ""),
          String(r.updated_at || r.created_at || ""),
        );
      }
      for (const row of ratings.data || []) {
        const r = row as Record<string, unknown>;
        bump(
          String(r.principal || ""),
          String(r.username || ""),
          String(r.updated_at || r.created_at || ""),
        );
      }
    } catch (e) {
      console.warn("[arcade] listArcadeTesters", e);
    }
  }

  // local ratings as fallback
  for (const r of readLocalRatings().filter((x) => x.gameId === gameId)) {
    bump(r.principal, r.username, r.updatedAt || r.createdAt);
  }

  return [...map.values()].sort((a, b) => b.plays - a.plays);
}

export function formatStarAverage(avg: number, count: number): string {
  if (count <= 0) return "No ratings yet";
  return `${avg.toFixed(1)} ★ · ${count} rating${count === 1 ? "" : "s"}`;
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

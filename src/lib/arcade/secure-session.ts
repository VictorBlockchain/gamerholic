/**
 * Hybrid secure arcade session
 *
 * 1) Supabase server time + RPCs → low-latency timer / score staging
 * 2) ICP canister → fee escrow + prize settlement (may lag)
 * 3) Supabase confirm RPC after canister returns
 *
 * Without Supabase env: local fallback keeps the same API (demo only).
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { submitScore } from "@/lib/arcade/store";
import type { PlayFeeToken } from "@/lib/arcade/types";
import type { PrizeSettlement } from "@/lib/arcade/prize";

export type SecureSessionStatus =
  | "open"
  | "finalized_pending_chain"
  | "confirmed"
  | "refunded"
  | "rejected";

export type SecurePlaySession = {
  sessionId: string;
  gameId: string;
  playerPrincipal: string;
  username: string;
  paid: boolean;
  playFee: number;
  playFeeToken: PlayFeeToken;
  playTimeSec: number;
  /** ISO from server */
  tStart: string;
  tEnd: string;
  remainingSec: number;
  seed: string;
  graceSec: number;
  status: SecureSessionStatus;
  runningScore: number;
  source: "supabase" | "local";
};

export type FinalizeResult = {
  ok: boolean;
  sessionId: string;
  finalScore: number;
  status: SecureSessionStatus;
  needsCanister: boolean;
  settlement?: PrizeSettlement | null;
  canisterTx?: string;
  note?: string;
  error?: string;
};

const LOCAL_SESS_KEY = "gh_arcade_secure_sessions_v1";

function feeToE8s(fee: number, token: PlayFeeToken): bigint {
  if (token === "GAMER") return BigInt(Math.round(fee * 100)); // 2 dp
  return BigInt(Math.round(fee * 1e8));
}

function readLocalSessions(): Record<string, SecurePlaySession> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SESS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocalSessions(map: Record<string, SecurePlaySession>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_SESS_KEY, JSON.stringify(map));
  } catch {
    /* */
  }
}

/** Wall clock from Supabase (or local Date as fallback). */
export async function getServerNow(): Promise<Date> {
  const sb = getSupabase();
  if (!sb) return new Date();
  try {
    const { data, error } = await sb.rpc("gh_arcade_server_now");
    if (error || !data) return new Date();
    return new Date(data as string);
  } catch {
    return new Date();
  }
}

export async function startSecureSession(opts: {
  gameId: string;
  playerPrincipal: string;
  username: string;
  paid: boolean;
  playFee: number;
  playFeeToken: PlayFeeToken;
  playTimeSec: number;
}): Promise<SecurePlaySession> {
  const sb = getSupabase();
  if (sb && isSupabaseConfigured()) {
    const { data, error } = await sb.rpc("gh_arcade_start_session", {
      p: {
        game_id: opts.gameId,
        player_principal: opts.playerPrincipal,
        username: opts.username,
        paid: opts.paid,
        play_fee_e8s: Number(feeToE8s(opts.playFee, opts.playFeeToken)),
        play_fee_token: opts.playFeeToken,
        play_time_sec: opts.playTimeSec,
      },
    });
    if (error) throw new Error(error.message);
    const row = data as Record<string, unknown>;
    if (!row?.ok) throw new Error(String(row?.error || "start_session failed"));
    return {
      sessionId: String(row.session_id),
      gameId: opts.gameId,
      playerPrincipal: opts.playerPrincipal,
      username: opts.username,
      paid: opts.paid,
      playFee: opts.playFee,
      playFeeToken: opts.playFeeToken,
      playTimeSec: Number(row.play_time_sec) || opts.playTimeSec,
      tStart: String(row.t_start),
      tEnd: String(row.t_end),
      remainingSec: Number(row.remaining_sec) || opts.playTimeSec,
      seed: String(row.seed || ""),
      graceSec: Number(row.grace_sec) || 3,
      status: "open",
      runningScore: 0,
      source: "supabase",
    };
  }

  // Local demo fallback
  const now = Date.now();
  const sess: SecurePlaySession = {
    sessionId: `local_${Math.random().toString(36).slice(2, 12)}`,
    gameId: opts.gameId,
    playerPrincipal: opts.playerPrincipal,
    username: opts.username,
    paid: opts.paid,
    playFee: opts.playFee,
    playFeeToken: opts.playFeeToken,
    playTimeSec: opts.playTimeSec,
    tStart: new Date(now).toISOString(),
    tEnd: new Date(now + opts.playTimeSec * 1000).toISOString(),
    remainingSec: opts.playTimeSec,
    seed: Math.random().toString(16).slice(2),
    graceSec: 3,
    status: "open",
    runningScore: 0,
    source: "local",
  };
  const map = readLocalSessions();
  map[sess.sessionId] = sess;
  writeLocalSessions(map);
  return sess;
}

/** Re-sync remaining time from Supabase server clock. */
export async function syncSessionClock(
  sessionId: string,
  source: "supabase" | "local",
): Promise<{ remainingSec: number; expired: boolean; runningScore: number; status: string }> {
  if (source === "supabase" && isSupabaseConfigured()) {
    const sb = getSupabase()!;
    const { data, error } = await sb.rpc("gh_arcade_session_clock", {
      p_session_id: sessionId,
    });
    if (error) throw new Error(error.message);
    const row = data as Record<string, unknown>;
    if (!row?.ok) throw new Error(String(row?.error || "clock failed"));
    return {
      remainingSec: Number(row.remaining_sec) || 0,
      expired: Boolean(row.expired),
      runningScore: Number(row.running_score) || 0,
      status: String(row.status || "open"),
    };
  }
  const map = readLocalSessions();
  const s = map[sessionId];
  if (!s) return { remainingSec: 0, expired: true, runningScore: 0, status: "rejected" };
  const rem = Math.max(0, Math.ceil((new Date(s.tEnd).getTime() - Date.now()) / 1000));
  return {
    remainingSec: rem,
    expired: rem <= 0,
    runningScore: s.runningScore,
    status: s.status,
  };
}

let localSeq = 0;

/** Report score checkpoint (throttled by Supabase RPC). */
export async function reportSecureScore(
  session: SecurePlaySession,
  score: number,
): Promise<{ ok: boolean; remainingSec?: number; error?: string }> {
  const sc = Math.max(0, Math.floor(score));
  if (session.source === "supabase" && isSupabaseConfigured()) {
    localSeq += 1;
    const sb = getSupabase()!;
    const { data, error } = await sb.rpc("gh_arcade_submit_score_event", {
      p: {
        session_id: session.sessionId,
        score: sc,
        seq: localSeq,
        client_ts_ms: Date.now(),
      },
    });
    if (error) return { ok: false, error: error.message };
    const row = data as Record<string, unknown>;
    if (!row?.ok) return { ok: false, error: String(row?.error || "score rejected") };
    return {
      ok: true,
      remainingSec: Number(row.remaining_sec),
    };
  }
  const map = readLocalSessions();
  const s = map[session.sessionId];
  if (!s || s.status !== "open") return { ok: false, error: "not open" };
  if (sc < s.runningScore) return { ok: false, error: "score_decreased" };
  s.runningScore = sc;
  map[session.sessionId] = s;
  writeLocalSessions(map);
  return { ok: true };
}

/**
 * Finalize on Supabase → settle canister (async) → confirm Supabase.
 */
export async function finalizeSecureSession(opts: {
  session: SecurePlaySession;
  finalScore: number;
  endReason: string;
}): Promise<FinalizeResult> {
  const score = Math.max(0, Math.floor(opts.finalScore));
  const { session } = opts;

  // ── 1) Supabase finalize (fast path) ──
  if (session.source === "supabase" && isSupabaseConfigured()) {
    const sb = getSupabase()!;
    const { data, error } = await sb.rpc("gh_arcade_finalize_session", {
      p: {
        session_id: session.sessionId,
        final_score: score,
        end_reason: opts.endReason,
      },
    });
    if (error) {
      return {
        ok: false,
        sessionId: session.sessionId,
        finalScore: score,
        status: "rejected",
        needsCanister: false,
        error: error.message,
      };
    }
    const fin = data as Record<string, unknown>;
    if (!fin?.ok) {
      return {
        ok: false,
        sessionId: session.sessionId,
        finalScore: score,
        status: "rejected",
        needsCanister: false,
        error: String(fin?.error || "finalize failed"),
      };
    }

    const finalScore = Number(fin.final_score) || score;
    const needsCanister = Boolean(fin.needs_canister);

    if (!needsCanister) {
      // Free practice — no chain
      return {
        ok: true,
        sessionId: session.sessionId,
        finalScore,
        status: "confirmed",
        needsCanister: false,
        note: "Free play staged (no canister settle)",
      };
    }

    // ── 2) Canister settle (may lag) ──
    try {
      await sb.rpc("gh_arcade_mark_chain_sent", {
        p_session_id: session.sessionId,
        p_tx: null,
      });
    } catch {
      /* optional */
    }

    return runCanisterSettleAndConfirm({
      sessionId: session.sessionId,
      gameId: session.gameId,
      playerPrincipal: session.playerPrincipal,
      username: session.username,
      paid: session.paid,
      playFee: session.playFee,
      playFeeToken: session.playFeeToken,
      finalScore,
      endReason: opts.endReason,
    });
  }

  // ── Local fallback: immediate store settle ──
  const map = readLocalSessions();
  const s = map[session.sessionId];
  if (s) {
    s.status = "confirmed";
    s.runningScore = score;
    map[session.sessionId] = s;
    writeLocalSessions(map);
  }
  if (session.paid) {
    const result = submitScore({
      gameId: session.gameId,
      username: session.username,
      principal: session.playerPrincipal,
      score,
      paid: true,
      playFeePaid: session.playFee,
      playFeeToken: session.playFeeToken,
      endReason: opts.endReason as "timer" | "game" | "unload" | "manual",
      sessionId: session.sessionId,
    });
    return {
      ok: Boolean(result),
      sessionId: session.sessionId,
      finalScore: score,
      status: "confirmed",
      needsCanister: false,
      settlement: result?.settlement ?? null,
      note: result?.alreadySettled
        ? "Already settled (idempotent)"
        : result?.row.settlementNote ||
          "Local settle (no Supabase) — demo escrow + claim",
    };
  }
  return {
    ok: true,
    sessionId: session.sessionId,
    finalScore: score,
    status: "confirmed",
    needsCanister: false,
    note: "Free local practice",
  };
}

/**
 * Re-run canister settle using the **score already stored on Supabase**.
 * Safe after lag / timeout / confirm failure — does not re-debit fee or re-open play.
 * Settlement is idempotent on `session_id`.
 */
export async function retryCanisterSettle(
  sessionId: string,
): Promise<FinalizeResult> {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured()) {
    return {
      ok: false,
      sessionId,
      finalScore: 0,
      status: "rejected",
      needsCanister: true,
      error: "Supabase not configured",
    };
  }

  // Load staged session (final_score is source of truth for retry)
  const { data: row, error } = await sb
    .from("gh_arcade_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !row) {
    return {
      ok: false,
      sessionId,
      finalScore: 0,
      status: "rejected",
      needsCanister: true,
      error: error?.message || "session not found",
    };
  }

  const status = String(row.status || "");
  if (status === "confirmed" || status === "refunded") {
    return {
      ok: true,
      sessionId,
      finalScore: Number(row.final_score) || 0,
      status: status as SecureSessionStatus,
      needsCanister: true,
      note: "Already confirmed on Supabase — no resubmit needed",
      canisterTx: row.canister_tx ? String(row.canister_tx) : undefined,
      settlement: (row.settlement as PrizeSettlement) || null,
    };
  }

  if (status !== "finalized_pending_chain" && status !== "chain_failed") {
    return {
      ok: false,
      sessionId,
      finalScore: Number(row.final_score) || 0,
      status: status as SecureSessionStatus,
      needsCanister: true,
      error: `Cannot retry from status ${status} (need finalized_pending_chain or chain_failed)`,
    };
  }

  if (!row.paid) {
    return {
      ok: true,
      sessionId,
      finalScore: Number(row.final_score) || 0,
      status: "confirmed",
      needsCanister: false,
      note: "Free session — nothing to settle on-chain",
    };
  }

  const finalScore = Number(row.final_score ?? row.running_score) || 0;
  const token = (row.play_fee_token === "GAMER" ? "GAMER" : "ICP") as PlayFeeToken;
  const feeE8s = Number(row.play_fee_e8s) || 0;
  const playFee =
    token === "GAMER" ? feeE8s / 100 : feeE8s / 1e8;

  // Re-queue job if needed
  try {
    await sb.rpc("gh_arcade_requeue_chain_job", { p_session_id: sessionId });
  } catch {
    /* optional helper */
  }

  return runCanisterSettleAndConfirm({
    sessionId,
    gameId: String(row.game_id),
    playerPrincipal: String(row.player_principal),
    username: String(row.username || "player"),
    paid: true,
    playFee,
    playFeeToken: token,
    finalScore,
    endReason: String(row.end_reason || "retry"),
  });
}

async function runCanisterSettleAndConfirm(opts: {
  sessionId: string;
  gameId: string;
  playerPrincipal: string;
  username: string;
  paid: boolean;
  playFee: number;
  playFeeToken: PlayFeeToken;
  finalScore: number;
  endReason: string;
}): Promise<FinalizeResult> {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.rpc("gh_arcade_mark_chain_sent", {
        p_session_id: opts.sessionId,
        p_tx: null,
      });
    } catch {
      /* */
    }
  }

  const chain = await settleSessionOnCanister(opts);

  if (sb) {
    const { data: conf, error: confErr } = await sb.rpc(
      "gh_arcade_confirm_canister",
      {
        p: {
          session_id: opts.sessionId,
          ok: chain.ok,
          canister_tx: chain.tx,
          settlement: chain.settlement || {},
          error: chain.error,
        },
      },
    );
    if (confErr) {
      // Canister may have succeeded — leave pending for another retry
      return {
        ok: chain.ok,
        sessionId: opts.sessionId,
        finalScore: opts.finalScore,
        status: chain.ok ? "finalized_pending_chain" : "rejected",
        needsCanister: true,
        settlement: chain.settlement,
        canisterTx: chain.tx,
        note: chain.ok
          ? "Canister settled but Supabase confirm failed — safe to retry confirm"
          : chain.note,
        error: confErr.message,
      };
    }
    const c = conf as Record<string, unknown>;
    return {
      ok: Boolean(c?.ok ?? chain.ok),
      sessionId: opts.sessionId,
      finalScore: opts.finalScore,
      status: chain.ok
        ? ((c?.status as SecureSessionStatus) || "confirmed")
        : "finalized_pending_chain",
      needsCanister: true,
      settlement: chain.settlement,
      canisterTx: chain.tx,
      note: chain.alreadySettled
        ? "Idempotent: session already settled on-chain/local"
        : chain.note,
      error: chain.ok ? undefined : chain.error,
    };
  }

  return {
    ok: chain.ok,
    sessionId: opts.sessionId,
    finalScore: opts.finalScore,
    status: chain.ok ? "confirmed" : "rejected",
    needsCanister: true,
    settlement: chain.settlement,
    canisterTx: chain.tx,
    note: chain.note,
    error: chain.error,
  };
}

/**
 * ICP settlement adapter.
 * Today: local escrow settle (store). Later: actor.settleArcadeSession(sessionId, ...).
 * **Must be idempotent on sessionId.**
 */
async function settleSessionOnCanister(opts: {
  sessionId: string;
  gameId: string;
  playerPrincipal: string;
  username: string;
  paid: boolean;
  playFee: number;
  playFeeToken: PlayFeeToken;
  finalScore: number;
  endReason: string;
}): Promise<{
  ok: boolean;
  tx?: string;
  settlement?: PrizeSettlement | null;
  note?: string;
  error?: string;
  alreadySettled?: boolean;
}> {
  if (!opts.paid) {
    return { ok: true, tx: "practice", note: "No chain for free play" };
  }

  await new Promise((r) => setTimeout(r, 120));

  try {
    const result = submitScore({
      gameId: opts.gameId,
      username: opts.username,
      principal: opts.playerPrincipal,
      score: opts.finalScore,
      paid: true,
      playFeePaid: opts.playFee,
      playFeeToken: opts.playFeeToken,
      endReason: opts.endReason as "timer" | "game" | "unload" | "manual",
      sessionId: opts.sessionId,
    });
    if (!result) {
      return { ok: false, error: "canister_settle_failed" };
    }
    return {
      ok: true,
      tx: result.tx || `local-escrow:${opts.sessionId}`,
      settlement: result.settlement,
      note: result.alreadySettled
        ? "Already settled for this session_id (safe retry)"
        : result.row.settlementNote,
      alreadySettled: result.alreadySettled,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Interpolate remaining seconds between clock syncs using last known t_end.
 * Prefer periodic syncSessionClock every 1–2s.
 */
export function remainingFromTEnd(tEndIso: string, nowMs = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(tEndIso).getTime() - nowMs) / 1000));
}

/**
 * Mirror canister state → Supabase for Realtime UI.
 * Dexsta pattern: after successful canister write, RPC upsert_* + optional event insert.
 */

import { getSupabase, isSupabaseConfigured } from "./client";
import { GH_TABLES } from "./tables";
import type { ChallengeDetail } from "@/lib/challenges";
import { icpToE8s } from "@/lib/ic/canisters";
import type { TournamentDetail } from "@/lib/tournaments";

export async function mirrorChallenge(
  c: ChallengeDetail,
  eventType?: string,
  actor?: string,
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const payload = {
    id: c.id,
    title: c.title,
    game: c.game,
    console: c.console,
    status: c.status,
    creator: c.creator.username,
    opponent: c.opponent?.username ?? null,
    entry_fee_e8s: Number(icpToE8s(c.entryFeeIcp)),
    pot_extra_e8s: Number(icpToE8s(c.potExtraIcp)),
    score_creator: c.scoreCreator,
    score_opponent: c.scoreOpponent,
    score_is_final: c.scoreIsFinal,
    betable: c.betable,
    market_id: c.marketId ?? null,
    tournament_id: c.tournamentId ?? null,
    tournament_match_label: c.tournamentMatchLabel ?? null,
    monitor_username: c.monitorUsername ?? null,
    escrow_subaccount: c.escrowSubaccount,
    metadata: {
      description: c.description,
      coverUrl: c.coverUrl,
      teamMode: c.teamMode ?? false,
    },
    cancel_request: c.cancelRequest ?? null,
    dispute: c.dispute ?? null,
  };

  const { error } = await sb.rpc("upsert_gh_challenge_mirror", { p: payload });
  if (error) {
    console.warn("[gh mirror] challenge", error.message);
    return false;
  }

  if (eventType) {
    await sb.rpc("insert_gh_challenge_event", {
      p_challenge_id: c.id,
      p_event_type: eventType,
      p_actor: actor ?? null,
      p_payload: { status: c.status },
    });
  }
  return true;
}

export async function mirrorTournament(t: TournamentDetail): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const payload = {
    id: t.id,
    title: t.title,
    game: t.game,
    console: t.console,
    status: t.status,
    host_username: t.hostUsername,
    entry_fee_e8s: Number(icpToE8s(t.entryFeeIcp)),
    host_fee_bps: Math.round(t.hostFeePct * 100),
    max_players: t.maxPlayers,
    prize_pot_e8s: Number(icpToE8s(t.prizePotIcp ?? 0)),
    betable: t.betable,
    market_id: t.marketId ?? null,
    market_volume_e8s: Number(icpToE8s(t.marketVolumeIcp ?? 0)),
    team_entry: t.teamEntry,
    registration_open: t.registrationOpen,
    scheduled_at: t.scheduledAt,
    cover_url: t.coverUrl,
    description: t.description,
    stream_url: t.streamUrl ?? null,
    metadata: {},
  };

  const { error } = await sb.rpc("upsert_gh_tournament_mirror", { p: payload });
  if (error) {
    console.warn("[gh mirror] tournament", error.message);
    return false;
  }
  return true;
}

export async function fetchChallengeMirror(
  id: string,
): Promise<Record<string, unknown> | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from(GH_TABLES.challenges)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.warn("[gh mirror] fetch challenge", error.message);
    return null;
  }
  return data as Record<string, unknown> | null;
}

export function mirrorReady(): boolean {
  return isSupabaseConfigured();
}

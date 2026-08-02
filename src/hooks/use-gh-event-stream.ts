"use client";

/**
 * Supabase postgres_changes → optional map → Gh event bus.
 * Same shape as dexsta `use-event-stream.ts`.
 */

import { useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { GH_TABLES, type GhTableName } from "@/lib/supabase/tables";
import { useGhEvents } from "@/context/event-context";
import type { GhEvent } from "@/lib/events";

export type GhRealtimeTable = GhTableName | (string & {});

export function useGhEventStream(opts: {
  channel: string;
  table: GhRealtimeTable;
  filter?: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  map?: (row: Record<string, unknown>, op: string) => GhEvent | null;
  onChange?: (payload: {
    eventType: string;
    new: Record<string, unknown> | null;
    old: Record<string, unknown> | null;
  }) => void;
  enabled?: boolean;
}) {
  const { emit } = useGhEvents();
  const mapRef = useRef(opts.map);
  const onChangeRef = useRef(opts.onChange);
  mapRef.current = opts.map;
  onChangeRef.current = opts.onChange;

  useEffect(() => {
    if (opts.enabled === false) return;
    const sb = getSupabase();
    if (!sb) return;

    const ch = sb
      .channel(opts.channel)
      .on(
        "postgres_changes",
        {
          event: opts.event || "*",
          schema: "public",
          table: opts.table,
          filter: opts.filter,
        },
        (payload) => {
          const eventType = payload.eventType;
          const neu = (payload.new || null) as Record<string, unknown> | null;
          const old = (payload.old || null) as Record<string, unknown> | null;
          onChangeRef.current?.({ eventType, new: neu, old });
          if (neu && mapRef.current) {
            const mapped = mapRef.current(neu, eventType);
            if (mapped) emit(mapped);
          }
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(ch);
    };
  }, [
    opts.channel,
    opts.table,
    opts.filter,
    opts.event,
    opts.enabled,
    emit,
  ]);
}

/** Subscribe to a single challenge row for live score / status */
export function useChallengeRealtime(
  challengeId: string | undefined,
  onRow?: (row: Record<string, unknown>) => void,
) {
  useGhEventStream({
    channel: `gh-challenge-${challengeId ?? "none"}`,
    table: GH_TABLES.challenges,
    filter: challengeId ? `id=eq.${challengeId}` : undefined,
    enabled: Boolean(challengeId),
    onChange: ({ new: neu }) => {
      if (neu) onRow?.(neu);
    },
    map: (row) => ({
      id: `sb-chal-${String(row.id)}-${Date.now()}`,
      type: "challenge.score_submitted",
      origin: "supabase",
      at: new Date().toISOString(),
      challengeId: String(row.id),
      payload: row,
    }),
  });
}

/** Tournament row live updates */
export function useTournamentRealtime(
  tournamentId: string | undefined,
  onRow?: (row: Record<string, unknown>) => void,
) {
  useGhEventStream({
    channel: `gh-tournament-${tournamentId ?? "none"}`,
    table: GH_TABLES.tournaments,
    filter: tournamentId ? `id=eq.${tournamentId}` : undefined,
    enabled: Boolean(tournamentId),
    onChange: ({ new: neu }) => {
      if (neu) onRow?.(neu);
    },
    map: (row) => ({
      id: `sb-tour-${String(row.id)}-${Date.now()}`,
      type: "tournament.live",
      origin: "supabase",
      at: new Date().toISOString(),
      tournamentId: String(row.id),
      payload: row,
    }),
  });
}

import type { EventHandler, GhEvent } from "./types";

export type EventBus = {
  emit: (event: Omit<GhEvent, "id" | "at"> & Partial<Pick<GhEvent, "id" | "at">>) => GhEvent;
  on: (handler: EventHandler) => () => void;
  recent: (n?: number) => GhEvent[];
};

export function createEventBus(maxRecent = 80): EventBus {
  const handlers = new Set<EventHandler>();
  const ring: GhEvent[] = [];

  return {
    emit(partial) {
      const event: GhEvent = {
        id: partial.id ?? `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: partial.at ?? new Date().toISOString(),
        type: partial.type,
        origin: partial.origin,
        challengeId: partial.challengeId,
        tournamentId: partial.tournamentId,
        marketId: partial.marketId,
        principal: partial.principal,
        payload: partial.payload,
      };
      ring.unshift(event);
      if (ring.length > maxRecent) ring.length = maxRecent;
      handlers.forEach((h) => {
        try {
          h(event);
        } catch {
          /* swallow listener errors */
        }
      });
      return event;
    },
    on(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    recent(n = 20) {
      return ring.slice(0, n);
    },
  };
}

/**
 * Gamerholic domain events — FE bus + Supabase mirror.
 * Pattern: dexsta `lib/events`.
 */

export type GhEventOrigin =
  | "canister"
  | "supabase"
  | "fe_action"
  | "demo";

export type GhEventType =
  | "challenge.created"
  | "challenge.joined"
  | "challenge.score_submitted"
  | "challenge.score_confirmed"
  | "challenge.cancel_requested"
  | "challenge.cancelled"
  | "challenge.disputed"
  | "challenge.settled"
  | "tournament.created"
  | "tournament.joined"
  | "tournament.live"
  | "tournament.settled"
  | "market.opened"
  | "market.wager"
  | "message.received"
  | "monitor.assigned"
  | "sync.mirrored";

export type GhEvent = {
  id: string;
  type: GhEventType;
  origin: GhEventOrigin;
  at: string;
  /** Entity ids for filtering */
  challengeId?: string;
  tournamentId?: string;
  marketId?: string;
  principal?: string;
  payload?: Record<string, unknown>;
};

export type EventHandler = (event: GhEvent) => void;

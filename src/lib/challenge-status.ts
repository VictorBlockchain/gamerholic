/**
 * Challenge / tournament status display helpers for dashboard cards.
 */

import type { ChallengeStatus } from "@/lib/challenges";
import type { TournamentStatus } from "@/lib/tournaments";

export function challengeStatusLabel(s: ChallengeStatus | string): string {
  switch (s) {
    case "open":
      return "Awaiting accept";
    case "accepted":
      return "Accepted";
    case "live":
      return "Live";
    case "settled":
      return "Settled";
    case "disputed":
      return "Disputed";
    case "cancelled":
      return "Cancelled";
    default:
      return String(s);
  }
}

export function challengeStatusTone(
  s: ChallengeStatus | string,
): "brand" | "prize" | "attr" | "live" | "muted" {
  switch (s) {
    case "open":
      return "prize";
    case "accepted":
      return "attr";
    case "live":
      return "live";
    case "settled":
      return "brand";
    case "disputed":
      return "prize";
    case "cancelled":
      return "muted";
    default:
      return "muted";
  }
}

export function tournamentStatusLabel(s: TournamentStatus | string): string {
  switch (s) {
    case "draft":
      return "Draft";
    case "open":
      return "Registration open";
    case "checkin":
      return "Check-in";
    case "live":
      return "Live";
    case "settled":
      return "Settled";
    case "cancelled":
      return "Cancelled";
    default:
      return String(s);
  }
}

export function tournamentStatusTone(
  s: TournamentStatus | string,
): "brand" | "prize" | "attr" | "live" | "muted" {
  switch (s) {
    case "open":
      return "attr";
    case "checkin":
      return "prize";
    case "live":
      return "live";
    case "settled":
      return "brand";
    default:
      return "muted";
  }
}

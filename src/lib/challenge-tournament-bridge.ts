/**
 * Bridge challenge UI → tournament catalog without circular imports.
 * Tournaments load from canister via tournament-service; this only maps ids.
 */

import {
  filledLabel,
  formatIcp,
  formatWhen,
  getTournament,
  potFrom,
  statusLabel,
  type TournamentDetail,
  type TournamentMarketLine,
} from "@/lib/tournaments";
import type { ChallengeDetail } from "@/lib/challenges";

export {
  filledLabel,
  formatIcp,
  formatWhen,
  getTournament,
  potFrom,
  statusLabel,
};

export function parentTournament(
  c: ChallengeDetail,
): TournamentDetail | undefined {
  if (!c.tournamentId) return undefined;
  return getTournament(c.tournamentId);
}

export function tournamentLinesForPlayer(
  tournament: TournamentDetail,
  username: string,
): TournamentMarketLine[] {
  const lines = tournament.marketLines ?? [];
  const u = username.toLowerCase();
  return lines.filter((l) => l.label.toLowerCase().includes(u));
}

export function matchLineForPlayer(c: ChallengeDetail, username: string) {
  return c.matchMoneyline?.find(
    (m) => m.username.toLowerCase() === username.toLowerCase(),
  );
}

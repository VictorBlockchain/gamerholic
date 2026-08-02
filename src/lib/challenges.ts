/**
 * Challenge domain types + pure helpers.
 * Data comes from canister (via challenge-service) + optional Supabase mirror.
 */

export type ChallengeStatus =
  | "open"
  | "accepted"
  | "live"
  | "settled"
  | "disputed"
  | "cancelled";

export type GameFormStats = {
  record: string;
  tournamentRecord: string;
  winStreak: number;
  lossStreak: number;
  winningsIcp: number;
};

export type ChallengeSide = {
  username: string;
  streamUrl?: string;
  record?: string;
  paid: boolean;
  gameStats?: GameFormStats;
};

export type MonitorProfile = {
  username: string;
  gamesMonitored: number;
  disputes: number;
  earningsIcp: number;
  note?: string;
};

export type ScoreReportRole = "player" | "monitor" | "tournament_host";
export type ScoreReportStatus = "pending" | "confirmed" | "expired";

export type ScoreReport = {
  creatorScore: number;
  opponentScore: number;
  isFinal: boolean;
  reportedBy: string;
  reportedByRole: ScoreReportRole;
  reportedAt: string;
  status: ScoreReportStatus;
  confirmDeadlineAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
};

export type CancelRequestStatus =
  | "pending"
  | "accepted"
  | "withdrawn"
  | "disputed";

export type CancelRequest = {
  requestedBy: string;
  requestedAt: string;
  status: CancelRequestStatus;
  scoreCreatorAtRequest: number;
  scoreOpponentAtRequest: number;
};

export type DisputeStatus = "open" | "resolved" | "dismissed";

export type ChallengeDispute = {
  id: string;
  openedBy: string;
  against: string;
  videoProofUrl: string;
  reason: string;
  status: DisputeStatus;
  openedAt: string;
  fromCancelRequest: boolean;
};

export type ChallengeDetail = {
  id: string;
  title: string;
  game: string;
  console: string;
  description: string;
  coverUrl: string;
  status: ChallengeStatus;
  entryFeeIcp: number;
  creator: ChallengeSide;
  opponent: ChallengeSide | null;
  invitedUsername?: string;
  scheduledAt: string | null;
  createdAt: string;
  betable: boolean;
  marketId?: string;
  teamMode?: boolean;
  tournamentId?: string;
  tournamentMatchLabel?: string;
  tournamentHostUsername?: string;
  tournamentHasBetable?: boolean;
  escrowSubaccount: string;
  potExtraIcp: number;
  scoreCreator: number;
  scoreOpponent: number;
  scoreIsFinal: boolean;
  pendingReport?: ScoreReport | null;
  monitorUsername?: string;
  matchMoneyline?: {
    username: string;
    odds: string;
    pct: number;
    volumeIcp: number;
  }[];
  cancelRequest?: CancelRequest | null;
  dispute?: ChallengeDispute | null;
};

/** Session identity until II is fully wired — use profile principal */
export const DEMO_VIEWER = "you";

export function challengeEscrowAddress(id: string) {
  const slug = id.replace(/[^a-z0-9]/gi, "").slice(0, 12).padEnd(12, "0");
  return `rdmx6-gh-chal-${slug}-suba-e5c70w-escrow01`;
}

export function basePotIcp(c: ChallengeDetail) {
  const paid =
    (c.creator.paid ? 1 : 0) + (c.opponent?.paid ? 1 : 0);
  return c.entryFeeIcp * paid + c.potExtraIcp;
}

export function isPlayer(c: ChallengeDetail, username = DEMO_VIEWER) {
  return (
    c.creator.username === username ||
    c.opponent?.username === username
  );
}

export function isMonitor(c: ChallengeDetail, username = DEMO_VIEWER) {
  return c.monitorUsername === username;
}

export function isTournamentHost(c: ChallengeDetail, username = DEMO_VIEWER) {
  return c.tournamentHostUsername === username;
}

export function canReportScore(c: ChallengeDetail, username = DEMO_VIEWER) {
  if (
    c.status === "settled" ||
    c.status === "cancelled" ||
    c.status === "disputed" ||
    c.status === "open"
  ) {
    return false;
  }
  if (!c.opponent) return false;
  if (c.scoreIsFinal) return false;
  if (c.cancelRequest?.status === "pending") return false;
  return (
    isPlayer(c, username) ||
    isMonitor(c, username) ||
    isTournamentHost(c, username)
  );
}

export function hasPostedScore(c: ChallengeDetail) {
  return c.scoreCreator > 0 || c.scoreOpponent > 0;
}

export function canMutualCancel(c: ChallengeDetail, username = DEMO_VIEWER) {
  if (c.tournamentId) return false;
  if (!isPlayer(c, username)) return false;
  if (!c.opponent) return false;
  if (
    c.status === "open" ||
    c.status === "settled" ||
    c.status === "cancelled" ||
    c.status === "disputed"
  ) {
    return false;
  }
  if (c.scoreIsFinal) return false;
  if (c.dispute?.status === "open") return false;
  return true;
}

export function otherPlayer(c: ChallengeDetail, username: string) {
  if (c.creator.username === username) return c.opponent?.username;
  if (c.opponent?.username === username) return c.creator.username;
  return undefined;
}

export function canDisputeCancel(c: ChallengeDetail, username = DEMO_VIEWER) {
  const req = c.cancelRequest;
  if (!req || req.status !== "pending") return false;
  if (req.requestedBy === username) return false;
  if (!isPlayer(c, username)) return false;
  if (!hasPostedScore(c)) return false;
  if (c.tournamentId) return false;
  return true;
}

export function isValidVideoProofUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function reportRoleFor(
  c: ChallengeDetail,
  username = DEMO_VIEWER,
): ScoreReportRole | null {
  if (isTournamentHost(c, username)) return "tournament_host";
  if (isMonitor(c, username)) return "monitor";
  if (isPlayer(c, username)) return "player";
  return null;
}

export function needsConfirmFrom(
  c: ChallengeDetail,
  report: ScoreReport,
): string[] {
  if (report.status !== "pending") return [];
  if (report.reportedByRole === "player") {
    const other =
      report.reportedBy === c.creator.username
        ? c.opponent?.username
        : c.creator.username;
    return other ? [other] : [];
  }
  const names: string[] = [c.creator.username];
  if (c.opponent) names.push(c.opponent.username);
  return names;
}

export function canConfirmReport(
  c: ChallengeDetail,
  username = DEMO_VIEWER,
): boolean {
  const r = c.pendingReport;
  if (!r || r.status !== "pending") return false;
  if (
    r.confirmDeadlineAt &&
    new Date(r.confirmDeadlineAt).getTime() < Date.now()
  ) {
    return false;
  }
  return needsConfirmFrom(c, r).includes(username);
}

export function canCreateBetable(
  c: ChallengeDetail,
  username = DEMO_VIEWER,
): { ok: boolean; reason?: string } {
  if (c.betable) return { ok: false, reason: "Market already open" };
  if (c.tournamentId) {
    if (!c.tournamentHasBetable) {
      return {
        ok: false,
        reason:
          "Parent tournament has no betable market — this bracket match cannot open one",
      };
    }
    return {
      ok: false,
      reason: "Use the parent tournament market for this bracket match",
    };
  }
  if (c.scoreCreator > 0 || c.scoreOpponent > 0 || c.scoreIsFinal) {
    return {
      ok: false,
      reason: "Betable can only open before either score is above 0",
    };
  }
  if (
    c.status === "settled" ||
    c.status === "cancelled" ||
    c.status === "open"
  ) {
    return {
      ok: false,
      reason: "Challenge must be accepted / live before opening a market",
    };
  }
  if (!isPlayer(c, username)) {
    return { ok: false, reason: "Only players in the match can open betable" };
  }
  return { ok: true };
}

export function makePendingReport(
  c: ChallengeDetail,
  opts: {
    creatorScore: number;
    opponentScore: number;
    isFinal: boolean;
    reportedBy: string;
    role: ScoreReportRole;
  },
): ScoreReport {
  const now = new Date();
  const needsDeadline =
    opts.role === "monitor" || opts.role === "tournament_host";
  return {
    creatorScore: opts.creatorScore,
    opponentScore: opts.opponentScore,
    isFinal: opts.isFinal,
    reportedBy: opts.reportedBy,
    reportedByRole: opts.role,
    reportedAt: now.toISOString(),
    status: "pending",
    confirmDeadlineAt: needsDeadline
      ? new Date(now.getTime() + 5 * 60 * 1000).toISOString()
      : undefined,
  };
}

export function getMonitorProfile(
  username: string | undefined,
): MonitorProfile | undefined {
  if (!username) return undefined;
  return {
    username,
    gamesMonitored: 0,
    disputes: 0,
    earningsIcp: 0,
    note: "Assigned monitor",
  };
}

export function formatWhen(iso: string | null) {
  if (!iso) return "ASAP / flex";
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatIcp(n: number) {
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)} ICP`;
}

export function secondsUntil(iso: string | undefined) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
}

export function formatCountdown(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Parent tournament helpers re-export for challenge UI
export {
  filledLabel,
  formatIcp as formatTournamentIcp,
  formatWhen as formatTournamentWhen,
  getTournament,
  potFrom,
  statusLabel,
  parentTournament,
  tournamentLinesForPlayer,
  matchLineForPlayer,
} from "./challenge-tournament-bridge";

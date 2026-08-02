/**
 * Challenge service — canister is source of truth.
 * Optional Supabase mirror for Realtime.
 */

import type { Identity } from "@dfinity/agent";
import {
  createBackendActor,
  dateToNs,
  e8sToIcp,
  icpToE8s,
  isCanisterConfigured,
  nsToIso,
  unwrapOpt,
  type ChallengeInfoCanister,
} from "./canisters";
import {
  challengeEscrowAddress,
  type ChallengeDetail,
  type ChallengeStatus,
  type CancelRequest,
  type ChallengeDispute,
} from "@/lib/challenges";
import { mirrorChallenge, fetchChallengeMirror } from "@/lib/supabase/mirror";

export type ChallengeServiceMode = "canister" | "offline";

export function getChallengeServiceMode(): ChallengeServiceMode {
  return isCanisterConfigured() ? "canister" : "offline";
}

function statusFromNat(n: bigint | number): ChallengeStatus {
  const v = Number(n);
  switch (v) {
    case 0:
      return "cancelled";
    case 1:
      return "open";
    case 2:
      return "live";
    case 3:
      return "accepted"; // score pending confirm — treat as live UI with pending
    case 4:
      return "settled";
    case 5:
      return "disputed";
    case 6:
      return "cancelled";
    default:
      return "open";
  }
}

function mapCanisterChallenge(
  id: string,
  info: ChallengeInfoCanister,
): ChallengeDetail {
  const status = statusFromNat(info.status);
  const scorePending = Number(info.status) === 3;
  let cancelRequest: CancelRequest | null = null;
  if (info.cancelRequester) {
    cancelRequest = {
      requestedBy: info.cancelRequester,
      requestedAt: nsToIso(info.cancelRequestedAt) ?? new Date().toISOString(),
      status: "pending",
      scoreCreatorAtRequest: Number(info.player1score),
      scoreOpponentAtRequest: Number(info.player2score),
    };
  }
  let dispute: ChallengeDispute | null = null;
  if (info.disputeBy || Number(info.status) === 5) {
    dispute = {
      id: `dsp-${id}`,
      openedBy: info.disputeBy || "unknown",
      against: info.cancelRequester || info.creator,
      videoProofUrl: info.disputeVideo || "",
      reason: info.disputeReason || "Dispute",
      status: "open",
      openedAt: new Date().toISOString(),
      fromCancelRequest: Boolean(info.disputeVideo),
    };
  }

  return {
    id,
    title: info.title || info.gameType || id,
    game: info.gameType || "Unknown",
    console: info.console || "PC",
    description: info.metadata || "",
    coverUrl: "/art/chibi-heads-up.jpg",
    status: scorePending ? "live" : status,
    entryFeeIcp: e8sToIcp(info.entryFee),
    creator: {
      username: info.creator,
      streamUrl: info.creatorStream || undefined,
      paid: true,
    },
    opponent: info.opponent
      ? {
          username: info.opponent,
          streamUrl: info.opponentStream || undefined,
          paid: Number(info.currentParticipants) >= 2,
        }
      : null,
    scheduledAt: nsToIso(info.scheduledAt),
    createdAt: nsToIso(info.createdAt) ?? new Date().toISOString(),
    betable: info.betable,
    marketId: info.marketId || undefined,
    tournamentId: info.tournament || undefined,
    tournamentHasBetable: false,
    escrowSubaccount: challengeEscrowAddress(id),
    potExtraIcp: Math.max(
      0,
      e8sToIcp(info.totalPrizePool) -
        e8sToIcp(info.entryFee) * Number(info.currentParticipants || 1),
    ),
    scoreCreator: Number(info.player1score),
    scoreOpponent: Number(info.player2score),
    scoreIsFinal: info.scoreIsFinal && status === "settled",
    pendingReport: scorePending
      ? {
          creatorScore: Number(info.player1score),
          opponentScore: Number(info.player2score),
          isFinal: info.scoreIsFinal,
          reportedBy: info.scoreReporter || info.creator,
          reportedByRole: "player",
          reportedAt: nsToIso(info.timeScored) ?? new Date().toISOString(),
          status: "pending",
        }
      : null,
    monitorUsername: info.monitor || undefined,
    cancelRequest,
    dispute,
  };
}

function requireActor(identity?: Identity | null) {
  if (!isCanisterConfigured()) {
    throw new Error(
      "Canister not configured. Set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID and run dfx deploy.",
    );
  }
  return createBackendActor(identity);
}

export async function loadChallenge(
  id: string,
  identity?: Identity | null,
): Promise<ChallengeDetail | null> {
  const actor = await requireActor(identity);
  if (!actor) return null;

  try {
    const opt = await actor.getChallengeInfo(id);
    const info = unwrapOpt(opt);
    if (!info) {
      // try mirror only
      const mirror = await fetchChallengeMirror(id);
      if (!mirror) return null;
      return {
        id,
        title: String(mirror.title ?? id),
        game: String(mirror.game ?? ""),
        console: String(mirror.console ?? "PC"),
        description: "",
        coverUrl: "/art/chibi-heads-up.jpg",
        status: (mirror.status as ChallengeStatus) ?? "open",
        entryFeeIcp: Number(mirror.entry_fee_e8s ?? 0) / 1e8,
        creator: {
          username: String(mirror.creator ?? ""),
          paid: true,
        },
        opponent: mirror.opponent
          ? { username: String(mirror.opponent), paid: true }
          : null,
        scheduledAt: null,
        createdAt: String(mirror.created_at ?? new Date().toISOString()),
        betable: Boolean(mirror.betable),
        marketId: (mirror.market_id as string) || undefined,
        escrowSubaccount: String(
          mirror.escrow_subaccount ?? challengeEscrowAddress(id),
        ),
        potExtraIcp: Number(mirror.pot_extra_e8s ?? 0) / 1e8,
        scoreCreator: Number(mirror.score_creator ?? 0),
        scoreOpponent: Number(mirror.score_opponent ?? 0),
        scoreIsFinal: Boolean(mirror.score_is_final),
        monitorUsername: (mirror.monitor_username as string) || undefined,
      };
    }
    const mapped = mapCanisterChallenge(id, info);
    await mirrorChallenge(mapped).catch(() => undefined);
    return mapped;
  } catch (e) {
    console.error("[challenge-service] load", e);
    throw e;
  }
}

export async function listChallenges(
  identity?: Identity | null,
): Promise<ChallengeDetail[]> {
  const actor = await requireActor(identity);
  if (!actor) return [];
  const rows = await actor.listChallenges();
  return rows.map(([id, info]) => mapCanisterChallenge(id, info));
}

export type CreateChallengeInput = {
  creator: string;
  opponent?: string;
  game: string;
  title: string;
  console: string;
  entryFeeIcp: number;
  description?: string;
  tournamentId?: string;
  scheduledAt?: Date | null;
  betable?: boolean;
  monitor?: string;
  creatorStream?: string;
  payToken?: string;
};

export async function createChallenge(
  input: CreateChallengeInput,
  identity?: Identity | null,
): Promise<string> {
  const actor = await requireActor(identity);
  if (!actor) throw new Error("No actor");
  const id = await actor.createChallengeEx(
    input.creator,
    BigInt(1),
    input.opponent ?? "",
    input.game,
    input.tournamentId ?? "",
    input.payToken ?? "ICP",
    input.description ?? "",
    icpToE8s(input.entryFeeIcp),
    input.title,
    input.console,
    dateToNs(input.scheduledAt),
    Boolean(input.betable),
    "",
    input.monitor ?? "",
    input.creatorStream ?? "",
    "",
  );
  const c = await loadChallenge(id, identity);
  if (c) await mirrorChallenge(c, "challenge.created", input.creator);
  return id;
}

export async function joinChallenge(
  id: string,
  player: string,
  streamUrl: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  const ok = await actor.joinChallengeEx(id, player, streamUrl);
  if (ok) {
    const c = await loadChallenge(id, identity);
    if (c) await mirrorChallenge(c, "challenge.joined", player);
  }
  return ok;
}

export async function submitScore(
  id: string,
  p1: number,
  p2: number,
  reporter: string,
  isFinal: boolean,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  const ok = await actor.submitScoreEx(
    id,
    BigInt(p1),
    BigInt(p2),
    reporter,
    isFinal,
  );
  if (ok) {
    const c = await loadChallenge(id, identity);
    if (c) await mirrorChallenge(c, "challenge.score_submitted", reporter);
  }
  return ok;
}

export async function confirmScore(
  id: string,
  confirmer: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  const ok = await actor.confirmScore(id, confirmer);
  if (ok) {
    const c = await loadChallenge(id, identity);
    if (c) {
      await mirrorChallenge(c, "challenge.score_confirmed", confirmer);
      // Finalize heads-up betable market on score confirm (Esports settle)
      if (c.betable && c.marketId) {
        try {
          const { settleEsportsMarket } = await import("./betable-service");
          const p1 = c.scoreCreator ?? 0;
          const p2 = c.scoreOpponent ?? 0;
          // Winner = higher score side; source_id is player username/address
          const winnerSource =
            p1 === p2
              ? undefined
              : p1 > p2
                ? c.creator.username
                : c.opponent?.username;
          if (winnerSource) {
            await settleEsportsMarket({
              marketId: c.marketId,
              winningSourceId: winnerSource,
              entityId: id,
              entityKind: "match",
            });
          }
          // Unlock claim gate on gamerholic
          await actor.markBetableSettled?.(id, c.creator.username, true);
        } catch {
          /* settle is best-effort; claim still gated until resolved */
        }
      }
    }
  }
  return ok;
}

/** Reject a pending score report — opens score dispute (legacy path). */
export async function disputeScore(
  id: string,
  reason: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  const ok = await (
    actor as unknown as {
      disputeChallenge: (i: string, r: string) => Promise<boolean>;
    }
  ).disputeChallenge(id, reason || "Score disputed");
  if (ok) {
    const c = await loadChallenge(id, identity);
    if (c) await mirrorChallenge(c, "challenge.disputed");
  }
  return ok;
}

export async function requestMutualCancel(
  id: string,
  who: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  const ok = await actor.requestMutualCancel(id, who, BigInt(0));
  if (ok) {
    const c = await loadChallenge(id, identity);
    if (c) await mirrorChallenge(c, "challenge.cancel_requested", who);
  }
  return ok;
}

export async function withdrawMutualCancel(
  id: string,
  who: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  return actor.withdrawMutualCancel(id, who);
}

export async function acceptMutualCancel(
  id: string,
  who: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  const ok = await actor.acceptMutualCancel(id, who);
  if (ok) {
    const c = await loadChallenge(id, identity);
    if (c) await mirrorChallenge(c, "challenge.cancelled", who);
  }
  return ok;
}

export async function disputeMutualCancel(
  id: string,
  who: string,
  video: string,
  reason: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  const ok = await actor.disputeMutualCancel(id, who, video, reason);
  if (ok) {
    const c = await loadChallenge(id, identity);
    if (c) await mirrorChallenge(c, "challenge.disputed", who);
  }
  return ok;
}

export async function openChallengeBetable(
  id: string,
  who: string,
  scheduledAt: Date | null,
  monitor: string,
  identity?: Identity | null,
  opts?: {
    /** Override outcomes; default creator vs opponent labels */
    outcomes?: string[];
  },
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;

  // Load challenge so game + console are always sent to betable
  const existing = await loadChallenge(id, identity);
  if (!existing) return false;

  let marketId = "";
  const {
    isBetableConfigured,
    createEsportsBetableMarket,
    linkEsportsOutcomes,
  } = await import("./betable-service");

  if (isBetableConfigured()) {
    const game = existing.game?.trim();
    const consoleName = existing.console?.trim();
    if (!game || !consoleName) {
      throw new Error(
        "Challenge game and console are required to create a betable market",
      );
    }
    const close =
      scheduledAt && scheduledAt.getTime() > Date.now() + 3_600_000
        ? scheduledAt
        : new Date(Date.now() + 2 * 3_600_000);

    const [ownerPrincipal, subRaw] = await Promise.all([
      actor.getBackendPrincipal(),
      actor.getChallengeSubaccount(id),
    ]);
    const subaccount = Array.from(subRaw as number[] | Uint8Array);

    const creatorLabel = existing.creator.username || "Player 1";
    const opponentLabel =
      existing.opponent?.username ||
      existing.invitedUsername ||
      "Player 2";
    const outcomes =
      opts?.outcomes && opts.outcomes.length >= 2
        ? opts.outcomes
        : [creatorLabel, opponentLabel];

    const created = await createEsportsBetableMarket(
      {
        title: `${existing.title} — Winner`,
        description:
          existing.description ||
          `Gamerholic heads-up challenge ${id}`,
        game,
        console: consoleName,
        outcomes,
        closeDate: close,
        resolutionCriteria: `Official gamerholic heads-up result for ${game} (${consoleName}) determines the winner.`,
        escrowOwnerPrincipal: ownerPrincipal,
        escrowSubaccount: subaccount,
        entityId: id,
        entityKind: "match",
      },
      identity,
    );
    marketId = created.marketId;

    try {
      await linkEsportsOutcomes({
        marketId,
        entityId: id,
        entityKind: "match",
        outcomes: outcomes.map((label, i) => ({
          label,
          avatar_url: "",
          source_id:
            i === 0
              ? existing.creator.username
              : existing.opponent?.username ||
                existing.invitedUsername ||
                `opponent-${id}`,
          source_kind: "player" as const,
        })),
      });
    } catch {
      /* non-fatal */
    }
  }

  const ok = await actor.openChallengeBetable(
    id,
    who,
    marketId,
    dateToNs(scheduledAt),
    monitor,
  );
  if (ok) {
    const c = await loadChallenge(id, identity);
    if (c) await mirrorChallenge(c, "market.opened", who);
  }
  return ok;
}

/** @deprecated use loadChallenge — kept for UI that still calls syncLocalChallenge */
export async function syncLocalChallenge(
  c: ChallengeDetail,
  eventType?: string,
  actor?: string,
): Promise<void> {
  await mirrorChallenge(c, eventType, actor);
}

export async function listChallengesFromCanister(identity?: Identity | null) {
  return listChallenges(identity);
}

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
import { fetchAvatarMapByUsernames } from "@/lib/supabase/profile";

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

  const participants = Number(info.currentParticipants || 1);
  /**
   * Canister stores invited opponent name on create while still open (status 1,
   * participants 1). That is NOT a seated accept — map to invitedUsername only.
   */
  const seated =
    participants >= 2 && Boolean(info.opponent) && Number(info.status) !== 1;
  // Also treat status 2+ with opponent as seated even if participants lag
  const seatedOpponent =
    seated ||
    (Boolean(info.opponent) &&
      Number(info.status) !== 1 &&
      Number(info.status) !== 0 &&
      Number(info.status) !== 6);
  const invited =
    !seatedOpponent && info.opponent ? String(info.opponent) : undefined;

  const reporter = info.scoreReporter || "";
  const isOfficialReport =
    scorePending &&
    reporter &&
    ((info.monitor && reporter === info.monitor) ||
      (reporter !== info.creator && reporter !== info.opponent));

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
    opponent: seatedOpponent
      ? {
          username: info.opponent,
          streamUrl: info.opponentStream || undefined,
          paid: participants >= 2,
        }
      : null,
    invitedUsername: invited,
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
        e8sToIcp(info.entryFee) * Math.max(1, participants),
    ),
    scoreCreator: Number(info.player1score),
    scoreOpponent: Number(info.player2score),
    scoreIsFinal:
      (info.scoreIsFinal && status === "settled") || Number(info.status) === 4,
    pendingReport: scorePending && !isOfficialReport
      ? {
          creatorScore: Number(info.player1score),
          opponentScore: Number(info.player2score),
          isFinal: info.scoreIsFinal,
          reportedBy: reporter || info.creator,
          reportedByRole: "player" as const,
          reportedAt: nsToIso(info.timeScored) ?? new Date().toISOString(),
          status: "pending" as const,
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
    // Do NOT mirror on read — mirrorChallenge upserts Supabase which fires
    // Realtime → UI reload → loadChallenge → infinite refresh loop.
    // Mutations (create/join/score/…) call mirrorChallenge after writes.
    return mapped;
  } catch (e) {
    console.error("[challenge-service] load", e);
    throw e;
  }
}

/** Attach profile avatars to challenge sides (cards / detail). */
export async function withChallengeAvatars(
  list: ChallengeDetail[],
): Promise<ChallengeDetail[]> {
  const names: string[] = [];
  for (const c of list) {
    if (c.creator.username) names.push(c.creator.username);
    if (c.opponent?.username) names.push(c.opponent.username);
    if (c.invitedUsername) names.push(c.invitedUsername);
  }
  const avatars = await fetchAvatarMapByUsernames(names);
  if (!Object.keys(avatars).length) return list;
  return list.map((c) => ({
    ...c,
    creator: {
      ...c.creator,
      avatarUrl:
        c.creator.avatarUrl || avatars[c.creator.username.toLowerCase()],
    },
    opponent: c.opponent
      ? {
          ...c.opponent,
          avatarUrl:
            c.opponent.avatarUrl ||
            avatars[c.opponent.username.toLowerCase()],
        }
      : null,
  }));
}

export async function listChallenges(
  identity?: Identity | null,
): Promise<ChallengeDetail[]> {
  const actor = await requireActor(identity);
  if (!actor) return [];
  const rows = await actor.listChallenges();
  const mapped = rows.map(([id, info]: [string, ChallengeInfoCanister]) =>
    mapCanisterChallenge(id, info),
  );
  return withChallengeAvatars(mapped);
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

  // Creator funds escrow (play sub → challenge sub) when stake > 0
  if (input.entryFeeIcp > 0) {
    try {
      const {
        checkPlayIcpAfford,
        requiredIcpForChallengeEntry,
        lowBalanceMessage,
      } = await import("./gamer-service");
      const callerText =
        typeof identity?.getPrincipal === "function"
          ? identity.getPrincipal().toText()
          : "";
      if (callerText) {
        const need = requiredIcpForChallengeEntry(input.entryFeeIcp);
        const afford = await checkPlayIcpAfford(callerText, need, identity);
        if (afford.insufficient && afford.balance != null) {
          throw new Error(
            lowBalanceMessage({
              action: "fund this challenge",
              need: afford.need,
              balance: afford.balance,
            }),
          );
        }
      }
    } catch (e) {
      if (e instanceof Error && /Need .* ICP|Low balance/i.test(e.message)) {
        throw e;
      }
    }

    const { debitChallengeEntry } = await import("./settlement-service");
    const { formatCanisterError } = await import("./canister-errors");
    try {
      const funded = await debitChallengeEntry(
        id,
        input.entryFeeIcp,
        identity,
      );
      if (!funded) {
        throw new Error(
          "Challenge created but ICP stake debit failed — deposit to play subaccount, then re-fund or cancel",
        );
      }
    } catch (e) {
      if (e instanceof Error && /Need .* ICP|Low balance/i.test(e.message)) {
        throw e;
      }
      throw new Error(
        formatCanisterError(
          e,
          "Challenge created but ICP stake debit failed — deposit to play subaccount, then re-fund or cancel",
        ),
      );
    }
  }

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

  // Debit entry from caller's play subaccount → challenge escrow (native ICP)
  const existing = await loadChallenge(id, identity);
  if (existing && existing.entryFeeIcp > 0) {
    // Pre-check before ledger call (graceful low-balance)
    try {
      const {
        checkPlayIcpAfford,
        requiredIcpForChallengeEntry,
        lowBalanceMessage,
      } = await import("./gamer-service");
      const callerText =
        typeof identity?.getPrincipal === "function"
          ? identity.getPrincipal().toText()
          : "";
      if (callerText) {
        const need = requiredIcpForChallengeEntry(existing.entryFeeIcp);
        const afford = await checkPlayIcpAfford(callerText, need, identity);
        if (afford.insufficient && afford.balance != null) {
          throw new Error(
            lowBalanceMessage({
              action: "join this challenge",
              need: afford.need,
              balance: afford.balance,
            }),
          );
        }
      }
    } catch (e) {
      if (e instanceof Error && /Need .* ICP|Low balance/i.test(e.message)) {
        throw e;
      }
    }

    const { debitChallengeEntry } = await import("./settlement-service");
    try {
      const funded = await debitChallengeEntry(
        id,
        existing.entryFeeIcp,
        identity,
      );
      if (!funded) {
        throw new Error(
          "ICP debit failed — deposit stake to your play subaccount (wallet) first",
        );
      }
    } catch (e) {
      if (e instanceof Error && /Need .* ICP|Low balance/i.test(e.message)) {
        throw e;
      }
      const { formatCanisterError } = await import("./canister-errors");
      throw new Error(
        formatCanisterError(
          e,
          "ICP debit failed — deposit stake to your play subaccount (wallet) first",
        ),
      );
    }
  }

  const ok = await actor.joinChallengeEx(id, player, streamUrl);
  if (ok) {
    const c = await loadChallenge(id, identity);
    if (c) await mirrorChallenge(c, "challenge.joined", player);
  }
  return ok;
}

/** Creator cancels an open (unaccepted) challenge on-chain. */
export async function cancelOpenChallenge(
  id: string,
  reason = "Creator cancelled before accept",
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  const ok = await actor.cancelChallenge(id, reason);
  if (ok) {
    const c = await loadChallenge(id, identity);
    if (c) await mirrorChallenge(c, "challenge.cancelled");
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

/**
 * Claim heads-up prize after score is final.
 * 1) Marks claim on canister (stats)
 * 2) Distributes native ICP: winner play sub + optional mod + platform + vault
 */
export async function claimChallengePrize(opts: {
  challengeId: string;
  winnerAddress: string;
  winnerPrincipal: string;
  potIcp: number;
  moderatorPrincipal?: string | null;
  identity?: Identity | null;
}): Promise<{ ok: boolean; err?: string }> {
  const actor = await requireActor(opts.identity);
  if (!actor) return { ok: false, err: "No actor" };

  const claimed = await (actor as any).claimChallenge(
    opts.challengeId,
    icpToE8s(opts.potIcp),
    opts.winnerAddress,
    BigInt(0),
  );
  if (!claimed) {
    return {
      ok: false,
      err: "claimChallenge failed (score not final / betable not settled)",
    };
  }

  if (opts.potIcp > 0 && opts.winnerPrincipal) {
    const { distributeChallengePrize } = await import("./settlement-service");
    const dist = await distributeChallengePrize({
      challengeId: opts.challengeId,
      winnerPrincipal: opts.winnerPrincipal,
      moderatorPrincipal: opts.moderatorPrincipal,
      identity: opts.identity,
    });
    if (!dist.ok && !/already paid/i.test(dist.err)) {
      return {
        ok: false,
        err: dist.err || "Native ICP distribute failed after claim",
      };
    }
  }

  const c = await loadChallenge(opts.challengeId, opts.identity);
  if (c) await mirrorChallenge(c, "challenge.claimed", opts.winnerAddress);
  return { ok: true };
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
    /** Host Connect Betable principal (required for real factory create) */
    betableHostPrincipal?: string;
  },
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;

  // Load challenge so game + console are always sent to betable
  const existing = await loadChallenge(id, identity);
  if (!existing) return false;

  const game = existing.game?.trim();
  const consoleName = existing.console?.trim();
  if (!game || !consoleName) {
    throw new Error(
      "Challenge game and console are required to create a betable market",
    );
  }

  const creatorLabel = existing.creator.username || "Player 1";
  const opponentLabel =
    existing.opponent?.username ||
    existing.invitedUsername ||
    "Player 2";
  const outcomes =
    opts?.outcomes && opts.outcomes.length >= 2
      ? opts.outcomes
      : [creatorLabel, opponentLabel];

  const close =
    scheduledAt && scheduledAt.getTime() > Date.now() + 3_600_000
      ? scheduledAt
      : new Date(Date.now() + 2 * 3_600_000);
  const closeNs = BigInt(close.getTime()) * BigInt(1_000_000);

  // Prefer GH backend operator path (host Betable principal required)
  const betableHost = opts?.betableHostPrincipal?.trim() || "";
  if (
    betableHost &&
    typeof (actor as any).createChallengeBetableMarket === "function"
  ) {
    const splitPct = Math.round(
      Number(process.env.NEXT_PUBLIC_BETABLE_ESCROW_SPLIT_PCT || "100"),
    );
    const marketId = String(
      await (actor as any).createChallengeBetableMarket(
        id,
        who,
        betableHost,
        `${existing.title} — Winner`,
        existing.description || `Gamerholic heads-up challenge ${id}`,
        closeNs,
        `Official gamerholic heads-up result for ${game} (${consoleName}) determines the winner.`,
        outcomes,
        splitPct > 0,
        BigInt(Math.max(0, Math.min(100, splitPct))),
        "",
        0.01,
        game,
        consoleName,
        dateToNs(scheduledAt),
        monitor,
      ),
    );
    if (!marketId) {
      throw new Error(
        "Betable market create failed — Connect Betable, schedule ≥1h, ensure gh_backend is esports operator",
      );
    }
    try {
      const { linkEsportsOutcomes } = await import("./betable-service");
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
    const c = await loadChallenge(id, identity);
    if (c) await mirrorChallenge(c, "market.opened", who);
    return true;
  }

  // Fallback: synthetic market id only (no real factory create)
  const marketId = `${id}-market`;
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

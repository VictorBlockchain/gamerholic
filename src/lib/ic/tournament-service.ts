/**
 * Tournament service — canister SoT + Supabase mirror.
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
  type TournamentInfoCanister,
} from "./canisters";
import {
  DEFAULT_TOURNAMENT_COVER,
  setTournamentCache,
  setTournamentCacheMany,
  type TournamentDetail,
  type TournamentStatus,
} from "@/lib/tournaments";
import { mirrorTournament } from "@/lib/supabase/mirror";

function statusFromNat(n: bigint | number): TournamentStatus {
  const v = Number(n);
  switch (v) {
    case 0:
      return "cancelled";
    case 1:
      return "open";
    case 2:
      return "live";
    case 3:
      return "settled";
    default:
      return "open";
  }
}

function mapTournament(
  id: string,
  info: TournamentInfoCanister,
): TournamentDetail {
  return {
    id,
    title: info.title || info.gameType || id,
    game: info.gameType,
    console: info.console || "PC",
    description: info.metadata || "",
    coverUrl: info.coverUrl || DEFAULT_TOURNAMENT_COVER,
    status: statusFromNat(info.status),
    format: info.isFFA ? "round_robin" : "single_elim",
    // FFA / round-robin → multiplayer group pot; elim tree → classic bracket
    kind: info.isFFA ? "group_pot" : "bracket",
    entryFeeIcp: e8sToIcp(info.entryFee),
    hostFeePct: Number(info.hostFeeBps) / 100,
    maxPlayers: Number(info.maxParticipants),
    hostUsername: info.creator,
    scheduledAt: nsToIso(info.scheduledAt),
    createdAt: nsToIso(info.createdAt) ?? new Date().toISOString(),
    teamEntry: info.teamEntry,
    registrationOpen: info.registrationOpen,
    betable: info.betable,
    marketId: info.marketId || undefined,
    prizePotIcp: e8sToIcp(info.totalPrizePool),
    entrants: [],
    matches: [],
    streamUrl: info.streamUrl || undefined,
    rules: info.metadata || undefined,
  };
}

function requireActor(identity?: Identity | null) {
  if (!isCanisterConfigured()) {
    throw new Error(
      "Canister not configured. Set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID and dfx deploy.",
    );
  }
  return createBackendActor(identity);
}

export async function listTournaments(
  identity?: Identity | null,
): Promise<TournamentDetail[]> {
  const actor = await requireActor(identity);
  if (!actor) return [];
  const rows = await actor.listTournaments();
  const list = rows.map(([id, info]) => mapTournament(id, info));
  setTournamentCacheMany(list);
  return list;
}

export async function loadTournament(
  id: string,
  identity?: Identity | null,
): Promise<TournamentDetail | null> {
  const actor = await requireActor(identity);
  if (!actor) return null;
  const opt = await actor.getTournamentInfo(id);
  const info = unwrapOpt(opt);
  if (!info) return null;
  const t = mapTournament(id, info);
  setTournamentCache(t);
  await mirrorTournament(t).catch(() => undefined);
  return t;
}

export type CreateTournamentInput = {
  creator: string;
  title: string;
  game: string;
  console: string;
  entryFeeIcp: number;
  maxPlayers: number;
  hostFeePct: number;
  description?: string;
  scheduledAt?: Date | null;
  betable?: boolean;
  teamEntry?: boolean;
  streamUrl?: string;
  payToken?: string;
};

export async function createTournament(
  input: CreateTournamentInput,
  identity?: Identity | null,
): Promise<string> {
  const actor = await requireActor(identity);
  if (!actor) throw new Error("No actor");
  const hostFeeBps = BigInt(Math.round(Math.min(10, Math.max(0, input.hostFeePct)) * 100));
  // Create tournament first without a real market id; host opens betable from detail
  // with outcome labels + escrow wiring (see openTournamentBetableMarket).
  const id = await actor.createTournamentEx(
    input.creator,
    icpToE8s(input.entryFeeIcp),
    input.payToken ?? "ICP",
    BigInt(input.maxPlayers),
    BigInt(0),
    false,
    input.game,
    input.description ?? "",
    input.title,
    input.console,
    dateToNs(input.scheduledAt),
    Boolean(input.betable),
    "", // marketId linked later when opening real betable market
    hostFeeBps,
    Boolean(input.teamEntry),
    input.streamUrl ?? "",
  );
  const t = await loadTournament(id, identity);
  if (t) await mirrorTournament(t);
  return id;
}

export async function joinTournament(
  id: string,
  player: string,
  identity?: Identity | null,
  opts?: {
    /** Display name for betable outcome label */
    label?: string;
    avatarUrl?: string;
    /** Team id when team-entry; else player address */
    sourceId?: string;
    sourceKind?: "team" | "player";
  },
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  const ok = await actor.joinTournament(id, player);
  if (!ok) return false;

  // Sync multi-outcome roster on linked Esports market (join only — not loss)
  try {
    const t = await loadTournament(id, identity);
    if (t?.betable && t.marketId) {
      const { addEsportsOutcome } = await import("./betable-service");
      await addEsportsOutcome({
        marketId: t.marketId,
        entityId: id,
        entityKind: "tournament",
        label: opts?.label || player,
        avatarUrl: opts?.avatarUrl,
        sourceId: opts?.sourceId || player,
        sourceKind: opts?.sourceKind || (t.teamEntry ? "team" : "player"),
      });
    }
  } catch {
    /* non-fatal — join already succeeded */
  }
  return true;
}

/** Leave/withdraw from tournament (not match loss) — soft-remove betable outcome. */
export async function withdrawTournamentOutcome(
  tournamentId: string,
  sourceId: string,
  identity?: Identity | null,
): Promise<boolean> {
  const t = await loadTournament(tournamentId, identity);
  if (!t?.betable || !t.marketId) return true;
  const { removeEsportsOutcome } = await import("./betable-service");
  const r = await removeEsportsOutcome({
    marketId: t.marketId,
    sourceId,
    entityId: tournamentId,
  });
  return r.ok;
}

export async function setTournamentBetable(
  id: string,
  who: string,
  betable: boolean,
  marketId: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  const ok = await actor.setTournamentBetable(id, who, betable, marketId);
  if (ok) await loadTournament(id, identity);
  return ok;
}

export async function getTournamentEscrow(
  id: string,
  identity?: Identity | null,
): Promise<{ ownerPrincipal: string; subaccount: number[]; address: string }> {
  const actor = await requireActor(identity);
  if (!actor) throw new Error("No actor");
  const [ownerPrincipal, subRaw, address] = await Promise.all([
    actor.getBackendPrincipal(),
    actor.getTournamentSubaccount(id),
    actor.getTournamentDepositAddressICP(id),
  ]);
  const subaccount = Array.from(subRaw as number[] | Uint8Array);
  return { ownerPrincipal, subaccount, address };
}

export async function markTournamentBetableSettled(
  id: string,
  who: string,
  settled: boolean,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;
  return actor.markBetableSettled(id, who, settled);
}

export async function isTournamentBetableSettled(
  id: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return true;
  return actor.isBetableSettled(id);
}

export type TeamClaimLine = {
  member: string;
  winSplitBps: number;
  winSplitPct: number;
  amountIcp: number;
};

export type TeamClaimPreview = {
  potIcp: number;
  hostFeeBps: number;
  hostFeePct: number;
  hostCutIcp: number;
  platformRakeIcp: number;
  teamPrizePoolIcp: number;
  teamId: string;
  lines: TeamClaimLine[];
  splitsValid: boolean;
  splitsTotalBps: number;
};

export async function previewTeamClaim(
  tournamentId: string,
  potIcp: number,
  winningTeamId: string,
  identity?: Identity | null,
): Promise<TeamClaimPreview | null> {
  const actor = await requireActor(identity);
  if (!actor) return null;
  const opt = await actor.previewTeamTournamentClaim(
    tournamentId,
    icpToE8s(potIcp),
    winningTeamId,
  );
  const p = unwrapOpt(opt);
  if (!p) return null;
  return {
    potIcp: e8sToIcp(p.pot),
    hostFeeBps: Number(p.hostFeeBps),
    hostFeePct: Number(p.hostFeeBps) / 100,
    hostCutIcp: e8sToIcp(p.hostCut),
    platformRakeIcp: e8sToIcp(p.platformRake),
    teamPrizePoolIcp: e8sToIcp(p.teamPrizePool),
    teamId: p.teamId,
    lines: p.lines.map((l) => ({
      member: l.member,
      winSplitBps: Number(l.winSplitBps),
      winSplitPct: Number(l.winSplitBps) / 100,
      amountIcp: e8sToIcp(l.amount),
    })),
    splitsValid: p.splitsValid,
    splitsTotalBps: Number(p.splitsTotalBps),
  };
}

export async function claimTournamentTeam(
  tournamentId: string,
  potIcp: number,
  winningTeamId: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;

  // Finalize betable market first (settled before prize claim)
  const t = await loadTournament(tournamentId, identity);
  if (t?.betable && t.marketId) {
    const { settleEsportsMarket, isBetableMarketSettled, getBetableMarket } =
      await import("./betable-service");
    const m = await getBetableMarket(t.marketId, identity);
    if (!isBetableMarketSettled(m)) {
      const settled = await settleEsportsMarket({
        marketId: t.marketId,
        winningSourceId: winningTeamId,
        entityId: tournamentId,
        entityKind: "tournament",
      });
      if (!settled.ok) {
        throw new Error(
          settled.error ||
            "Failed to settle betable market — resolve market before claim",
        );
      }
    }
    await markTournamentBetableSettled(tournamentId, t.hostUsername, true, identity);
  }

  return actor.claimTournamentTeam(
    tournamentId,
    icpToE8s(potIcp),
    winningTeamId,
    BigInt(0),
  );
}

export async function claimTournamentSolo(
  tournamentId: string,
  potIcp: number,
  winner: string,
  identity?: Identity | null,
): Promise<boolean> {
  const actor = await requireActor(identity);
  if (!actor) return false;

  const t = await loadTournament(tournamentId, identity);
  if (t?.betable && t.marketId) {
    const { settleEsportsMarket, isBetableMarketSettled, getBetableMarket } =
      await import("./betable-service");
    const m = await getBetableMarket(t.marketId, identity);
    if (!isBetableMarketSettled(m)) {
      const settled = await settleEsportsMarket({
        marketId: t.marketId,
        winningSourceId: winner,
        entityId: tournamentId,
        entityKind: "tournament",
      });
      if (!settled.ok) {
        throw new Error(
          settled.error ||
            "Failed to settle betable market — resolve market before claim",
        );
      }
    }
    await markTournamentBetableSettled(tournamentId, t.hostUsername, true, identity);
  }

  return actor.claimTournament(
    tournamentId,
    icpToE8s(potIcp),
    winner,
    BigInt(0),
  );
}

/**
 * Open / attach a real betable Esports market for a tournament.
 * Creates market on betable (caller = host must hold Esports access), then stores marketId on tournament.
 */
export async function openTournamentBetableMarket(
  params: {
    tournamentId: string;
    hostWho: string;
    title: string;
    description?: string;
    /** Required — sent to betable title/description/resolution */
    game: string;
    /** Required — sent to betable title/description/resolution */
    console: string;
    /** Team / player outcome labels (non-users OK) */
    outcomes: string[];
    closeDate: Date;
    liveStreamUrl?: string;
    resolutionCriteria?: string;
  },
  identity?: Identity | null,
): Promise<{ marketId: string }> {
  const {
    createEsportsBetableMarket,
    isBetableConfigured,
  } = await import("./betable-service");
  if (!isBetableConfigured()) {
    throw new Error(
      "Betable factory not configured (NEXT_PUBLIC_BETABLE_MARKET_FACTORY_ID)",
    );
  }
  if (!params.game?.trim() || !params.console?.trim()) {
    throw new Error("game and console are required for betable market create");
  }
  const escrow = await getTournamentEscrow(params.tournamentId, identity);
  const { marketId } = await createEsportsBetableMarket(
    {
      title: params.title,
      description:
        params.description ??
        `Gamerholic tournament ${params.tournamentId} outcome market.`,
      game: params.game,
      console: params.console,
      outcomes: params.outcomes,
      closeDate: params.closeDate,
      resolutionCriteria:
        params.resolutionCriteria ??
        `Winning team/player for ${params.game} (${params.console}) per official gamerholic tournament result and host confirmation.`,
      escrowOwnerPrincipal: escrow.ownerPrincipal,
      escrowSubaccount: escrow.subaccount,
      liveStreamUrl: params.liveStreamUrl,
      entityId: params.tournamentId,
      entityKind: "tournament",
    },
    identity,
  );

  // Link entity + seed outcomes (name/avatar/source_id) on betable esports API
  try {
    const { linkEsportsOutcomes } = await import("./betable-service");
    const seeded = params.outcomes.map((label, i) => ({
      label,
      avatar_url: "",
      source_id: `seed-${i}-${label.slice(0, 24)}`,
      source_kind: "team" as const,
    }));
    await linkEsportsOutcomes({
      marketId,
      entityId: params.tournamentId,
      entityKind: "tournament",
      outcomes: seeded,
    });
  } catch {
    /* host II may still need operator registration for on-chain link */
  }

  const ok = await setTournamentBetable(
    params.tournamentId,
    params.hostWho,
    true,
    marketId,
    identity,
  );
  if (!ok) {
    throw new Error(
      `Market ${marketId} created on betable but failed to link on tournament (schedule ≥1h or host mismatch)`,
    );
  }
  return { marketId };
}
